/**
 * WattWise AI - Blynk API & Power Classification Constants
 */

export const BLYNK_CONFIG = {
  // Blynk API Base URL from env variable, fallback to default Blynk cloud endpoint
  DEFAULT_API_URL: 'https://blynk.cloud',
  
  // Datastream Mappings
  DATASTREAMS: {
    VOLTAGE: 'V0',
    CURRENT: 'V1',
    POWER: 'V2',
    ENERGY: 'V3',
    STATUS: 'V4',
  },

  // Polling interval in milliseconds (~5 seconds)
  POLL_INTERVAL_MS: 5000,
  
  // Network Request Timeout in milliseconds
  TIMEOUT_MS: 8000,
};

/**
 * Power Level Classification Thresholds (in Watts)
 * Configurable thresholds as per project specification:
 * - LOW: 0 - 300 W
 * - NORMAL: 300 - 1000 W
 * - HIGH: 1000 - 1800 W
 * - CRITICAL: > 1800 W
 */
export const POWER_THRESHOLDS = {
  LOW_MAX: 300,
  NORMAL_MAX: 1000,
  HIGH_MAX: 1800,
};
