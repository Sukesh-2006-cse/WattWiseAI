/**
 * WattWise AI - Themed Auth Primary / Secondary Action Button
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';

interface AuthButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
  iconName?: keyof typeof Ionicons.glyphMap;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  iconName,
}) => {
  const isDisabled = disabled || loading;
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isOutline ? styles.outlineButton : styles.primaryButton,
        isDisabled && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isOutline ? COLORS.primary : '#FFFFFF'} />
      ) : (
        <View style={styles.content}>
          {iconName ? (
            <Ionicons
              name={iconName}
              size={18}
              color={isOutline ? COLORS.primary : '#FFFFFF'}
            />
          ) : null}
          <Text style={[styles.label, isOutline && styles.outlineLabel]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
  },
  disabledButton: {
    opacity: 0.55,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  outlineLabel: {
    color: COLORS.primary,
  },
});
