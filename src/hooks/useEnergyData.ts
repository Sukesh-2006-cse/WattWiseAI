/**
 * WattWise AI - Real-time Energy Data Custom Hook
 *
 * Handles polling interval cleanly (~5s), manages loading, error, and hardware connection state.
 * Guaranteed memory-leak safe on unmount.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { BLYNK_CONFIG } from '../constants/blynk';
import { checkHardwareConnected, getEnergyData, isBlynkConfigured } from '../services/blynkService';
import { EnergyData, HistoricalPoint } from '../types/energy';

export interface UseEnergyDataResult {
  data: EnergyData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isConnected: boolean;
  lastUpdated: Date | null;
  history: HistoricalPoint[];
  isConfigured: boolean;
}

export function useEnergyData(): UseEnergyDataResult {
  const [data, setData] = useState<EnergyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [history, setHistory] = useState<HistoricalPoint[]>([]);

  // Ref to track component mount status to avoid memory leaks
  const isMountedRef = useRef<boolean>(true);
  // Ref to hold interval timer
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isConfigured = isBlynkConfigured();

  const fetchData = useCallback(async (isInitial: boolean = false) => {
    if (isInitial && isMountedRef.current) {
      setLoading(true);
    }

    try {
      // 1. Retrieve energy datastream values
      const energyReading = await getEnergyData();
      
      // 2. Check hardware connectivity
      const hardwareStatus = await checkHardwareConnected();

      if (!isMountedRef.current) return;

      setData(energyReading);
      setError(null);
      setIsConnected(hardwareStatus);
      const now = new Date();
      setLastUpdated(now);

      // Append reading to historical data queue for live power chart (max 15 points)
      const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setHistory((prev) => {
        const updated = [...prev, { time: timeLabel, power: energyReading.power }];
        return updated.slice(-15);
      });
    } catch (err: any) {
      if (!isMountedRef.current) return;

      const errorMessage = err?.message || 'Unable to connect to energy monitor.';
      setError(errorMessage);

      if (err?.code === 'OFFLINE' || err?.code === 'TIMEOUT') {
        setIsConnected(false);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const manualRefresh = useCallback(async () => {
    await fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    isMountedRef.current = true;

    // Execute initial fetch on mount
    fetchData(true);

    // Setup polling interval (~5 seconds)
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchData(false);
      }
    }, BLYNK_CONFIG.POLL_INTERVAL_MS);

    // Clean up on unmount
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: manualRefresh,
    isConnected,
    lastUpdated,
    history,
    isConfigured,
  };
}
