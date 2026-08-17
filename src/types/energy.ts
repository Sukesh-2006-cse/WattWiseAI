/**
 * WattWise AI - Data Models and Type Definitions
 */

export interface EnergyData {
  voltage: number;   // V0 - Volts (V)
  current: number;   // V1 - Amperes (A)
  power: number;     // V2 - Watts (W)
  energy: number;    // V3 - Kilowatt-hours (kWh)
  status: string;    // V4 - Hardware status message
  timestamp: Date | string;
}

export type PowerClassificationLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface PowerClassification {
  level: PowerClassificationLevel;
  label: string;
  color: string;
  description: string;
}

export type LoadStatusType = 'LOAD_DETECTED' | 'NO_LOAD';

export interface LoadStatusInfo {
  status: LoadStatusType;
  label: string;
  color: string;
  isLoadActive: boolean;
}

export type ConnectionState = 'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'ERROR';

export interface HistoricalPoint {
  time: string;
  power: number;
}
