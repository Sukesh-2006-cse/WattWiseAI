/**
 * WattWise AI - Sign Up (Account Registration) Screen
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthBanner } from '../../components/AuthBanner';
import { AuthButton } from '../../components/AuthButton';
import { AuthInput } from '../../components/AuthInput';
import { COLORS, SPACING } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import {
  getPasswordStrength,
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
} from '../../utils/authUtils';
import { AuthLayout } from './AuthLayout';

interface SignUpScreenProps {
  onNavigateToSignIn: () => void;
}

type FieldKey = 'fullName' | 'email' | 'password' | 'confirmPassword';

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigateToSignIn }) => {
  const { signUp, submitting, error, clearError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});

  useEffect(() => {
    clearError();
  }, [clearError]);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleChange = useCallback(
    (setter: (value: string) => void, field: FieldKey) => (value: string) => {
      setter(value);
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      }
      if (error) clearError();
    },
    [fieldErrors, error, clearError]
  );

  const handleSubmit = useCallback(async () => {
    const checks: Record<FieldKey, ReturnType<typeof validateEmail>> = {
      fullName: validateFullName(fullName),
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
    };

    const nextErrors = (Object.keys(checks) as FieldKey[]).reduce<Partial<Record<FieldKey, string>>>(
      (acc, key) => {
        if (!checks[key].isValid) acc[key] = checks[key].message;
        return acc;
      },
      {}
    );

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    // On success the auth session flips the app to the dashboard automatically,
    // so there is nothing to navigate to manually here.
    await signUp({ fullName, email, password });
  }, [fullName, email, password, confirmPassword, signUp]);

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Sign up to start monitoring your household energy in real time."
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={onNavigateToSignIn} disabled={submitting}>
            <Text style={styles.footerLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      }
    >
      {error ? <AuthBanner variant="error" message={error} /> : null}

      <AuthInput
        label="FULL NAME"
        value={fullName}
        onChangeText={handleChange(setFullName, 'fullName')}
        placeholder="Jane Doe"
        iconName="person-outline"
        autoCapitalize="words"
        textContentType="name"
        autoComplete="name"
        errorMessage={fieldErrors.fullName}
        editable={!submitting}
      />

      <AuthInput
        label="EMAIL ADDRESS"
        value={email}
        onChangeText={handleChange(setEmail, 'email')}
        placeholder="you@example.com"
        iconName="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
        autoComplete="email"
        errorMessage={fieldErrors.email}
        editable={!submitting}
      />

      <AuthInput
        label="PASSWORD"
        value={password}
        onChangeText={handleChange(setPassword, 'password')}
        placeholder="At least 8 characters"
        iconName="lock-closed-outline"
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        errorMessage={fieldErrors.password}
        editable={!submitting}
      />

      {/* Live password strength meter */}
      {password ? (
        <View style={styles.strengthBlock}>
          <View style={styles.strengthTrack}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[
                  styles.strengthSegment,
                  {
                    backgroundColor:
                      index < strength.score ? strength.color : COLORS.cardBorder,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.strengthLabel, { color: strength.color }]}>
            {strength.label}
          </Text>
        </View>
      ) : null}

      <AuthInput
        label="CONFIRM PASSWORD"
        value={confirmPassword}
        onChangeText={handleChange(setConfirmPassword, 'confirmPassword')}
        placeholder="Re-enter your password"
        iconName="shield-checkmark-outline"
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        errorMessage={fieldErrors.confirmPassword}
        editable={!submitting}
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />

      <AuthButton
        label="Create Account"
        iconName="person-add-outline"
        onPress={handleSubmit}
        loading={submitting}
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  strengthBlock: {
    marginTop: -SPACING.sm,
    marginBottom: SPACING.md,
  },
  strengthTrack: {
    flexDirection: 'row',
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  footerLink: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
});
