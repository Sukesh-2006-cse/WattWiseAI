/**
 * WattWise AI - Backend API Integration Service
 * Communicates with the WattWise Node.js Express & MongoDB Atlas backend.
 */

import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EnergyData } from '../types/energy';
import {
  BillPredictionResponse,
  SimulationParams,
  SimulationResult,
  TariffInfoResponse,
} from '../types/prediction';

const STORAGE_KEY_BACKEND_URL = '@wattwise_backend_url';
let cachedBackendUrl: string | null = null;

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  mobile: string;
  lastLogin?: string;
}

/**
 * Dynamically extract the Metro Bundler host IP from React Native runtime
 */
function getMetroHostIp(): string | null {
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return match[1];
      }
    }
  } catch {}
  return null;
}

/**
 * Get the currently configured backend URL.
 * Checks AsyncStorage first (user configured), falling back to dynamic Metro host and active IP.
 */
export async function getBackendUrl(): Promise<string> {
  if (cachedBackendUrl && !cachedBackendUrl.includes('10.10.39.4')) {
    return cachedBackendUrl;
  }

  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_BACKEND_URL);
    if (saved && saved.trim() && !saved.includes('10.10.39.4')) {
      cachedBackendUrl = saved.trim().replace(/\/+$/, '');
      return cachedBackendUrl;
    }
  } catch (e) {
    // Ignore storage read error
  }

  // 1. Try extracting host IP from Metro bundler URL
  const metroHost = getMetroHostIp();
  if (metroHost) {
    const autoUrl = `http://${metroHost}:5000`;
    cachedBackendUrl = autoUrl;
    return autoUrl;
  }

  // 2. Check process.env.EXPO_PUBLIC_BACKEND_URL if not pointing to obsolete IP
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && !envUrl.includes('10.10.39.4')) {
    const clean = envUrl.replace(/\/+$/, '');
    cachedBackendUrl = clean;
    return clean;
  }

  // 3. Fallback to active network IP
  const defaultUrl = 'http://172.16.4.238:5000';
  cachedBackendUrl = defaultUrl;
  return defaultUrl;
}

/**
 * Update the backend URL and persist it to AsyncStorage.
 */
export async function setBackendUrl(url: string): Promise<string> {
  let cleanUrl = url.trim().replace(/\/+$/, '');
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `http://${cleanUrl}`;
  }
  cachedBackendUrl = cleanUrl;
  await AsyncStorage.setItem(STORAGE_KEY_BACKEND_URL, cleanUrl);
  return cleanUrl;
}

/**
 * Test connectivity to the backend health endpoint.
 */
export async function testBackendConnection(targetUrl?: string): Promise<{
  success: boolean;
  message: string;
  database?: string;
}> {
  const base = targetUrl
    ? targetUrl.trim().replace(/\/+$/, '')
    : await getBackendUrl();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`${base}/api/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, message: `Server returned HTTP ${response.status}` };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Server reachable & responsive',
      database: data.database || 'connected',
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        success: false,
        message: `Connection timed out (6s) connecting to ${base}. Check your Wi-Fi network.`,
      };
    }
    return {
      success: false,
      message: `Failed to reach ${base}: ${err.message || 'Host unreachable'}`,
    };
  }
}

/**
 * Format network errors with clear guidance
 */
function handleNetworkError(err: any, baseUrl: string): never {
  const msg = err.message || '';
  if (
    msg.includes('fetch failed') ||
    msg.includes('Network') ||
    msg.includes('NoRouteToHost') ||
    msg.includes('unreachable') ||
    msg.includes('AbortError')
  ) {
    throw new Error(
      `Cannot connect to backend server at ${baseUrl}.\n` +
      `• Make sure your computer & phone are connected to the SAME Wi-Fi.\n` +
      `• Or update the Server IP in Server Settings.`
    );
  }
  throw err;
}

/**
 * Register or Update User Account
 */
export async function registerUser(name: string, email: string, mobile: string): Promise<UserProfile> {
  const baseUrl = await getBackendUrl();
  try {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, mobile }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed.');
    }

    return data.user;
  } catch (err: any) {
    return handleNetworkError(err, baseUrl);
  }
}

/**
 * Login User by Email or Mobile Number
 */
export async function loginUser(identifier: string): Promise<UserProfile> {
  const baseUrl = await getBackendUrl();
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Login failed. User not found.');
    }

    return data.user;
  } catch (err: any) {
    return handleNetworkError(err, baseUrl);
  }
}

/**
 * Record Telemetry & Evaluate Load Events for Email Notifications
 */
export async function recordTelemetry(
  user: UserProfile,
  energyData: EnergyData
): Promise<{ telemetryId: string; emailAlert: any }> {
  const baseUrl = await getBackendUrl();
  try {
    const response = await fetch(`${baseUrl}/api/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: user.email,
        userName: user.name,
        voltage: energyData.voltage,
        current: energyData.current,
        power: energyData.power,
        energy: energyData.energy,
        status: energyData.status,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.warn('Backend telemetry record warning:', data.error);
    }
    return data;
  } catch (err: any) {
    console.warn('Could not connect to backend telemetry service:', err.message);
    return { telemetryId: '', emailAlert: { status: 'OFFLINE' } };
  }
}

/**
 * Fetch Historical Telemetry Logs from MongoDB Atlas
 */
export async function fetchTelemetryHistory(userEmail: string, limit: number = 20): Promise<any[]> {
  const baseUrl = await getBackendUrl();
  try {
    const response = await fetch(
      `${baseUrl}/api/telemetry/history?email=${encodeURIComponent(userEmail)}&limit=${limit}`
    );
    const data = await response.json();
    if (response.ok && data.history) {
      return data.history;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Send Test Email Alert
 */
export async function sendTestEmailAlert(userEmail: string, userName: string): Promise<any> {
  const baseUrl = await getBackendUrl();
  try {
    const response = await fetch(`${baseUrl}/api/alerts/test-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userEmail, name: userName }),
    });
    return await response.json();
  } catch (err: any) {
    return handleNetworkError(err, baseUrl);
  }
}

/**
 * Fetch Live Electricity Bill Prediction & ML Forecasting
 */
export async function fetchBillPrediction(userEmail: string): Promise<BillPredictionResponse> {
  const baseUrl = await getBackendUrl();
  try {
    const response = await fetch(
      `${baseUrl}/api/prediction/bill?email=${encodeURIComponent(userEmail)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch bill prediction');
    }
    return data;
  } catch (err: any) {
    return handleNetworkError(err, baseUrl);
  }
}

/**
 * Simulate Bill Calculation with Custom Bulb Hours & Wattage
 */
export async function simulateBillPrediction(
  params: SimulationParams
): Promise<{ success: boolean; simulation: SimulationResult }> {
  const baseUrl = await getBackendUrl();
  try {
    const response = await fetch(`${baseUrl}/api/prediction/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to simulate bill');
    }
    return data;
  } catch (err: any) {
    return handleNetworkError(err, baseUrl);
  }
}

/**
 * Fetch Official TANGEDCO Domestic Tariff Slab Details
 */
export async function fetchTangedcoTariff(): Promise<TariffInfoResponse> {
  const baseUrl = await getBackendUrl();
  try {
    const response = await fetch(`${baseUrl}/api/prediction/tariff`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch tariff slabs');
    }
    return data;
  } catch (err: any) {
    return handleNetworkError(err, baseUrl);
  }
}
