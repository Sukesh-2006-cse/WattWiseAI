/**
 * WattWise AI - Bill Prediction & AI Anomaly Detection Screen (Future Roadmap Architecture)
 */

import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';

export const BillPredictionScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Bill Prediction & AI</Text>
          <Text style={styles.subtitle}>Machine learning energy forecasting & anomaly detection</Text>
        </View>

        {/* Bill Prediction Architecture Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="calculator-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>MONTHLY BILL PREDICTION</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>

          <Text style={styles.description}>
            Future integration will process long-term consumption telemetry through an ML forecasting model to estimate monthly electricity expenditure.
          </Text>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Current Month Usage:</Text>
            <Text style={styles.fieldPlaceholder}>-- kWh</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Predicted Monthly Usage:</Text>
            <Text style={styles.fieldPlaceholder}>-- kWh</Text>
          </View>

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Estimated Electricity Bill:</Text>
            <Text style={styles.fieldPlaceholder}>-- USD / INR</Text>
          </View>
        </View>

        {/* Anomaly Detection Architecture Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.accent} />
            <Text style={styles.cardTitle}>ANOMALY DETECTION</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>

          <Text style={styles.description}>
            Smart anomaly detection will analyze unexpected spike patterns, continuous phantom loads, and potential appliance faults.
          </Text>

          <View style={styles.statusGrid}>
            <View style={[styles.statusChip, { borderColor: COLORS.success }]}>
              <Text style={[styles.statusChipText, { color: COLORS.success }]}>NORMAL</Text>
            </View>
            <View style={[styles.statusChip, { borderColor: COLORS.info }]}>
              <Text style={[styles.statusChipText, { color: COLORS.info }]}>UNUSUAL</Text>
            </View>
            <View style={[styles.statusChip, { borderColor: COLORS.warning }]}>
              <Text style={[styles.statusChipText, { color: COLORS.warning }]}>HIGH</Text>
            </View>
            <View style={[styles.statusChip, { borderColor: COLORS.danger }]}>
              <Text style={[styles.statusChipText, { color: COLORS.danger }]}>CRITICAL</Text>
            </View>
          </View>

          <View style={styles.aiBanner}>
            <Ionicons name="hardware-chip-outline" size={20} color={COLORS.accent} />
            <Text style={styles.aiBannerText}>
              AI analysis will appear here once the prediction backend model is deployed.
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    flex: 1,
  },
  comingSoonBadge: {
    backgroundColor: COLORS.badgeBlueBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  comingSoonText: {
    color: COLORS.badgeBlueText,
    fontSize: 10,
    fontWeight: '700',
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  fieldLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  fieldPlaceholder: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginVertical: SPACING.sm,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  aiBanner: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  aiBannerText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
