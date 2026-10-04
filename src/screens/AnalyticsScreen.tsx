/**
 * WattWise AI - Energy Analytics Screen
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { useEnergyData } from '../hooks/useEnergyData';
import { formatValue } from '../utils/energyUtils';

export const AnalyticsScreen: React.FC = () => {
  const { data, history } = useEnergyData();

  const powers = history.map((h) => h.power);
  const minPower = powers.length ? Math.min(...powers) : (data?.power || 0);
  const maxPower = powers.length ? Math.max(...powers) : (data?.power || 0);
  const avgPower = powers.length
    ? powers.reduce((a, b) => a + b, 0) / powers.length
    : (data?.power || 0);

  const rawStatus = (data?.status || '').trim();
  const isMultilineStatus = rawStatus.includes('\n') || rawStatus.length > 30;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
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

          {!isMultilineStatus && (
            <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.statLabel}>Hardware Datastream Status:</Text>
              <Text style={[styles.statValue, { color: COLORS.textSecondary }]}>
                {rawStatus || 'Active (Blynk Cloud)'}
              </Text>
            </View>
          )}
        </View>

        {/* Hardware Stream Readout (V0) - Formatted Terminal Card */}
        {isMultilineStatus ? (
          <View style={styles.card}>
            <View style={styles.terminalHeader}>
              <Ionicons name="hardware-chip-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.cardTitle}>HARDWARE DATASTREAM READOUT (V0)</Text>
            </View>
            <View style={styles.terminalBox}>
              <Text style={styles.terminalText}>
                {rawStatus}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Real-time Session Telemetry */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>LIVE SESSION TELEMETRY STATS</Text>

          <View style={styles.grid}>
            <View style={styles.gridBox}>
              <Ionicons name="trending-down" size={18} color={COLORS.secondary} />
              <Text style={styles.gridLabel} numberOfLines={1}>Min Power</Text>
              <Text style={styles.gridValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {formatValue(minPower, 1)} W
              </Text>
            </View>

            <View style={styles.gridBox}>
              <Ionicons name="analytics" size={18} color={COLORS.primary} />
              <Text style={styles.gridLabel} numberOfLines={1}>Avg Power</Text>
              <Text style={styles.gridValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {formatValue(avgPower, 1)} W
              </Text>
            </View>

            <View style={styles.gridBox}>
              <Ionicons name="trending-up" size={18} color={COLORS.warning} />
              <Text style={styles.gridLabel} numberOfLines={1}>Max Power</Text>
              <Text style={styles.gridValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {formatValue(maxPower, 1)} W
              </Text>
            </View>
          </View>
        </View>

        {/* Historical Data Notice */}
        <View style={styles.noticeCard}>
          <View style={styles.noticeIconBox}>
            <Ionicons name="time-outline" size={22} color={COLORS.info} />
          </View>
          <View style={styles.noticeTextGroup}>
            <Text style={styles.noticeTitle}>Historical Analytics</Text>
            <Text style={styles.noticeBody}>
              Historical trends (daily, weekly, and monthly summaries) are recorded live in MongoDB Atlas as your device streams telemetry.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: 120,
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 3,
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
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  terminalBox: {
    backgroundColor: '#090D14',
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
    padding: SPACING.md,
  },
  terminalText: {
    color: '#34D399',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  gridBox: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 10,
    alignItems: 'center',
  },
  gridLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  gridValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 3,
  },
  noticeCard: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noticeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  noticeTextGroup: {
    flex: 1,
  },
  noticeTitle: {
    color: COLORS.info,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  noticeBody: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
});
