/**
 * WattWise AI - Electricity Bill Prediction & TANGEDCO Tariff Types
 */

export interface TangedcoSlabItem {
  slab: string;
  units: number;
  rate: number;
  cost: number;
  note?: string;
}

export interface TangedcoBillSummary {
  bimonthlyUnits: number;
  monthlyUnits: number;
  subsidizedBill: number;
  unsubsidizedCost: number;
  subsidySavings: number;
  fixedCharges: number;
  isFreeTier: boolean;
  freeAllowanceUnits: number;
  remainingFreeUnits: number;
  percentOfFreeTierUsed: number;
  tariffScheme: string;
  slabBreakdown: TangedcoSlabItem[];
}

export interface ModelDiagnostics {
  architecture: string;
  weightsLoaded: boolean;
  version: string;
  r2Score: number;
  trainingSamples: number;
}

export interface TelemetrySnapshot {
  voltage: number;
  current: number;
  power: number;
  energy: number;
  isBulbActive: boolean;
}

export interface BillPredictionResponse {
  success: boolean;
  userEmail: string;
  dataSource: string;
  predictedMonthlyKwh: number;
  predictedBimonthlyUnits: number;
  dailyAverageKwh: number;
  inferenceLatencyMs: number;
  targetLoad: string;
  telemetrySnapshot: TelemetrySnapshot;
  tangedco: TangedcoBillSummary;
  modelDiagnostics: ModelDiagnostics;
}

export interface SimulationParams {
  hoursPerDay: number;
  wattage?: number;
  daysInCycle?: number;
}

export interface SimulationResult {
  hoursPerDay: number;
  wattage: number;
  daysInCycle: number;
  dailyKwh: number;
  projectedMonthlyKwh: number;
  projectedBimonthlyUnits: number;
  tangedco: TangedcoBillSummary;
}

export interface TariffInfoResponse {
  success: boolean;
  region: string;
  authority: string;
  scheme: string;
  billingCycle: string;
  freeSubsidyAllowanceUnits: number;
  baseUnsubsidizedRate: number;
  slabs: Array<{
    min: number;
    max: number;
    rate: number;
    label: string;
    free?: boolean;
  }>;
}
