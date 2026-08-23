/**
 * WattWise AI - High Load Email Alert Watcher
 *
 * Watches the live power reading and raises an email alert when a heavy load is
 * *sustained*, not merely momentary. Runs only while a user is signed in, and
 * always mails the signed-in account's own address.
 *
 * Two independent guards keep the inbox sane:
 *   1. Sustain  - a level must hold for ALERT_RULES.SUSTAINED_READINGS polls
 *                 before it counts, so motor inrush and switching spikes are
 *                 ignored.
 *   2. Cooldown - enforced in `alertService` and persisted, so the same level
 *                 cannot mail again until its window elapses.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ALERT_RULES } from '../constants/alerts';
import { useAuth } from '../context/AuthContext';
import {
  dispatchLoadAlert,
  isEmailConfigured,
  meetsMinimumLevel,
} from '../services/alertService';
import { readHistory, readPreferences, writePreferences } from '../services/alertStore';
import { AlertDispatchResult, AlertLevel, AlertPreferences, AlertRecord } from '../types/alert';
import { EnergyData } from '../types/energy';
import { classifyPower } from '../utils/energyUtils';
import { DEFAULT_ALERT_PREFERENCES } from '../constants/alerts';

export interface UseLoadAlertsResult {
  /** Per-account alert settings. */
  preferences: AlertPreferences;
  /** Turns email alerts on or off for the signed-in account. */
  setEnabled: (enabled: boolean) => Promise<void>;
  /** Raises or lowers the severity that triggers an email. */
  setMinimumLevel: (level: AlertLevel) => Promise<void>;
  /** Alert records for this account, newest first. */
  history: AlertRecord[];
  /** Outcome of the most recent evaluation, or null before anything fired. */
  lastResult: AlertDispatchResult | null;
  /** The level currently being sustained, or null when load is normal. */
  activeLevel: AlertLevel | null;
  /** How many consecutive readings the active level has held. */
  sustainedReadings: number;
  /** Readings still required before the active level alerts. */
  readingsUntilAlert: number;
  /** False when the EmailJS keys are missing from .env. */
  isConfigured: boolean;
  /** True while an alert email is in flight. */
  sending: boolean;
}

/**
 * Narrows a power classification to an alertable level, or null.
 */
function toAlertLevel(power: number): AlertLevel | null {
  const level = classifyPower(power).level;
  return level === 'HIGH' || level === 'CRITICAL' ? level : null;
}

export function useLoadAlerts(reading: EnergyData | null): UseLoadAlertsResult {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [preferences, setPreferences] = useState<AlertPreferences>(DEFAULT_ALERT_PREFERENCES);
  const [history, setHistory] = useState<AlertRecord[]>([]);
  const [lastResult, setLastResult] = useState<AlertDispatchResult | null>(null);
  const [activeLevel, setActiveLevel] = useState<AlertLevel | null>(null);
  const [sustainedReadings, setSustainedReadings] = useState(0);
  const [sending, setSending] = useState(false);

  const isMountedRef = useRef(true);
  // Guards against a second dispatch starting while one is still in flight.
  const isDispatchingRef = useRef(false);
  // Tracks the reading already processed, so re-renders never double-count.
  const lastReadingKeyRef = useRef<string | null>(null);
  // Streak state lives in a ref as well as state: the effect must read the
  // current value without re-subscribing on every reading.
  const streakRef = useRef<{ level: AlertLevel | null; count: number }>({
    level: null,
    count: 0,
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Load this account's preferences and history whenever the signed-in user
   * changes, and reset any streak carried over from the previous session.
   */
  useEffect(() => {
    streakRef.current = { level: null, count: 0 };
    setActiveLevel(null);
    setSustainedReadings(0);
    setLastResult(null);

    if (!uid) {
      setPreferences(DEFAULT_ALERT_PREFERENCES);
      setHistory([]);
      return;
    }

    let cancelled = false;

    void (async () => {
      const [storedPreferences, storedHistory] = await Promise.all([
        readPreferences(uid),
        readHistory(uid),
      ]);

      if (cancelled || !isMountedRef.current) return;
      setPreferences(storedPreferences);
      setHistory(storedHistory);
    })();

    return () => {
      cancelled = true;
    };
  }, [uid]);

  /**
   * The watcher itself: one evaluation per new reading.
   */
  useEffect(() => {
    if (!uid || !reading) return;

    // De-duplicate: a re-render must not re-count the same reading.
    const readingKey = `${String(reading.timestamp)}-${reading.power}`;
    if (lastReadingKeyRef.current === readingKey) return;
    lastReadingKeyRef.current = readingKey;

    const level = toAlertLevel(reading.power);

    // Load returned to normal - clear the streak.
    if (!level) {
      streakRef.current = { level: null, count: 0 };
      setActiveLevel(null);
      setSustainedReadings(0);
      return;
    }

    // Same level continues, or a new level starts (including an escalation
    // from HIGH to CRITICAL, which deliberately restarts the count).
    const streak = streakRef.current;
    const nextCount = streak.level === level ? streak.count + 1 : 1;
    streakRef.current = { level, count: nextCount };

    setActiveLevel(level);
    setSustainedReadings(nextCount);

    // Not sustained long enough yet.
    if (nextCount < ALERT_RULES.SUSTAINED_READINGS) return;

    // Fire on the reading that first meets the threshold, then only every
    // REEVALUATE_EVERY_READINGS readings while it persists, so a long overload
    // re-alerts once the cooldown expires without hammering storage.
    const readingsPastThreshold = nextCount - ALERT_RULES.SUSTAINED_READINGS;
    if (readingsPastThreshold % ALERT_RULES.REEVALUATE_EVERY_READINGS !== 0) return;

    // Cheap local checks before touching storage or the network.
    if (!preferences.enabled) return;
    if (!meetsMinimumLevel(level, preferences.minimumLevel)) return;
    if (isDispatchingRef.current) return;

    isDispatchingRef.current = true;
    setSending(true);

    void (async () => {
      try {
        const result = await dispatchLoadAlert({
          uid,
          level,
          reading,
          recipientEmail: user?.email ?? null,
          recipientName: user?.displayName || user?.email || 'WattWise user',
        });

        if (!isMountedRef.current) return;
        setLastResult(result);

        // Only a real delivery attempt writes history; suppressions do not.
        if (result.record) {
          setHistory((previous) =>
            [result.record as AlertRecord, ...previous].slice(0, ALERT_RULES.MAX_HISTORY)
          );
        }
      } finally {
        isDispatchingRef.current = false;
        if (isMountedRef.current) setSending(false);
      }
    })();
  }, [reading, uid, user?.email, user?.displayName, preferences]);

  const persistPreferences = useCallback(
    async (next: AlertPreferences) => {
      setPreferences(next);
      if (uid) await writePreferences(uid, next);
    },
    [uid]
  );

  const setEnabled = useCallback(
    (enabled: boolean) => persistPreferences({ ...preferences, enabled }),
    [preferences, persistPreferences]
  );

  const setMinimumLevel = useCallback(
    (minimumLevel: AlertLevel) => persistPreferences({ ...preferences, minimumLevel }),
    [preferences, persistPreferences]
  );

  const readingsUntilAlert = activeLevel
    ? Math.max(ALERT_RULES.SUSTAINED_READINGS - sustainedReadings, 0)
    : ALERT_RULES.SUSTAINED_READINGS;

  return {
    preferences,
    setEnabled,
    setMinimumLevel,
    history,
    lastResult,
    activeLevel,
    sustainedReadings,
    readingsUntilAlert,
    isConfigured: isEmailConfigured(),
    sending,
  };
}
