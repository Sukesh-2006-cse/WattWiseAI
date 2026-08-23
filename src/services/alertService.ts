/**
 * WattWise AI - Load Alert Orchestration
 *
 * Owns the policy half of the alert pipeline: whether an alert is allowed to
 * fire right now, what the email says, and what gets recorded afterwards.
 *
 * Delivery is delegated to `emailService`, persistence to `alertStore`, so the
 * decision logic here stays independent of both the mail provider and storage.
 */

import { ALERT_RULES } from '../constants/alerts';
import { POWER_THRESHOLDS } from '../constants/blynk';
import {
  AlertDispatchResult,
  AlertEmailMessage,
  AlertLevel,
  AlertRecord,
} from '../types/alert';
import { EnergyData } from '../types/energy';
import { formatValue } from '../utils/energyUtils';
import {
  appendHistory,
  getCooldownRemainingMs,
  markLevelSent,
  readCooldowns,
  readPreferences,
} from './alertStore';
import { EmailServiceError, isEmailConfigured, sendAlertEmail } from './emailService';

export { isEmailConfigured };

/** Human-readable copy for each alert level. */
const LEVEL_COPY: Record<AlertLevel, { label: string; threshold: string; guidance: string }> = {
  HIGH: {
    label: 'HIGH LOAD',
    threshold: `${POWER_THRESHOLDS.NORMAL_MAX} W - ${POWER_THRESHOLDS.HIGH_MAX} W`,
    guidance:
      'Several heavy appliances appear to be running at once. Consider staggering them to reduce your peak demand and bill.',
  },
  CRITICAL: {
    label: 'CRITICAL LOAD',
    threshold: `above ${POWER_THRESHOLDS.HIGH_MAX} W`,
    guidance:
      'Power draw has exceeded the critical threshold. Check for overloaded circuits or a faulty appliance, and reduce load promptly.',
  },
};

/**
 * Formats the cooldown remainder for display, e.g. "12 min" or "45 sec".
 */
export function formatCooldown(remainingMs: number): string {
  if (remainingMs <= 0) return 'ready';

  const minutes = Math.ceil(remainingMs / 60000);
  if (minutes >= 1) return `${minutes} min`;
  return `${Math.ceil(remainingMs / 1000)} sec`;
}

/**
 * Builds the alert email for a reading.
 */
function composeMessage(
  level: AlertLevel,
  reading: EnergyData,
  recipientEmail: string,
  recipientName: string,
  raisedAt: Date
): AlertEmailMessage {
  const copy = LEVEL_COPY[level];
  const power = formatValue(reading.power, 2);
  const timestamp = raisedAt.toLocaleString();

  const subject = `WattWise AI: ${copy.label} detected - ${power} W`;

  const body = [
    `${copy.label} DETECTED`,
    '',
    `Your energy monitor recorded a sustained ${copy.label.toLowerCase()} on your circuit.`,
    '',
    `Power:     ${power} W  (threshold: ${copy.threshold})`,
    `Voltage:   ${formatValue(reading.voltage, 2)} V`,
    `Current:   ${formatValue(reading.current, 4)} A`,
    `Energy:    ${formatValue(reading.energy, 5)} kWh`,
    `Status:    ${reading.status || 'LOAD DETECTED'}`,
    `Detected:  ${timestamp}`,
    '',
    copy.guidance,
    '',
    '-- WattWise AI, Smart Energy Monitoring',
  ].join('\n');

  return {
    recipientEmail,
    recipientName,
    subject,
    body,
    variables: {
      alert_level: copy.label,
      power: `${power} W`,
      voltage: `${formatValue(reading.voltage, 2)} V`,
      current: `${formatValue(reading.current, 4)} A`,
      energy: `${formatValue(reading.energy, 5)} kWh`,
      device_status: reading.status || 'LOAD DETECTED',
      threshold: copy.threshold,
      guidance: copy.guidance,
      detected_at: timestamp,
    },
  };
}

/**
 * Decides whether `level` may alert right now for this account.
 *
 * A higher-severity level is allowed through even while a lower level is in
 * cooldown - a HIGH alert 5 minutes ago must not silence a CRITICAL one.
 */
async function isAllowedToSend(
  uid: string,
  level: AlertLevel,
  now: Date
): Promise<{ allowed: boolean; remainingMs: number }> {
  const cooldowns = await readCooldowns(uid);
  const remainingMs = getCooldownRemainingMs(cooldowns, level, now);

  return { allowed: remainingMs <= 0, remainingMs };
}

/**
 * Returns true when `level` meets or exceeds the account's minimum severity.
 */
export function meetsMinimumLevel(level: AlertLevel, minimumLevel: AlertLevel): boolean {
  return ALERT_RULES.SEVERITY[level] >= ALERT_RULES.SEVERITY[minimumLevel];
}

/**
 * Evaluates and, if permitted, sends one load alert email.
 *
 * Every outcome (sent, suppressed, failed) is returned rather than thrown, so
 * the caller can surface alert state in the UI without try/catch. Failures are
 * still written to history so a user can see that delivery was attempted.
 */
export async function dispatchLoadAlert(params: {
  uid: string;
  level: AlertLevel;
  reading: EnergyData;
  recipientEmail: string | null;
  recipientName: string;
}): Promise<AlertDispatchResult> {
  const { uid, level, reading, recipientEmail, recipientName } = params;
  const now = new Date();

  const preferences = await readPreferences(uid);
  if (!preferences.enabled) {
    return { status: 'SUPPRESSED_DISABLED', message: 'Email alerts are turned off.' };
  }

  if (!meetsMinimumLevel(level, preferences.minimumLevel)) {
    return {
      status: 'SUPPRESSED_DISABLED',
      message: `${LEVEL_COPY[level].label} is below your alert threshold.`,
    };
  }

  if (!isEmailConfigured()) {
    return {
      status: 'NOT_CONFIGURED',
      message: 'Email alerts are not configured. Add your EXPO_PUBLIC_EMAILJS_* keys to .env.',
    };
  }

  const { allowed, remainingMs } = await isAllowedToSend(uid, level, now);
  if (!allowed) {
    return {
      status: 'SUPPRESSED_COOLDOWN',
      message: `${LEVEL_COPY[level].label} already alerted. Next email in ${formatCooldown(
        remainingMs
      )}.`,
    };
  }

  const record: AlertRecord = {
    id: `${level}-${now.getTime()}`,
    level,
    power: reading.power,
    voltage: reading.voltage,
    current: reading.current,
    energy: reading.energy,
    raisedAt: now.toISOString(),
    recipient: recipientEmail ?? '',
    delivered: false,
  };

  try {
    const message = composeMessage(level, reading, recipientEmail ?? '', recipientName, now);
    await sendAlertEmail(message);

    // Start the cooldown only after a confirmed send, so a failed attempt does
    // not silence the next genuine alert.
    await markLevelSent(uid, level, now);
    const delivered: AlertRecord = { ...record, delivered: true };
    await appendHistory(uid, delivered);

    return {
      status: 'SENT',
      message: `${LEVEL_COPY[level].label} alert emailed to ${recipientEmail}.`,
      record: delivered,
    };
  } catch (error: any) {
    const failureReason =
      error instanceof EmailServiceError
        ? error.message
        : error?.message || 'Alert email could not be sent.';

    const failed: AlertRecord = { ...record, failureReason };
    await appendHistory(uid, failed);

    return {
      status: error instanceof EmailServiceError && error.code === 'NOT_CONFIGURED'
        ? 'NOT_CONFIGURED'
        : 'FAILED',
      message: failureReason,
      record: failed,
    };
  }
}
