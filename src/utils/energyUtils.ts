/**
 * WattWise AI - Energy Calculations & Utility Helpers
 */

import { POWER_THRESHOLDS } from '../constants/blynk';
import { COLORS } from '../constants/theme';
import { LoadStatusInfo, PowerClassification } from '../types/energy';

/**
 * Classifies power level based on configurable thresholds:
 * - LOW: 0 - 300 W ("LOW LOAD")
 * - NORMAL: 300 - 1000 W ("NORMAL")
 * - HIGH: 1000 - 1800 W ("HIGH LOAD")
 * - CRITICAL: above 1800 W ("CRITICAL")
 */
export function classifyPower(powerWatts: number): PowerClassification {
  if (powerWatts <= POWER_THRESHOLDS.LOW_MAX) {
    return {
      level: 'LOW',
      label: 'LOW LOAD',
      color: COLORS.secondary,
      description: 'Minimal power usage detected (0 – 300 W)',
    };
  }
  
  if (powerWatts <= POWER_THRESHOLDS.NORMAL_MAX) {
    return {
      level: 'NORMAL',
      label: 'NORMAL',
      color: COLORS.success,
      description: 'Standard household operating power (300 – 1000 W)',
    };
  }
  
  if (powerWatts <= POWER_THRESHOLDS.HIGH_MAX) {
    return {
      level: 'HIGH',
      label: 'HIGH LOAD',
      color: COLORS.warning,
      description: 'Elevated energy consumption (1000 – 1800 W)',
    };
  }

  return {
    level: 'CRITICAL',
    label: 'CRITICAL',
    color: COLORS.danger,
    description: 'High power draw exceeding 1800 W threshold',
  };
}

/**
 * Interprets electrical current measurement to determine load presence:
 * - current === 0 => "NO LOAD"
 * - current > 0 => "LOAD DETECTED"
 */
export function getLoadStatus(currentAmps: number): LoadStatusInfo {
  const isLoadActive = currentAmps > 0.001; // Accounting for minute sensor float noise
  
  if (isLoadActive) {
    return {
      status: 'LOAD_DETECTED',
      label: 'LOAD DETECTED',
      color: COLORS.success,
      isLoadActive: true,
    };
  }

  return {
    status: 'NO_LOAD',
    label: 'NO LOAD',
    color: COLORS.textMuted,
    isLoadActive: false,
  };
}

/**
 * Formats numbers with specified decimal places cleanly.
 */
export function formatValue(value: number, decimals: number = 2): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.00';
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats timestamp into local time string (e.g. "12:35:20 PM").
 */
export function formatTimestamp(timestamp?: Date | string | null): string {
  if (!timestamp) return '--:--:--';
  const dateObj = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (isNaN(dateObj.getTime())) return '--:--:--';

  return dateObj.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}
