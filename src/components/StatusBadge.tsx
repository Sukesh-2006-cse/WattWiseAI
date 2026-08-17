/**
 * WattWise AI - Status & Power Level Badge Components
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { classifyPower, getLoadStatus } from '../utils/energyUtils';

interface LoadStatusCardProps {
  currentAmps: number;
}

export const LoadStatusCard: React.FC<LoadStatusCardProps> = ({ currentAmps }) => {
  const loadInfo = getLoadStatus(currentAmps);

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>LOAD STATUS</Text>

      <View style={styles.row}>
        <View
          style={[
            styles.indicatorDot,
            { backgroundColor: loadInfo.color, shadowColor: loadInfo.color },
          ]}
        />
        <Text style={[styles.statusText, { color: loadInfo.color }]}>
          {loadInfo.label}
        </Text>
      </View>

      <Text style={styles.helperText}>
        {loadInfo.isLoadActive
          ? 'Active current flow detected via Phoenix 32A CT sensor.'
          : 'No active electrical load currently drawing current.'}
      </Text>
    </View>
  );
};

interface PowerClassificationCardProps {
  powerWatts: number;
}

export const PowerClassificationCard: React.FC<PowerClassificationCardProps> = ({ powerWatts }) => {
  const classification = classifyPower(powerWatts);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>POWER LEVEL CLASSIFICATION</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: classification.color + '20', borderColor: classification.color },
          ]}
        >
          <Text style={[styles.badgeText, { color: classification.color }]}>
            {classification.label}
          </Text>
        </View>
      </View>

      <View style={styles.levelRow}>
        <Ionicons name="flash-outline" size={18} color={classification.color} />
        <Text style={styles.descriptionText}>{classification.description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  helperText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  descriptionText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
