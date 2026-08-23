/**
 * WattWise AI - Load Alert & Email Delivery Constants
 */

import { AlertLevel } from '../types/alert';

/**
 * EmailJS configuration, sourced exclusively from Expo public env variables.
 *
 * The Service ID, Template ID and Public Key are all public client identifiers
 * by EmailJS's own design - delivery is restricted by the allow-list and rate
 * limits configured in the EmailJS dashboard, not by hiding these values.
 */
export const EMAILJS_CONFIG = {
  API_URL: 'https://api.emailjs.com/api/v1.0/email/send',
  SERVICE_ID: process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || '',
  TEMPLATE_ID: process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || '',
  PUBLIC_KEY: process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || '',
  TIMEOUT_MS: 10000,
};

/**
 * Placeholder values shipped in `.env.example`. If the runtime config still
 * holds one of these, email alerts have not been set up yet.
 */
export const EMAILJS_PLACEHOLDERS = [
  'YOUR_EMAILJS_SERVICE_ID',
  'YOUR_EMAILJS_TEMPLATE_ID',
  'YOUR_EMAILJS_PUBLIC_KEY',
];

/**
 * AsyncStorage keys for alert state. All are namespaced per account uid, so
 * two users on the same device keep separate preferences and cooldowns.
 */
export const ALERT_STORAGE_KEYS = {
  PREFERENCES: '@wattwise/alerts/preferences',
  COOLDOWNS: '@wattwise/alerts/cooldowns',
  HISTORY: '@wattwise/alerts/history',
};

/**
 * Alert triggering rules.
 */
export const ALERT_RULES = {
  /**
   * Consecutive readings a level must hold before an alert is raised.
   * At the ~5s poll interval, 3 readings is roughly 15 seconds - long enough to
   * ignore motor inrush and switching spikes, short enough to be timely.
   */
  SUSTAINED_READINGS: 3,

  /**
   * Minimum gap between emails of the same level, per account.
   * Prevents an appliance that sits at HIGH LOAD from mailing every 5 seconds.
   */
  COOLDOWN_MS: {
    HIGH: 30 * 60 * 1000, // 30 minutes
    CRITICAL: 10 * 60 * 1000, // 10 minutes - more urgent, alerts more often
  } as Record<AlertLevel, number>,

  /** Severity ordering, used so CRITICAL can escalate past a HIGH cooldown. */
  SEVERITY: {
    HIGH: 1,
    CRITICAL: 2,
  } as Record<AlertLevel, number>,

  /**
   * While a load stays above threshold, re-attempt delivery every N readings
   * (~60s at the 5s poll interval) so a long overload alerts again once its
   * cooldown expires - without touching storage on every single reading.
   */
  REEVALUATE_EVERY_READINGS: 12,

  /** Maximum alert records retained on device. */
  MAX_HISTORY: 25,
};

/**
 * Default per-account preferences applied before a user changes anything.
 */
export const DEFAULT_ALERT_PREFERENCES = {
  enabled: true,
  minimumLevel: 'HIGH' as AlertLevel,
};
