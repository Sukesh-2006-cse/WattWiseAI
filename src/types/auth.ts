/**
 * WattWise AI - Authentication Data Models & Type Definitions
 */

/**
 * Normalized authenticated user object exposed to the UI layer.
 * The UI never touches raw stored account records (which carry the password
 * hash), so the auth provider can be swapped without touching any screen.
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  createdAt: string | null;
  lastLoginAt: string | null;
}

/**
 * Stable, provider-independent error codes surfaced to the UI.
 */
export type AuthErrorCode =
  | 'INVALID_EMAIL'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_IN_USE'
  | 'WEAK_PASSWORD'
  | 'USER_NOT_FOUND'
  | 'SAME_PASSWORD'
  | 'STORAGE_ERROR'
  | 'UNKNOWN';

/**
 * Credentials accepted by the sign-in flow.
 */
export interface SignInPayload {
  email: string;
  password: string;
}

/**
 * Credentials accepted by the sign-up flow.
 */
export interface SignUpPayload {
  fullName: string;
  email: string;
  password: string;
}

/**
 * Payload accepted by the local password reset flow. Without an email
 * provider, the new password is set directly after the account is matched.
 */
export interface ResetPasswordPayload {
  email: string;
  newPassword: string;
}

/**
 * Result of validating a single form field.
 */
export interface FieldValidation {
  isValid: boolean;
  message?: string;
}

/**
 * Password strength meter output used by the sign-up screen.
 */
export type PasswordStrengthLevel = 'WEAK' | 'FAIR' | 'STRONG';

export interface PasswordStrength {
  level: PasswordStrengthLevel;
  score: number; // 0 - 4
  label: string;
  color: string;
}
