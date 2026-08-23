/**
 * WattWise AI - Initial Loading Screen Component
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';

interface LoadingViewProps {
  /** Optional status line (defaults to the telemetry connect message). */
  message?: string;
}

export const LoadingView: React.FC<LoadingViewProps> = ({
  message = 'Connecting to energy monitor...',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoBadge}>
          <Ionicons name="flash" size={32} color={COLORS.primary} />
        </View>

        <Text style={styles.appName}>WattWise AI</Text>
        <Text style={styles.tagline}>Smart Energy Monitoring</Text>

        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.statusText}>{message}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  appName: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: SPACING.xl,
  },
  loadingBox: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  statusText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginTop: SPACING.xs,
  },
});
