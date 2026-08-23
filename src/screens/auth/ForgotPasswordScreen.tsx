/**
 * WattWise AI - Local Password Reset Screen
 *
 * Local accounts have no mail provider, so rather than emailing a link this
 * matches the account by email and sets a new password on the spot. The user
 * is not signed in as a side effect - they go back and log in with it.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthBanner } from '../../components/AuthBanner';
import { AuthButton } from '../../components/AuthButton';
import { AuthInput } from '../../components/AuthInput';
import { COLORS, SPACING } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import {
  getPasswordStrength,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
} from '../../utils/authUtils';
import { AuthLayout } from './AuthLayout';

interface ForgotPasswordScreenProps {
  onNavigateToSignIn: () => void;
}

type FieldKey = 'email' | 'newPassword' | 'confirmPassword';

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  onNavigateToSignIn,
}) => {
  const { resetPassword, submitting, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [didReset, setDidReset] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const handleChange = useCallback(
    (setter: (value: string) => void, field: FieldKey) => (value: string) => {
      setter(value);
      if (fieldErrors[field]) {
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      }
      if (didReset) setDidReset(false);
      if (error) clearError();
    },
    [fieldErrors, didReset, error, clearError]
  );

  const handleSubmit = useCallback(async () => {
    const checks: Record<FieldKey, ReturnType<typeof validateEmail>> = {
      email: validateEmail(email),
      newPassword: validatePassword(newPassword),
      confirmPassword: validateConfirmPassword(newPassword, confirmPassword),
    };

    const nextErrors = (Object.keys(checks) as FieldKey[]).reduce<
      Partial<Record<FieldKey, string>>
    >((acc, key) => {
      if (!checks[key].isValid) acc[key] = checks[key].message;
      return acc;
    }, {});

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    const ok = await resetPassword({ email, newPassword });

    if (ok) {
      setDidReset(true);
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [email, newPassword, confirmPassword, resetPassword]);

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Confirm the email on your account and choose a new password."
      footer={
        <TouchableOpacity
          style={styles.backRow}
          onPress={onNavigateToSignIn}
          disabled={submitting}
        >
          <Ionicons name="arrow-back" size={15} color={COLORS.primary} />
          <Text style={styles.backText}>Back to sign in</Text>
        </TouchableOpacity>
      }
    >
      {error ? <AuthBanner variant="error" message={error} /> : null}

      {didReset ? (
        <AuthBanner
          variant="success"
          message="Password updated. Head back to sign in and use your new password."
        />
      ) : null}

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
        label="NEW PASSWORD"
        value={newPassword}
        onChangeText={handleChange(setNewPassword, 'newPassword')}
        placeholder="At least 8 characters"
        iconName="lock-closed-outline"
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        errorMessage={fieldErrors.newPassword}
        editable={!submitting}
      />

      {/* Live password strength meter */}
      {newPassword ? (
        <View style={styles.strengthBlock}>
          <View style={styles.strengthTrack}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[
                  styles.strengthSegment,
                  {
                    backgroundColor: index < strength.score ? strength.color : COLORS.cardBorder,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
        </View>
      ) : null}

      <AuthInput
        label="CONFIRM NEW PASSWORD"
        value={confirmPassword}
        onChangeText={handleChange(setConfirmPassword, 'confirmPassword')}
        placeholder="Re-enter your new password"
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
        label="Update Password"
        iconName="key-outline"
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
  backRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
});
