/**
 * WattWise AI - Isolated Blynk IoT Cloud Service Module
 *
 * All Blynk API communication is isolated here.
 * UI components NEVER directly construct Blynk URLs or handle tokens.
 * This architecture allows seamless transition to a Node.js backend proxy in the future.
 */

import { BLYNK_CONFIG } from '../constants/blynk';
import { EnergyData } from '../types/energy';

// Retrieve credentials safely from Expo public environment variables
const BLYNK_AUTH_TOKEN =
  process.env.EXPO_PUBLIC_BLYNK_AUTH_TOKEN ||
  process.env.BLYNK_AUTH_TOKEN ||
  '';

const BLYNK_API_URL =
  process.env.EXPO_PUBLIC_BLYNK_API_URL ||
  process.env.BLYNK_API_URL ||
  BLYNK_CONFIG.DEFAULT_API_URL;

/**
 * Custom Error Class for Blynk Service errors
 */
export class BlynkServiceError extends Error {
  public code: 'MISSING_TOKEN' | 'OFFLINE' | 'NETWORK_ERROR' | 'TIMEOUT' | 'INVALID_RESPONSE';

  constructor(
    message: string,
    code: 'MISSING_TOKEN' | 'OFFLINE' | 'NETWORK_ERROR' | 'TIMEOUT' | 'INVALID_RESPONSE'
  ) {
    super(message);
    this.name = 'BlynkServiceError';
    this.code = code;
  }
}

/**
 * Checks if Blynk authentication token is present in environment variables.
 */
export function isBlynkConfigured(): boolean {
  return Boolean(BLYNK_AUTH_TOKEN && BLYNK_AUTH_TOKEN !== 'YOUR_BLYNK_DEVICE_TOKEN');
}

/**
 * Helper to execute fetch with timeout
 */
async function fetchWithTimeout(url: string, timeoutMs: number = BLYNK_CONFIG.TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new BlynkServiceError('Blynk API request timed out.', 'TIMEOUT');
    }
    throw new BlynkServiceError('Network connection failed while reaching Blynk IoT Cloud.', 'NETWORK_ERROR');
  }
}

/**
 * Retrieves the hardware online status from Blynk.
 */
