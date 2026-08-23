/**
 * WattWise AI - Inline Auth Feedback Banner (error / success / setup notice)
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';

type BannerVariant = 'error' | 'success' | 'warning';

interface AuthBannerProps {
  message: string;
  variant?: BannerVariant;
}

const VARIANT_STYLES: Record<
  BannerVariant,
  { color: string; background: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  error: {
    color: COLORS.danger,
    background: 'rgba(239, 68, 68, 0.10)',
    icon: 'alert-circle',
  },
  success: {
    color: COLORS.success,
    background: 'rgba(34, 197, 94, 0.10)',
    icon: 'checkmark-circle',
  },
  warning: {
    color: COLORS.warning,
    background: 'rgba(245, 158, 11, 0.10)',
    icon: 'warning',
  },
};

export const AuthBanner: React.FC<AuthBannerProps> = ({ message, variant = 'error' }) => {
  const config = VARIANT_STYLES[variant];

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: config.background, borderColor: config.color + '40' },
      ]}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={config.icon} size={16} color={config.color} />
      <Text style={[styles.text, { color: config.color }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.md,
  },
  text: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});
