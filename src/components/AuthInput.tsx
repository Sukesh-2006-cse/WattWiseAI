/**
 * WattWise AI - Themed Auth Form Text Field
 */

import React, { useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';

interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  errorMessage?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  textContentType?: any;
  autoComplete?: any;
  editable?: boolean;
  onSubmitEditing?: () => void;
  returnKeyType?: 'next' | 'done' | 'go';
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  iconName,
  errorMessage,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  textContentType,
  autoComplete,
  editable = true,
  onSubmitEditing,
  returnKeyType = 'next',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const hasError = Boolean(errorMessage);
  const borderColor = hasError
    ? COLORS.danger
    : isFocused
    ? COLORS.primary
    : COLORS.cardBorder;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputRow, { borderColor }]}>
        <Ionicons
          name={iconName}
          size={18}
          color={hasError ? COLORS.danger : isFocused ? COLORS.primary : COLORS.textMuted}
        />

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textDisabled}
          secureTextEntry={secureTextEntry && !isRevealed}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          textContentType={textContentType}
          autoComplete={autoComplete}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          selectionColor={COLORS.primary}
        />

        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setIsRevealed((prev) => !prev)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={isRevealed ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={isRevealed ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {hasError ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={12} color={COLORS.danger} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    paddingHorizontal: SPACING.md,
    height: 50,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    height: '100%',
    // `outlineStyle` silences the default focus ring on react-native-web
    ...(({ outlineStyle: 'none' } as unknown) as object),
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    flex: 1,
  },
});
