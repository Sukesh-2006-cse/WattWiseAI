/**
 * WattWise AI - Reusable Metric Card Component
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { formatValue } from '../utils/energyUtils';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  decimals?: number;
  iconName: keyof typeof Ionicons.glyphMap;
  accentColor?: string;
  subtitle?: string;
  isSimulated?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  decimals = 2,
  iconName,
  accentColor = COLORS.primary,
  subtitle,
  isSimulated = false,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: accentColor + '20' }]}>
          <Ionicons name={iconName} size={20} color={accentColor} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          {isSimulated ? (
            <View style={styles.simulatedBadge}>
              <Text style={styles.simulatedText}>Simulated</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>{formatValue(value, decimals)}</Text>
        <Text style={[styles.unitText, { color: accentColor }]}>{unit}</Text>
      </View>

      {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
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
    flex: 1,
    minWidth: '45%',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  title: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  simulatedBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: COLORS.info,
  },
  simulatedText: {
    color: COLORS.info,
    fontSize: 9,
    fontWeight: '700',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: SPACING.xs,
  },
  valueText: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginRight: SPACING.xs,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitleText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: SPACING.xs,
  },
});
