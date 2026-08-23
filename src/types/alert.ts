/**
 * WattWise AI - Load Alert Data Models & Type Definitions
 */

import { PowerClassificationLevel } from './energy';

/**
 * Power classification levels that are severe enough to raise an email alert.
 * LOW and NORMAL never notify.
 */
export type AlertLevel = Extract<PowerClassificationLevel, 'HIGH' | 'CRITICAL'>;

/**
 * A single alert that was raised and (attempted to be) emailed.
 */
export interface AlertRecord {
  id: string;
  level: AlertLevel;
  power: number;
  voltage: number;
  current: number;
  energy: number;
  /** ISO timestamp of when the alert fired. */
  raisedAt: string;
  /** Email address the alert was addressed to. */
  recipient: string;
  delivered: boolean;
  /** Populated only when delivery failed. */
  failureReason?: string;
}

/**
 * Per-account alert preferences, persisted on device.
 */
export interface AlertPreferences {
  /** Master switch for email alerts. */
  enabled: boolean;
  /** Minimum severity that triggers an email. */
  minimumLevel: AlertLevel;
}

/**
 * Cooldown bookkeeping: the last time each level was successfully emailed.
 * Persisted so a restart cannot be used to bypass the cooldown.
 */
export type AlertCooldownMap = Partial<Record<AlertLevel, string>>;

/**
 * Stable, provider-independent email delivery error codes.
 */
export type EmailErrorCode =
  | 'NOT_CONFIGURED'
  | 'INVALID_RECIPIENT'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'PROVIDER_ERROR';

/**
 * The provider-agnostic message handed to the email transport.
 */
export interface AlertEmailMessage {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  /** Plain-text body, used when a template renders `{{message}}`. */
  body: string;
  /** Individual readings, exposed to the email template as named variables. */
  variables: Record<string, string>;
}

/**
 * Outcome of an alert evaluation, surfaced to the UI.
 */
export interface AlertDispatchResult {
  status: 'SENT' | 'SUPPRESSED_COOLDOWN' | 'SUPPRESSED_DISABLED' | 'NOT_CONFIGURED' | 'FAILED';
  message: string;
  record?: AlertRecord;
}
