/**
 * WattWise AI - Local Authentication Configuration & Validation Constants
 */

/**
 * AsyncStorage keys backing the on-device account store.
 *
 * ACCOUNTS -> map of normalized email -> StoredAccount (never holds a raw password)
 * SESSION  -> the currently signed-in account reference
 */
export const AUTH_STORAGE_KEYS = {
  ACCOUNTS: '@wattwise/auth/accounts',
  SESSION: '@wattwise/auth/session',
};

/**
 * Password hashing parameters.
 *
 * Passwords are never stored. Each account keeps a random per-account salt and
 * an iterated SHA-256 digest of `salt:password`. Iterating slows down offline
 * brute-force attempts against a stolen device store; the count is kept modest
 * because every round is a bridge call into the native crypto module.
 */
export const PASSWORD_HASHING = {
  ITERATIONS: 1000,
  SALT_BYTES: 16,
  ALGORITHM_TAG: 'sha256-1000',
};

/**
 * Password / form validation rules.
 */
export const AUTH_RULES = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 64,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  // Standard practical email pattern (RFC-complete regexes are impractical here)
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/,
};
