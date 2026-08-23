/**
 * WattWise AI - Sign In Screen
 */

import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthBanner } from '../../components/AuthBanner';
import { AuthButton } from '../../components/AuthButton';
import { AuthInput } from '../../components/AuthInput';
import { COLORS, SPACING } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { validateEmail } from '../../utils/authUtils';
import { AuthLayout } from './AuthLayout';

interface SignInScreenProps {
  onNavigateToSignUp: () => void;
  onNavigateToForgotPassword: () => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onNavigateToSignUp,
  onNavigateToForgotPassword,
}) => {
  const { signIn, submitting, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // Clear any stale error from a previous screen when this one mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleChange = useCallback(
    (setter: (value: string) => void, field: 'email' | 'password') => (value: string) => {
      setter(value);
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      }
      if (error) clearError();
    },
    [fieldErrors, error, clearError]
  );

  const handleSubmit = useCallback(async () => {
    const emailCheck = validateEmail(email);
    // Sign-in only checks presence, never the strength policy: existing
    // accounts may predate a stricter rule and must still be able to log in.
    const passwordError = password ? undefined : 'Password is required.';

    if (!emailCheck.isValid || passwordError) {
      setFieldErrors({ email: emailCheck.message, password: passwordError });
      return;
    }

    setFieldErrors({});
    await signIn({ email, password });
  }, [email, password, signIn]);

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to view your live energy dashboard."
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={onNavigateToSignUp} disabled={submitting}>
            <Text style={styles.footerLink}>Create one</Text>
          </TouchableOpacity>
        </View>
      }
    >
      {error ? <AuthBanner variant="error" message={error} /> : null}

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
        placeholder="Enter your password"
        iconName="lock-closed-outline"
        secureTextEntry
        textContentType="password"
        autoComplete="password"
        errorMessage={fieldErrors.password}
        editable={!submitting}
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />

      <TouchableOpacity
        style={styles.forgotWrapper}
        onPress={onNavigateToForgotPassword}
        disabled={submitting}
      >
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      <AuthButton
        label="Sign In"
        iconName="log-in-outline"
        onPress={handleSubmit}
        loading={submitting}
      />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  forgotWrapper: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.md,
    paddingVertical: 2,
  },
  forgotText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '700',
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
