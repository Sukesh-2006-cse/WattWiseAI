/**
 * WattWise AI - App-wide High Load Alert Watcher
 *
 * Mounts `useLoadAlerts` ONCE above the tab switcher, so the watcher keeps
 * evaluating readings whichever tab is open. Mounting it inside a screen would
 * mean alerts stop - and the sustained-load streak resets - every time the user
 * navigates away from that screen.
 */

import React, { createContext, useContext } from 'react';
import { UseLoadAlertsResult, useLoadAlerts } from '../hooks/useLoadAlerts';
import { useEnergy } from './EnergyContext';

const AlertsContext = createContext<UseLoadAlertsResult | undefined>(undefined);

export const AlertsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data } = useEnergy();
  const alerts = useLoadAlerts(data);

  return <AlertsContext.Provider value={alerts}>{children}</AlertsContext.Provider>;
};

/**
 * Access the shared alert watcher. Throws if used outside <AlertsProvider>.
 */
export function useAlerts(): UseLoadAlertsResult {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlerts must be used within an <AlertsProvider>.');
  }
  return context;
}
