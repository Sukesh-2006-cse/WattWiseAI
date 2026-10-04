/**
 * WattWise AI - Universal Notification Service
 * Fully guarded for Expo Go, development builds, and web browsers.
 * Uses expo-notifications where supported, with automatic zero-crash fallback
 * to React Native Alert modal and in-app banners when running inside Expo Go.
 */

import { Alert, Platform } from 'react-native';

// Safe dynamic reference to expo-notifications
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
  if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
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
} catch (e) {
  console.warn('⚠️ expo-notifications native module not available in this environment. Using Alert fallback.');
}

let isChannelSet = false;

/**
 * Request notification permissions safely
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  // Web browser fallback
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
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
    return false;
  }

  // Native check
  if (!Notifications || typeof Notifications.getPermissionsAsync !== 'function') {
    return true; // Use Alert fallback
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted' && typeof Notifications.requestPermissionsAsync === 'function') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Set Android notification channel safely
    if (Platform.OS === 'android' && !isChannelSet && typeof Notifications.setNotificationChannelAsync === 'function') {
      try {
        await Notifications.setNotificationChannelAsync('wattwise-alerts', {
          name: 'WattWise Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#22C55E',
          sound: 'default',
        });
        isChannelSet = true;
      } catch (channelErr) {
        // Suppress channel setup error in Expo Go
      }
    }

    return finalStatus === 'granted';
  } catch (err: any) {
    console.warn('Notification permission check caught:', err?.message || err);
    return false;
  }
}

/**
 * Trigger notification on mobile (Expo Go local push or Alert dialog) or web browser
 */
export async function sendPushNotification(
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<{ success: boolean; messageId?: string }> {
  // 1. Web Browser notification
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/favicon.png' });
        return { success: true, messageId: 'web-' + Date.now() };
      } catch {}
    }
    // Web Alert fallback
    if (typeof alert !== 'undefined') {
      alert(`${title}\n\n${body}`);
    }
    return { success: true, messageId: 'web-alert' };
  }

  // 2. Try native notification via expo-notifications
  if (Notifications && typeof Notifications.scheduleNotificationAsync === 'function') {
    try {
      await requestNotificationPermissions();

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority?.MAX ?? 2,
        },
        trigger: null, // trigger immediately
      });

      console.log(`🔔 Push notification delivered: "${title}" (ID: ${id})`);
      return { success: true, messageId: id };
    } catch (scheduleErr: any) {
      console.warn('expo-notifications schedule failed in Expo Go, falling back to Alert modal:', scheduleErr?.message);
    }
  }

  // 3. Guaranteed zero-crash fallback: Native React Native Alert Dialog
  Alert.alert(title, body, [{ text: 'OK', style: 'default' }], { cancelable: true });
  return { success: true, messageId: 'alert-fallback-' + Date.now() };
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
