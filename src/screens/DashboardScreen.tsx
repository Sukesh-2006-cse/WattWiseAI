/**
 * WattWise AI - Real-time Energy Dashboard Screen
 */

import React, { useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { ConnectionHeader } from '../components/ConnectionHeader';
import { EnergyChart } from '../components/EnergyChart';
import { ErrorView } from '../components/ErrorView';
import { LoadingView } from '../components/LoadingView';
import { MetricCard } from '../components/MetricCard';
import { LoadStatusCard, PowerClassificationCard } from '../components/StatusBadge';
import { COLORS, SPACING } from '../constants/theme';
import { useEnergyData } from '../hooks/useEnergyData';

export const DashboardScreen: React.FC = () => {
  const {
    data,
    loading,
    error,
    refresh,
    isConnected,
    lastUpdated,
    history,
    isConfigured,
  } = useEnergyData();

  const [refreshing, setRefreshing] = useState(false);

  const handlePullToRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Show full loading view only on initial load when data is missing
  if (loading && !data && !error) {
    return <LoadingView />;
  }

  // Show error view if fetch fails completely without existing data
  if (error && !data) {
    return <ErrorView errorMessage={error} onRetry={refresh} />;
  }

  // Fallback default readings if data is null during error state
  const voltage = data?.voltage ?? 0;
  const current = data?.current ?? 0;
  const power = data?.power ?? 0;
  const energy = data?.energy ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handlePullToRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Connection Header & Status */}
        <ConnectionHeader
          isConnected={isConnected}
          lastUpdated={lastUpdated}
          isConfigured={isConfigured}
        />

        {/* Metric Cards Grid */}
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Voltage"
            value={voltage}
            unit="V"
            decimals={2}
            iconName="flash-outline"
            accentColor={COLORS.info}
            isSimulated={true}
            subtitle="Simulated Grid (220-230 V)"
          />

          <MetricCard
            title="Current"
            value={current}
            unit="A"
            decimals={4}
            iconName="speedometer-outline"
            accentColor={COLORS.secondary}
            subtitle="Phoenix 32A CT Hardware"
          />
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            title="Power"
            value={power}
            unit="W"
            decimals={2}
            iconName="pulse-outline"
            accentColor={COLORS.primary}
            subtitle="Calculated (V × I)"
          />

          <MetricCard
            title="Energy"
            value={energy}
            unit="kWh"
            decimals={5}
            iconName="leaf-outline"
            accentColor={COLORS.accent}
            subtitle="Accumulated Consumption"
          />
        </View>

        {/* Load Presence Status */}
        <LoadStatusCard currentAmps={current} />

        {/* Power Level Classification */}
        <PowerClassificationCard powerWatts={power} />

        {/* Live Consumption Power Chart */}
        <EnergyChart history={history} currentPower={power} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
});
