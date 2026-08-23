/**
 * WattWise AI - High Load Email Alert Status & Controls
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { UseLoadAlertsResult } from '../hooks/useLoadAlerts';
import { AlertLevel } from '../types/alert';
import { formatTimestamp } from '../utils/energyUtils';

interface AlertStatusCardProps {
  alerts: UseLoadAlertsResult;
  /** Email the alerts are sent to (the signed-in account). */
  recipientEmail: string | null;
}

const LEVEL_OPTIONS: { level: AlertLevel; label: string; hint: string }[] = [
  { level: 'HIGH', label: 'High & above', hint: 'Alerts from 1000 W' },
  { level: 'CRITICAL', label: 'Critical only', hint: 'Alerts above 1800 W' },
];

/**
 * Derives the headline status line from the current watcher state.
 */
function getStatusLine(alerts: UseLoadAlertsResult): { text: string; color: string; icon: keyof typeof Ionicons.glyphMap } {
  if (!alerts.isConfigured) {
    return {
      text: 'Email delivery not configured',
      color: COLORS.warning,
      icon: 'warning-outline',
    };
  }

  if (!alerts.preferences.enabled) {
    return { text: 'Alerts are turned off', color: COLORS.textMuted, icon: 'notifications-off-outline' };
  }

  if (alerts.sending) {
    return { text: 'Sending alert email...', color: COLORS.secondary, icon: 'paper-plane-outline' };
  }

  if (alerts.activeLevel) {
    if (alerts.readingsUntilAlert > 0) {
      return {
        text: `${alerts.activeLevel} load - confirming (${alerts.readingsUntilAlert} more reading${
          alerts.readingsUntilAlert === 1 ? '' : 's'
        })`,
        color: COLORS.warning,
        icon: 'timer-outline',
      };
    }
    return {
      text: `${alerts.activeLevel} load sustained`,
      color: COLORS.danger,
      icon: 'alert-circle-outline',
    };
  }

  return { text: 'Monitoring - load is normal', color: COLORS.success, icon: 'shield-checkmark-outline' };
}

export const AlertStatusCard: React.FC<AlertStatusCardProps> = ({ alerts, recipientEmail }) => {
  const status = getStatusLine(alerts);
  const lastAlert = alerts.history[0];
  const lastResult = alerts.lastResult;

  return (
    <View style={styles.card}>
      {/* Header + master switch */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <Ionicons name="mail-unread-outline" size={18} color={COLORS.accent} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>High Load Email Alerts</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {recipientEmail ? `Sent to ${recipientEmail}` : 'No recipient on this account'}
            </Text>
          </View>
        </View>

        <Switch
          value={alerts.preferences.enabled}
          onValueChange={alerts.setEnabled}
          trackColor={{ false: COLORS.cardBorder, true: 'rgba(34, 197, 94, 0.45)' }}
          thumbColor={alerts.preferences.enabled ? COLORS.primary : COLORS.textDisabled}
        />
      </View>

      {/* Live status */}
      <View style={[styles.statusRow, { borderColor: status.color + '35' }]}>
        {alerts.sending ? (
          <ActivityIndicator size="small" color={status.color} />
        ) : (
          <Ionicons name={status.icon} size={16} color={status.color} />
        )}
        <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
      </View>

      {/* Severity selector */}
      <Text style={styles.sectionLabel}>ALERT ME ON</Text>
      <View style={styles.levelRow}>
        {LEVEL_OPTIONS.map((option) => {
          const isSelected = alerts.preferences.minimumLevel === option.level;

          return (
            <TouchableOpacity
              key={option.level}
              style={[styles.levelChip, isSelected && styles.levelChipSelected]}
              onPress={() => alerts.setMinimumLevel(option.level)}
              disabled={!alerts.preferences.enabled}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                size={14}
                color={isSelected ? COLORS.primary : COLORS.textDisabled}
              />
              <View>
                <Text style={[styles.levelLabel, isSelected && { color: COLORS.textPrimary }]}>
                  {option.label}
                </Text>
                <Text style={styles.levelHint}>{option.hint}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Delivery outcome of the most recent evaluation */}
      {lastResult && lastResult.status !== 'SENT' ? (
        <View
          style={[
            styles.noticeBox,
            {
              backgroundColor:
                lastResult.status === 'FAILED' || lastResult.status === 'NOT_CONFIGURED'
                  ? 'rgba(239, 68, 68, 0.08)'
                  : 'rgba(148, 163, 184, 0.10)',
            },
          ]}
        >
          <Text
            style={[
              styles.noticeText,
              {
                color:
                  lastResult.status === 'FAILED' || lastResult.status === 'NOT_CONFIGURED'
                    ? COLORS.danger
                    : COLORS.textMuted,
              },
            ]}
          >
            {lastResult.message}
          </Text>
        </View>
      ) : null}

      {/* Last dispatched alert */}
      <View style={styles.footer}>
        <Ionicons
          name={lastAlert?.delivered ? 'checkmark-circle-outline' : 'time-outline'}
          size={13}
          color={COLORS.textMuted}
        />
        <Text style={styles.footerText} numberOfLines={1}>
          {lastAlert
            ? `Last alert: ${lastAlert.level} at ${formatTimestamp(lastAlert.raisedAt)}${
                lastAlert.delivered ? '' : ' (delivery failed)'
              }`
            : 'No alerts raised yet'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm + 2,
    marginTop: SPACING.md,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  levelRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  levelChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderRadius: BORDER_RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  levelChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryGlow,
  },
  levelLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  levelHint: {
    color: COLORS.textDisabled,
    fontSize: 10,
    marginTop: 1,
  },
  noticeBox: {
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    marginTop: SPACING.md,
  },
  noticeText: {
    fontSize: 11,
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 11,
    flex: 1,
  },
});
