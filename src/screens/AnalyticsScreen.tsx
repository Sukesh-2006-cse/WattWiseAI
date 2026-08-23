/**
 * WattWise AI - Energy Analytics Screen
 */

import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { useEnergy } from '../context/EnergyContext';
import { formatValue } from '../utils/energyUtils';

export const AnalyticsScreen: React.FC = () => {
  const { data, history } = useEnergy();

  const powers = history.map((h) => h.power);
  const minPower = powers.length ? Math.min(...powers) : (data?.power || 0);
  const maxPower = powers.length ? Math.max(...powers) : (data?.power || 0);
  const avgPower = powers.length
    ? powers.reduce((a, b) => a + b, 0) / powers.length
    : (data?.power || 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Energy Analytics</Text>
          <Text style={styles.subtitle}>Session consumption metrics & statistics</Text>
        </View>

        {/* Current Session Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>CURRENT SESSION METRICS</Text>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Active Power Draw:</Text>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>
              {formatValue(data?.power || 0, 2)} W
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Energy Accumulated:</Text>
            <Text style={[styles.statValue, { color: COLORS.accent }]}>
              {formatValue(data?.energy || 0, 5)} kWh
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Hardware Datastream Status:</Text>
            <Text style={[styles.statValue, { color: COLORS.textSecondary }]}>
              {data?.status || 'Active'}
            </Text>
          </View>
        </View>

        {/* Real-time Session Telemetry */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>LIVE SESSION TELEMETRY STATS</Text>

          <View style={styles.grid}>
            <View style={styles.gridBox}>
              <Ionicons name="trending-down" size={20} color={COLORS.secondary} />
              <Text style={styles.gridLabel}>Min Power</Text>
              <Text style={styles.gridValue}>{formatValue(minPower, 1)} W</Text>
            </View>

            <View style={styles.gridBox}>
              <Ionicons name="analytics" size={20} color={COLORS.primary} />
              <Text style={styles.gridLabel}>Avg Power</Text>
              <Text style={styles.gridValue}>{formatValue(avgPower, 1)} W</Text>
            </View>

            <View style={styles.gridBox}>
              <Ionicons name="trending-up" size={20} color={COLORS.warning} />
              <Text style={styles.gridLabel}>Max Power</Text>
              <Text style={styles.gridValue}>{formatValue(maxPower, 1)} W</Text>
            </View>
          </View>
        </View>

        {/* Historical Data Placeholder */}
        <View style={styles.noticeCard}>
          <View style={styles.noticeIconBox}>
            <Ionicons name="time-outline" size={24} color={COLORS.info} />
          </View>
          <View style={styles.noticeTextGroup}>
            <Text style={styles.noticeTitle}>Historical Analytics</Text>
            <Text style={styles.noticeBody}>
              Historical analytics (daily, weekly, and monthly trends) will appear here as long-term telemetry data is accumulated in the backend database.
            </Text>
          </View>
        </View>
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
  },
  contentContainer: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  gridBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  gridLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  gridValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  noticeCard: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    padding: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  noticeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticeTextGroup: {
    flex: 1,
  },
  noticeTitle: {
    color: COLORS.info,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  noticeBody: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
});
