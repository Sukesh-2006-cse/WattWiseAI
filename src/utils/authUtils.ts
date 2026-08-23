/**
 * WattWise AI - Authentication Form Validation Helpers
 */

import { AUTH_RULES } from '../constants/auth';
import { COLORS } from '../constants/theme';
import { FieldValidation, PasswordStrength } from '../types/auth';

const VALID: FieldValidation = { isValid: true };

/**
 * Validates a full name for the sign-up form.
 */
export function validateFullName(name: string): FieldValidation {
  const trimmed = name.trim();

  if (!trimmed) {
    return { isValid: false, message: 'Full name is required.' };
  }
  if (trimmed.length < AUTH_RULES.MIN_NAME_LENGTH) {
    return { isValid: false, message: `Name must be at least ${AUTH_RULES.MIN_NAME_LENGTH} characters.` };
  }
  if (trimmed.length > AUTH_RULES.MAX_NAME_LENGTH) {
    return { isValid: false, message: `Name must be under ${AUTH_RULES.MAX_NAME_LENGTH} characters.` };
  }
  return VALID;
}

/**
 * Validates an email address.
 */
export function validateEmail(email: string): FieldValidation {
  const trimmed = email.trim();

  if (!trimmed) {
    return { isValid: false, message: 'Email is required.' };
  }
  if (!AUTH_RULES.EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, message: 'Enter a valid email address.' };
  }
  return VALID;
}

/**
 * Validates a password against the app's minimum strength policy.
 */
export function validatePassword(password: string): FieldValidation {
  if (!password) {
    return { isValid: false, message: 'Password is required.' };
  }
  if (password.length < AUTH_RULES.MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      message: `Password must be at least ${AUTH_RULES.MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  if (password.length > AUTH_RULES.MAX_PASSWORD_LENGTH) {
    return {
      isValid: false,
      message: `Password must be under ${AUTH_RULES.MAX_PASSWORD_LENGTH} characters.`,
    };
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain both letters and numbers.' };
  }
  return VALID;
}

/**
 * Validates that the confirmation field matches the chosen password.
 */
export function validateConfirmPassword(password: string, confirm: string): FieldValidation {
  if (!confirm) {
    return { isValid: false, message: 'Please confirm your password.' };
  }
  if (password !== confirm) {
    return { isValid: false, message: 'Passwords do not match.' };
  }
  return VALID;
}

/**
 * Scores password strength 0-4 for the sign-up strength meter.
 */
export function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;

  if (password.length >= AUTH_RULES.MIN_PASSWORD_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { level: 'WEAK', score, label: 'Weak password', color: COLORS.danger };
  }
  if (score <= 2) {
    return { level: 'FAIR', score, label: 'Fair password', color: COLORS.warning };
  }
  return { level: 'STRONG', score, label: 'Strong password', color: COLORS.success };
}

/**
 * Derives a short display label (first name, or the email local part)
 * for greeting the signed-in user.
 */
export function getDisplayLabel(displayName: string | null, email: string | null): string {
  if (displayName && displayName.trim()) {
    return displayName.trim().split(/\s+/)[0];
  }
  if (email) {
    return email.split('@')[0];
  }
  return 'there';
}

/**
 * Builds up-to-two-letter initials for the profile avatar.
 */
export function getInitials(displayName: string | null, email: string | null): string {
  if (displayName && displayName.trim()) {
    const parts = displayName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const second = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + second).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'WW';
}
