/**
 * WattWise AI - Shared Live Telemetry Provider
 *
 * Runs ONE `useEnergyData` poll for the whole signed-in app and shares the
 * result. Previously each screen polled independently, so switching tabs meant
 * duplicate Blynk traffic and a fresh chart history; more importantly the alert
 * watcher needs a reading stream that keeps running whichever tab is open.
 */

import React, { createContext, useContext } from 'react';
import { UseEnergyDataResult, useEnergyData } from '../hooks/useEnergyData';

const EnergyContext = createContext<UseEnergyDataResult | undefined>(undefined);

export const EnergyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const energy = useEnergyData();

  return <EnergyContext.Provider value={energy}>{children}</EnergyContext.Provider>;
};

/**
 * Access the shared telemetry stream. Throws if used outside <EnergyProvider>.
 */
export function useEnergy(): UseEnergyDataResult {
  const context = useContext(EnergyContext);
  if (!context) {
    throw new Error('useEnergy must be used within an <EnergyProvider>.');
  }
  return context;
}
