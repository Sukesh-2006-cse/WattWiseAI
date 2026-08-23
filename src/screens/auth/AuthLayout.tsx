/**
 * WattWise AI - Shared Auth Screen Shell (branding, scroll & keyboard handling)
 */

import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SPACING } from '../../constants/theme';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  children,
  footer,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Mark */}
          <View style={styles.brandBlock}>
            <View style={styles.logoBadge}>
              <Ionicons name="flash" size={30} color={COLORS.primary} />
            </View>
            <Text style={styles.appName}>WattWise AI</Text>
            <Text style={styles.tagline}>Smart Energy Monitoring</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <View style={styles.formBody}>{children}</View>
          </View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.4)',
    marginBottom: SPACING.sm,
  },
  appName: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 21,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  formBody: {
    marginTop: SPACING.lg,
  },
  footer: {
    marginTop: SPACING.md,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
});
