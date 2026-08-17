/**
 * WattWise AI - Live Power Consumption Chart Component
 */

import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { HistoricalPoint } from '../types/energy';

interface EnergyChartProps {
  history: HistoricalPoint[];
  currentPower: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - SPACING.md * 4;
const CHART_HEIGHT = 130;

export const EnergyChart: React.FC<EnergyChartProps> = ({ history, currentPower }) => {
  // Build data points for SVG rendering
  const points = history.length > 0
    ? history.map((h) => h.power)
    : [0, currentPower];

  const maxVal = Math.max(...points, 50);
  const minVal = Math.min(...points, 0);
  const range = maxVal - minVal || 1;

  // Generate SVG path string
  const pathD = points.reduce((acc, val, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * CHART_WIDTH;
    const y = CHART_HEIGHT - ((val - minVal) / range) * (CHART_HEIGHT - 20) - 10;
    return index === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Fill path string for background gradient under line
  const areaD = `${pathD} L ${CHART_WIDTH} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>LIVE CONSUMPTION</Text>
        <Text style={styles.subtitle}>Real-time Power Curve (W)</Text>
      </View>

      <View style={styles.chartContainer}>
        {points.length > 0 ? (
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.4" />
                <Stop offset="100%" stopColor={COLORS.primary} stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Filled area */}
            <Path d={areaD} fill="url(#powerGrad)" />

            {/* Line stroke */}
            <Path
              d={pathD}
              fill="none"
              stroke={COLORS.primary}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : (
          <View style={styles.emptyChart}>
            <Text style={styles.emptyText}>Gathering real-time telemetry...</Text>
          </View>
        )}
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>
          Latest: <Text style={styles.boldText}>{currentPower.toFixed(2)} W</Text>
        </Text>
        <Text style={styles.footerText}>
          Peak: <Text style={styles.boldText}>{maxVal.toFixed(2)} W</Text>
        </Text>
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
  header: {
    marginBottom: SPACING.sm,
  },
  title: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.xs,
  },
  emptyChart: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  boldText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
});