export async function checkHardwareConnected(): Promise<boolean> {
  if (!isBlynkConfigured()) return false;

  const url = `${BLYNK_API_URL}/external/api/isHardwareConnected?token=${BLYNK_AUTH_TOKEN}`;
  try {
    const response = await fetchWithTimeout(url);
    if (response.ok) {
      const isConnected = await response.text();
      return isConnected.trim() === 'true';
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Single datastream fetch fallback helper
 */
export async function getDatastreamValue(pin: string): Promise<string | number> {
  if (!isBlynkConfigured()) {
    throw new BlynkServiceError('Blynk auth token is missing in .env configuration.', 'MISSING_TOKEN');
  }

  const url = `${BLYNK_API_URL}/external/api/get?token=${BLYNK_AUTH_TOKEN}&${pin}`;
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    if (response.status === 400 || response.status === 401) {
      throw new BlynkServiceError('Invalid Blynk auth token or unauthorized access.', 'MISSING_TOKEN');
    }
    throw new BlynkServiceError(`Blynk API returned error status ${response.status}`, 'INVALID_RESPONSE');
  }

  const textVal = await response.text();
  const numericVal = parseFloat(textVal);
  return isNaN(numericVal) ? textVal.trim() : numericVal;
}

/**
 * Retrieves individual datastreams:
 * V0 -> Voltage
 * V1 -> Current
 * V2 -> Power
 * V3 -> Energy
 * V4 -> Status
 */
export async function getVoltage(): Promise<number> {
  const val = await getDatastreamValue(BLYNK_CONFIG.DATASTREAMS.VOLTAGE);
  return typeof val === 'number' ? val : parseFloat(val) || 0;
}

export async function getCurrent(): Promise<number> {
  const val = await getDatastreamValue(BLYNK_CONFIG.DATASTREAMS.CURRENT);
  return typeof val === 'number' ? val : parseFloat(val) || 0;
}

export async function getPower(): Promise<number> {
  const val = await getDatastreamValue(BLYNK_CONFIG.DATASTREAMS.POWER);
  return typeof val === 'number' ? val : parseFloat(val) || 0;
}

export async function getEnergy(): Promise<number> {
  const val = await getDatastreamValue(BLYNK_CONFIG.DATASTREAMS.ENERGY);
  return typeof val === 'number' ? val : parseFloat(val) || 0;
}

export async function getStatus(): Promise<string> {
  const val = await getDatastreamValue(BLYNK_CONFIG.DATASTREAMS.STATUS);
  return String(val || '');
}

/**
 * Primary function to retrieve all energy datastreams.
 * Performs efficient batch query first, with parallel pin fallback if needed.
 */
export async function getEnergyData(): Promise<EnergyData> {
  if (!isBlynkConfigured()) {
    // If user hasn't configured token in .env yet, return informative missing token error
    throw new BlynkServiceError(
      'Blynk Auth Token is missing. Please configure EXPO_PUBLIC_BLYNK_AUTH_TOKEN in your .env file.',
      'MISSING_TOKEN'
    );
  }

  const batchUrl = `${BLYNK_API_URL}/external/api/get?token=${BLYNK_AUTH_TOKEN}&${BLYNK_CONFIG.DATASTREAMS.VOLTAGE}&${BLYNK_CONFIG.DATASTREAMS.CURRENT}&${BLYNK_CONFIG.DATASTREAMS.POWER}&${BLYNK_CONFIG.DATASTREAMS.ENERGY}&${BLYNK_CONFIG.DATASTREAMS.STATUS}`;

  try {
    const response = await fetchWithTimeout(batchUrl);

    if (!response.ok) {
      if (response.status === 400 || response.status === 401) {
        throw new BlynkServiceError('Blynk Authentication Failed. Check BLYNK_AUTH_TOKEN in .env.', 'MISSING_TOKEN');
      }
      throw new BlynkServiceError(`Blynk API server error: ${response.status}`, 'INVALID_RESPONSE');
    }

    const contentType = response.headers.get('content-type') || '';
    
    // If response is JSON object mapping pin -> value
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return parseBatchJsonResponse(data);
    }

    // Fallback: Parallel individual pin requests
    return await fetchAllPinsParallel();
  } catch (error: any) {
    if (error instanceof BlynkServiceError) {
      throw error;
    }
    // Attempt parallel pin fetch fallback on unexpected batch error
    try {
      return await fetchAllPinsParallel();
    } catch (fallbackErr: any) {
      if (fallbackErr instanceof BlynkServiceError) {
        throw fallbackErr;
      }
      throw new BlynkServiceError('Failed to fetch readings from Blynk device.', 'NETWORK_ERROR');
    }
  }
}

/**
 * Helper to parse batch JSON response from Blynk
 */
function parseBatchJsonResponse(json: Record<string, any>): EnergyData {
  const parseNum = (val: any, defaultVal: number): number => {
    const n = parseFloat(val);
    return isNaN(n) ? defaultVal : n;
  };

  const v0 = parseNum(json.V0 ?? json.v0, 225.0);
  const v1 = parseNum(json.V1 ?? json.v1, 0.0);
  const v2 = parseNum(json.V2 ?? json.v2, v0 * v1);
  const v3 = parseNum(json.V3 ?? json.v3, 0.0);
  const v4 = String(json.V4 ?? json.v4 ?? (v1 > 0 ? 'LOAD DETECTED' : 'NO LOAD'));

  return {
    voltage: v0,
    current: v1,
    power: v2,
    energy: v3,
    status: v4,
    timestamp: new Date(),
  };
}

/**
 * Parallel pin fetch fallback
 */
async function fetchAllPinsParallel(): Promise<EnergyData> {
  const [voltage, current, power, energy, status] = await Promise.all([
    getVoltage().catch(() => 225.0),
    getCurrent().catch(() => 0.0),
    getPower().catch(() => 0.0),
    getEnergy().catch(() => 0.0),
    getStatus().catch(() => 'LOAD DETECTED'),
  ]);

  return {
    voltage,
    current,
    power,
    energy,
    status,
    timestamp: new Date(),
  };
}
