/**
 * WattWise AI - Free Push & Local Notification Service
 * Supports Expo Go on Android & iOS with zero setup/subscription costs,
 * with graceful fallback to Web Notifications API in desktop browsers.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure foreground notification behavior (alert banner, sound, badge)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

let isConfigured = false;

/**
 * Request notification permissions from user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      }
    }
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Push notification permission was not granted by user.');
      return false;
    }

    // Set Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('wattwise-alerts', {
        name: 'WattWise Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22C55E',
        sound: 'default',
      });
    }

    isConfigured = true;
    return true;
  } catch (err: any) {
    console.warn('Could not request notification permissions:', err.message);
    return false;
  }
}

/**
 * Trigger an instant push notification on mobile or web
 */
export async function sendPushNotification(
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<{ success: boolean; messageId?: string }> {
  // 1. Web Browser notification fallback
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.png' });
      return { success: true, messageId: 'web-' + Date.now() };
    }
    return { success: true, messageId: 'web-fallback' };
  }

  // 2. Native mobile notification via Expo Go
  try {
    await requestNotificationPermissions();

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null, // null means trigger immediately
    });

    console.log(`🔔 Push notification sent: "${title}" (ID: ${id})`);
    return { success: true, messageId: id };
  } catch (err: any) {
    console.error('Failed to send local push notification:', err.message);
    return { success: false };
  }
}

// --- PRE-BUILT WATTWISE ALERT SCENARIOS ---

/**
 * 1. Load is Detected (e.g. 40W Bulb turned ON)
 */
export async function notifyLoadDetected(currentAmps: number, powerWatts: number) {
  return sendPushNotification(
    '💡 Load Detected (40W Bulb Active)',
    `Bulb switched ON! Active draw: ${powerWatts.toFixed(1)}W (${currentAmps.toFixed(3)}A at 230V).`,
    { type: 'LOAD_DETECTED', current: currentAmps, power: powerWatts }
  );
}

/**
 * 2. Over Current / Overload Detected
 */
export async function notifyOvercurrentDetected(currentAmps: number, thresholdAmps: number = 0.22) {
  return sendPushNotification(
    '⚠️ Overcurrent / Surge Alert!',
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
    '🔌 Load Disconnected (Standby)',
    'Bulb switched OFF. System returned to zero-power standby state.',
    { type: 'LOAD_DISCONNECTED' }
  );
}

/**
 * 5. Grid Voltage Anomaly
 */
export async function notifyVoltageAnomaly(voltage: number) {
  return sendPushNotification(
    '⚡ Grid Voltage Anomaly',
    `Grid voltage recorded at ${voltage.toFixed(1)}V AC. Standard Tamil Nadu nominal is 230V.`,
    { type: 'VOLTAGE_ANOMALY', voltage }
  );
}
