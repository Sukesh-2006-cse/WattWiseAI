/**
 * WattWise AI - Free Mobile Heads-Up Notification Service
 * 100% Compatible with Expo Go on Android, iOS, and Web.
 * Delivers instant top-of-screen heads-up banners with hardware haptics
 * and persistent Notification Inbox storage.
 */

import { Platform, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@wattwise_notification_history_v1';

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  type: 'LOAD_DETECTED' | 'OVER_CURRENT' | 'BILL_PREDICTION' | 'LOAD_DISCONNECTED' | 'VOLTAGE_ANOMALY' | 'CUSTOM';
  timestamp: string;
  read?: boolean;
  data?: Record<string, any>;
}

type NotificationListener = (notification: NotificationPayload) => void;
type HistoryListener = (history: NotificationPayload[]) => void;

const listeners = new Set<NotificationListener>();
const historyListeners = new Set<HistoryListener>();

// In-memory cache of notification history
let cachedHistory: NotificationPayload[] = [];
let isInitialized = false;

// Default initial starter alerts
const DEFAULT_INITIAL_NOTIFICATIONS: NotificationPayload[] = [
  {
    id: 'init-1',
    title: '⚡ TANGEDCO 100 Free Units Active',
    body: 'Tamil Nadu domestic tariff LT-1A subsidized tier applied. 0-100 kWh free of cost.',
    type: 'BILL_PREDICTION',
    timestamp: 'Today',
    read: true,
  },
  {
    id: 'init-2',
    title: '💡 Smart Sensor Ready',
    body: 'Hardware telemetry online. Single 40W bulb test active at 230V AC nominal.',
    type: 'LOAD_DETECTED',
    timestamp: 'Today',
    read: true,
  },
];

/**
 * Load saved notification history from AsyncStorage
 */
export async function getStoredNotifications(): Promise<NotificationPayload[]> {
  if (isInitialized) return cachedHistory;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      cachedHistory = JSON.parse(raw);
    } else {
      cachedHistory = [...DEFAULT_INITIAL_NOTIFICATIONS];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cachedHistory));
    }
  } catch {
    cachedHistory = [...DEFAULT_INITIAL_NOTIFICATIONS];
  }

  isInitialized = true;
  return cachedHistory;
}

/**
 * Save notification history and notify listeners
 */
async function persistHistory(newList: NotificationPayload[]) {
  cachedHistory = newList;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  } catch (err) {
    console.warn('Could not save notifications to storage:', err);
  }
  historyListeners.forEach((l) => {
    try {
      l(cachedHistory);
    } catch {}
  });
}

/**
 * Subscribe to new heads-up notification banner events
 */
export function addNotificationListener(listener: NotificationListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Subscribe to notification history inbox changes
 */
export function addNotificationHistoryListener(listener: HistoryListener): () => void {
  historyListeners.add(listener);
  getStoredNotifications().then((list) => listener(list)).catch(() => {});
  return () => {
    historyListeners.delete(listener);
  };
}

/**
 * Mark all notifications in the inbox as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  const current = await getStoredNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  await persistHistory(updated);
}

/**
 * Delete a specific notification from the inbox
 */
export async function deleteNotification(id: string): Promise<void> {
  const current = await getStoredNotifications();
  const updated = current.filter((n) => n.id !== id);
  await persistHistory(updated);
}

/**
 * Clear all notifications in the inbox
 */
export async function clearAllNotifications(): Promise<void> {
  await persistHistory([]);
}

/**
 * Request notification permissions (for web browsers, no-op on native Expo Go)
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      try {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      } catch {
        return false;
      }
    }
  }
  return true;
}

/**
 * Trigger an instant Heads-Up Notification
 * Pops at the top of the phone screen with vibration and saves into the notification inbox.
 */
export async function sendPushNotification(
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<{ success: boolean; messageId: string }> {
  const id = 'notif-' + Date.now();
  const payload: NotificationPayload = {
    id,
    title,
    body,
    type: data.type || 'CUSTOM',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false,
    data,
  };

  // 1. Hardware vibration pulse
  if (Platform.OS !== 'web') {
    try {
      Vibration.vibrate([0, 250, 120, 250]);
    } catch {}
  }

  // 2. Add to persistent Notification Inbox
  const existing = await getStoredNotifications();
  const updated = [payload, ...existing.slice(0, 49)]; // keep latest 50
  await persistHistory(updated);

  // 3. Dispatch to top-level Heads-Up Banner (pins at top of screen)
  listeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (err) {
      console.warn('Listener dispatch error:', err);
    }
  });

  // 4. Web desktop notification fallback
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/favicon.png' });
    } catch {}
  }

  console.log(`🔔 Heads-Up Notification dispatched: "${title}"`);
  return { success: true, messageId: id };
}

// --- PRE-BUILT WATTWISE ALERT SCENARIOS ---

/**
 * 1. Load is Detected (e.g. 40W Bulb turned ON)
 */
export async function notifyLoadDetected(currentAmps: number, powerWatts: number) {
  return sendPushNotification(
    '💡 Load Detected: 40W Bulb Active',
    `Bulb switched ON! Active draw: ${powerWatts.toFixed(1)}W (${currentAmps.toFixed(3)}A at 230V).`,
    { type: 'LOAD_DETECTED', current: currentAmps, power: powerWatts }
  );
}

/**
 * 2. Over Current / Overload Detected
 */
export async function notifyOvercurrentDetected(currentAmps: number, thresholdAmps: number = 0.22) {
  return sendPushNotification(
    '🚨 Overcurrent Alert: Surge Detected!',
    `Current spiked to ${currentAmps.toFixed(3)}A exceeding safe limit (${thresholdAmps}A). Check your appliance immediately!`,
    { type: 'OVER_CURRENT', current: currentAmps, threshold: thresholdAmps }
  );
}

/**
 * 3. 24-Hour Daily Bill & Energy Prediction Report
 */
export async function notifyBillPrediction(
  projectedMonthlyKwh: number,
  subsidizedBill: number,
  isFreeTier: boolean
) {
  const billText = isFreeTier
    ? '₹0.00 (100% Free under TN 100 Units Scheme)'
    : `₹${subsidizedBill.toFixed(2)}`;

  return sendPushNotification(
    '📊 24h Energy & Bill Prediction',
    `Daily forecast: Projected monthly usage is ${projectedMonthlyKwh.toFixed(1)} kWh. Estimated bill: ${billText}.`,
    { type: 'BILL_PREDICTION', monthlyKwh: projectedMonthlyKwh, bill: subsidizedBill }
  );
}

/**
 * 4. Load Disconnected (Bulb turned OFF)
 */
export async function notifyLoadDisconnected() {
  return sendPushNotification(
    '🔌 Load Disconnected: Standby',
    'Bulb switched OFF. System returned to zero-power standby state.',
    { type: 'LOAD_DISCONNECTED' }
  );
}

/**
 * 5. Grid Voltage Anomaly
 */
export async function notifyVoltageAnomaly(voltage: number) {
  return sendPushNotification(
    '⚡ Grid Voltage Anomaly Alert',
    `Grid voltage recorded at ${voltage.toFixed(1)}V AC. Standard Tamil Nadu nominal is 230V.`,
    { type: 'VOLTAGE_ANOMALY', voltage }
  );
}
