/**
 * WattWise AI - Free Push & Local Notification Service
 * Fully enabled for Expo Go on Android, iOS, and Web.
 * Delivers instant notifications with sound, vibration, and system tray alerts.
 */

import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure foreground notification behavior (alert banner, sound, badge)
if (Platform.OS !== 'web') {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    // Non-blocking fallback
  }
}

let isChannelConfigured = false;

/**
 * Request notification permissions safely
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  // 1. Web browser permissions
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

  // 2. Native mobile permissions (Android & iOS)
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Set Android notification channel
    if (Platform.OS === 'android' && !isChannelConfigured) {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'WattWise Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#22C55E',
        });
        isChannelConfigured = true;
      } catch (channelErr) {
        // Channel setup error suppressed
      }
    }

    return finalStatus === 'granted';
  } catch (err: any) {
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
  // 1. Web Browser notification
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/favicon.png' });
        return { success: true, messageId: 'web-' + Date.now() };
      } catch {}
    }
    if (typeof alert !== 'undefined') {
      alert(`${title}\n\n${body}`);
    }
    return { success: true, messageId: 'web-alert' };
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
      trigger: null, // immediate delivery
    });

    console.log(`🔔 Push notification delivered: "${title}" (ID: ${id})`);
    return { success: true, messageId: id };
  } catch (err: any) {
    console.warn('scheduleNotificationAsync fallback:', err?.message || err);
    Alert.alert(title, body, [{ text: 'OK', style: 'default' }], { cancelable: true });
    return { success: true, messageId: 'alert-fallback' };
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
