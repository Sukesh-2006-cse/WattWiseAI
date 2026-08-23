/**
 * WattWise AI - On-Device Alert Preference, Cooldown & History Persistence
 *
 * The storage half of the alert pipeline. Every record is namespaced by account
 * uid, so two users signing in on the same device keep independent settings,
 * cooldowns, and alert history.
 *
 * Cooldowns are persisted (not just held in memory) so restarting the app
 * cannot be used to bypass the minimum gap between emails.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALERT_RULES, ALERT_STORAGE_KEYS, DEFAULT_ALERT_PREFERENCES } from '../constants/alerts';
import { AlertCooldownMap, AlertLevel, AlertPreferences, AlertRecord } from '../types/alert';

/** Builds the per-account storage key for a given namespace. */
function keyFor(namespace: string, uid: string): string {
  return `${namespace}/${uid}`;
}

/**
 * Reads a JSON value, falling back to `fallback` when absent or unparseable,
 * so a corrupt entry can never hard-crash the dashboard.
 */
async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

/* -------------------------------------------------------------------------- */
/* Preferences                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Reads the account's alert preferences, or the defaults on first run.
 */
export async function readPreferences(uid: string): Promise<AlertPreferences> {
  const stored = await readJson<Partial<AlertPreferences>>(
    keyFor(ALERT_STORAGE_KEYS.PREFERENCES, uid),
    {}
  );

  return {
    enabled: typeof stored.enabled === 'boolean' ? stored.enabled : DEFAULT_ALERT_PREFERENCES.enabled,
    minimumLevel: stored.minimumLevel ?? DEFAULT_ALERT_PREFERENCES.minimumLevel,
  };
}

/**
 * Persists the account's alert preferences.
 */
export async function writePreferences(
  uid: string,
  preferences: AlertPreferences
): Promise<void> {
  await writeJson(keyFor(ALERT_STORAGE_KEYS.PREFERENCES, uid), preferences);
}

/* -------------------------------------------------------------------------- */
/* Cooldowns                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Reads the last-sent timestamp for every alert level.
 */
export async function readCooldowns(uid: string): Promise<AlertCooldownMap> {
  return readJson<AlertCooldownMap>(keyFor(ALERT_STORAGE_KEYS.COOLDOWNS, uid), {});
}

/**
 * Records that `level` was just emailed, starting its cooldown window.
 */
export async function markLevelSent(
  uid: string,
  level: AlertLevel,
  sentAt: Date = new Date()
): Promise<void> {
  const cooldowns = await readCooldowns(uid);
  cooldowns[level] = sentAt.toISOString();
  await writeJson(keyFor(ALERT_STORAGE_KEYS.COOLDOWNS, uid), cooldowns);
}

/**
 * Returns the milliseconds remaining on `level`'s cooldown, or 0 when it is
 * clear to send.
 *
 * A stored timestamp in the future (a clock change, say) is treated as expired
 * rather than locking alerts out indefinitely.
 */
export function getCooldownRemainingMs(
  cooldowns: AlertCooldownMap,
  level: AlertLevel,
  now: Date = new Date()
): number {
  const lastSent = cooldowns[level];
  if (!lastSent) return 0;

  const lastSentMs = new Date(lastSent).getTime();
  if (isNaN(lastSentMs) || lastSentMs > now.getTime()) return 0;

  const elapsed = now.getTime() - lastSentMs;
  const window = ALERT_RULES.COOLDOWN_MS[level];
  return elapsed >= window ? 0 : window - elapsed;
}

/* -------------------------------------------------------------------------- */
/* History                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Reads the account's alert history, newest first.
 */
export async function readHistory(uid: string): Promise<AlertRecord[]> {
  const history = await readJson<AlertRecord[]>(keyFor(ALERT_STORAGE_KEYS.HISTORY, uid), []);
  return Array.isArray(history) ? history : [];
}

/**
 * Prepends a record to the account's history, trimmed to MAX_HISTORY entries.
 */
export async function appendHistory(uid: string, record: AlertRecord): Promise<AlertRecord[]> {
  const history = await readHistory(uid);
  const updated = [record, ...history].slice(0, ALERT_RULES.MAX_HISTORY);

  await writeJson(keyFor(ALERT_STORAGE_KEYS.HISTORY, uid), updated);
  return updated;
}

/**
 * Clears every alert record for the account. Preferences and cooldowns are
 * left untouched.
 */
export async function clearHistory(uid: string): Promise<void> {
  await AsyncStorage.removeItem(keyFor(ALERT_STORAGE_KEYS.HISTORY, uid));
}
