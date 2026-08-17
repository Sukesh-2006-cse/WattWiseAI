/**
 * WattWise AI - App Header & Connection Status Component
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { formatTimestamp } from '../utils/energyUtils';

interface ConnectionHeaderProps {
  isConnected: boolean;
  lastUpdated: Date | null;
  isConfigured: boolean;
}

export const ConnectionHeader: React.FC<ConnectionHeaderProps> = ({
  isConnected,
  lastUpdated,
  isConfigured,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.titleGroup}>
          <View style={styles.logoBadge}>
            <Ionicons name="flash" size={22} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.appTitle}>WattWise AI</Text>
            <Text style={styles.appTagline}>Smart Energy Monitoring & Awareness</Text>
          </View>
        </View>
      </View>

      {!isConfigured ? (
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={18} color={COLORS.warning} />
          <Text style={styles.warningText}>
            Missing Blynk token. Set EXPO_PUBLIC_BLYNK_AUTH_TOKEN in .env
          </Text>
        </View>
      ) : null}

      <View style={styles.statusBox}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>CONNECTION STATUS</Text>
          <View style={styles.badgeGroup}>
            <View
              style={[
                styles.dot,
                { backgroundColor: isConnected ? COLORS.success : COLORS.danger },
              ]}
            />
            <Text
              style={[
                styles.statusValue,
                { color: isConnected ? COLORS.success : COLORS.danger },
              ]}
            >
              {isConnected ? 'Device Online' : 'DEVICE OFFLINE'}
            </Text>
          </View>
        </View>

        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.timeLabel}>Last updated:</Text>
          <Text style={styles.timeValue}>{formatTimestamp(lastUpdated)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logoBadge: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  appTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  appTagline: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  warningBanner: {
    backgroundColor: COLORS.badgeYellowBg,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.warning,
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  warningText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  statusBox: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statusLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  timeLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  timeValue: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
});
