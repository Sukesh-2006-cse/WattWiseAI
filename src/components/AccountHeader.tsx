/**
 * WattWise AI - Signed-in Account Bar (identity + sign out)
 */

import React, { useCallback } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SPACING } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getDisplayLabel, getInitials } from '../utils/authUtils';

export const AccountHeader: React.FC = () => {
  const { user, signOut, submitting } = useAuth();

  const greeting = getDisplayLabel(user?.displayName ?? null, user?.email ?? null);
  const initials = getInitials(user?.displayName ?? null, user?.email ?? null);

  const handleSignOut = useCallback(() => {
    // `Alert` is a no-op on react-native-web, so confirm with the browser there.
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window === 'undefined' ? true : window.confirm('Sign out of WattWise AI?');
      if (confirmed) void signOut();
      return;
    }

    Alert.alert('Sign out', 'Are you sure you want to sign out of WattWise AI?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => void signOut() },
    ]);
  }, [signOut]);

  return (
    <View style={styles.container}>
      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.identityText}>
          <Text style={styles.greeting} numberOfLines={1}>
            Hi, {greeting}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {user?.email ?? 'Signed in'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
        disabled={submitting}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Ionicons name="log-out-outline" size={16} color={COLORS.danger} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    backgroundColor: COLORS.cardHeader,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryGlow,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  identityText: {
    flex: 1,
  },
  greeting: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  email: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
  },
  signOutText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },
});
