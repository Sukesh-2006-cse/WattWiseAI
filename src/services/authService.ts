/**
 * WattWise AI - Isolated Local Authentication Service Module
 *
 * All credential handling is isolated here.
 * UI components NEVER read the account store directly, never see a password
 * hash, and never handle credentials beyond passing them into these functions.
 * Swapping providers (Firebase, Supabase, a custom Node backend, ...) means
 * rewriting this file alone - every screen keeps working unchanged.
 *
 * Accounts live on the device via AsyncStorage, so sign-in works fully offline.
 */

import {
  AuthErrorCode,
  AuthUser,
  ResetPasswordPayload,
  SignInPayload,
  SignUpPayload,
} from '../types/auth';
import {
  StoredAccount,
  clearSession,
  findAccountByEmail,
  findAccountByUid,
  normalizeEmail,
  readSession,
  saveAccount,
  writeSession,
} from './localAuthStore';
import { generateSalt, generateUid, hashPassword, verifyPassword } from '../utils/passwordUtils';
import { validateEmail, validatePassword } from '../utils/authUtils';
import { PASSWORD_HASHING } from '../constants/auth';

/**
 * Custom Error Class for Authentication errors.
 * Carries a stable, provider-independent `code` plus a user-facing `message`.
 */
export class AuthServiceError extends Error {
  public code: AuthErrorCode;

  constructor(message: string, code: AuthErrorCode) {
    super(message);
    this.name = 'AuthServiceError';
    this.code = code;
  }
}

/**
 * Local auth needs no external project or API keys, so it is always available.
 * Kept as an explicit export so screens stay agnostic about the backend.
 */
export function isAuthConfigured(): boolean {
  return true;
}

/**
 * Strips the credential fields, leaving only what the UI is allowed to see.
 */
function toAuthUser(account: StoredAccount): AuthUser {
  return {
    uid: account.uid,
    email: account.email,
    displayName: account.displayName || null,
    emailVerified: true, // No mail provider offline; local accounts are trusted
    createdAt: account.createdAt,
    lastLoginAt: account.lastLoginAt,
  };
}

/* -------------------------------------------------------------------------- */
/* Session change notification                                                */
/* -------------------------------------------------------------------------- */

type AuthListener = (user: AuthUser | null) => void;

const listeners = new Set<AuthListener>();
let currentUser: AuthUser | null = null;

/**
 * Updates the in-memory session and notifies every subscriber, so the whole
 * app reacts to sign-in / sign-out from a single source of truth.
 */
function setCurrentUser(user: AuthUser | null): void {
  currentUser = user;
  listeners.forEach((listener) => listener(user));
}

/**
 * Wraps an unexpected storage failure in a user-facing error, while letting
 * deliberate AuthServiceErrors pass through untouched.
 */
function toStorageError(error: unknown): AuthServiceError {
  if (error instanceof AuthServiceError) return error;
  return new AuthServiceError(
    'Could not access secure storage on this device. Please try again.',
    'STORAGE_ERROR'
  );
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Registers a new account.
 *
 * Rejects duplicates and re-checks the email/password rules behind the form,
 * so the policy still holds if a screen ever forgets to validate.
 */
export async function signUp({ fullName, email, password }: SignUpPayload): Promise<AuthUser> {
  const normalizedEmail = normalizeEmail(email);

  const emailCheck = validateEmail(normalizedEmail);
  if (!emailCheck.isValid) {
    throw new AuthServiceError(
      emailCheck.message ?? 'Enter a valid email address.',
      'INVALID_EMAIL'
    );
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.isValid) {
    throw new AuthServiceError(
      passwordCheck.message ?? 'That password does not meet the requirements.',
      'WEAK_PASSWORD'
    );
  }

  try {
    const existing = await findAccountByEmail(normalizedEmail);
    if (existing) {
      throw new AuthServiceError(
        'An account with this email already exists. Try signing in instead.',
        'EMAIL_IN_USE'
      );
    }

    const salt = await generateSalt();
    const passwordHash = await hashPassword(password, salt);
    const now = new Date().toISOString();

    const account: StoredAccount = {
      uid: generateUid(),
      email: normalizedEmail,
      displayName: fullName.trim(),
      passwordHash,
      passwordSalt: salt,
      algorithm: PASSWORD_HASHING.ALGORITHM_TAG,
      createdAt: now,
      lastLoginAt: now,
    };

    await saveAccount(account);
    await writeSession({ uid: account.uid, email: account.email, issuedAt: now });

    const authUser = toAuthUser(account);
    setCurrentUser(authUser);
    return authUser;
  } catch (error) {
    throw toStorageError(error);
  }
}

/**
 * Signs an existing user in.
 *
 * A missing account and a wrong password return the same message on purpose,
 * so this screen cannot be used to discover which emails are registered.
 */
export async function signIn({ email, password }: SignInPayload): Promise<AuthUser> {
  const normalizedEmail = normalizeEmail(email);

  try {
    const account = await findAccountByEmail(normalizedEmail);
    const isValid = account
      ? await verifyPassword(password, account.passwordSalt, account.passwordHash)
      : false;

    if (!account || !isValid) {
      throw new AuthServiceError(
        'Incorrect email or password. Please try again.',
        'INVALID_CREDENTIALS'
      );
    }

    const now = new Date().toISOString();
    const updated: StoredAccount = { ...account, lastLoginAt: now };

    await saveAccount(updated);
    await writeSession({ uid: updated.uid, email: updated.email, issuedAt: now });

    const authUser = toAuthUser(updated);
    setCurrentUser(authUser);
    return authUser;
  } catch (error) {
    throw toStorageError(error);
  }
}

/**
 * Ends the current session. The account itself is preserved so the user can
 * sign back in with the same credentials.
 */
export async function signOut(): Promise<void> {
  try {
    await clearSession();
    setCurrentUser(null);
  } catch (error) {
    throw toStorageError(error);
  }
}

/**
 * Resets the password for a local account.
 *
 * There is no mail provider offline, so instead of sending a link this matches
 * the account and sets the new password immediately. The caller is NOT signed
 * in as a side effect - they return to the sign-in screen and log in again.
 */
export async function resetPassword({ email, newPassword }: ResetPasswordPayload): Promise<void> {
  const normalizedEmail = normalizeEmail(email);

  const passwordCheck = validatePassword(newPassword);
  if (!passwordCheck.isValid) {
    throw new AuthServiceError(
      passwordCheck.message ?? 'That password does not meet the requirements.',
      'WEAK_PASSWORD'
    );
  }

  try {
    const account = await findAccountByEmail(normalizedEmail);
    if (!account) {
      throw new AuthServiceError('No account was found for that email address.', 'USER_NOT_FOUND');
    }

    const isSamePassword = await verifyPassword(
      newPassword,
      account.passwordSalt,
      account.passwordHash
    );
    if (isSamePassword) {
      throw new AuthServiceError(
        'That is already your current password. Choose a different one.',
        'SAME_PASSWORD'
      );
    }

    // A fresh salt on every reset means the previous digest cannot be replayed.
    const salt = await generateSalt();
    const passwordHash = await hashPassword(newPassword, salt);

    await saveAccount({
      ...account,
      passwordSalt: salt,
      passwordHash,
      algorithm: PASSWORD_HASHING.ALGORITHM_TAG,
    });
  } catch (error) {
    throw toStorageError(error);
  }
}

/**
 * Returns the signed-in user from memory, or null when signed out.
 * Synchronous: the persisted session is restored by `subscribeToAuthChanges`.
 */
export function getCurrentUser(): AuthUser | null {
  return currentUser;
}

/**
 * Subscribes to session changes (sign-in, sign-out, and the initial restore of
 * a persisted session on cold start).
 *
 * The callback fires once with the restored session (or null) as soon as the
 * store has been read, which is how the app knows it can leave the splash state.
 *
 * @returns an unsubscribe function.
 */
export function subscribeToAuthChanges(callback: AuthListener): () => void {
  listeners.add(callback);

  // Restore the persisted session, then report the result to this subscriber.
  void (async () => {
    try {
      const session = await readSession();
      const account = session ? await findAccountByUid(session.uid) : null;

      if (account) {
        currentUser = toAuthUser(account);
      } else {
        // The session pointed at an account that no longer exists - drop it.
        if (session) await clearSession();
        currentUser = null;
      }
    } catch {
      currentUser = null;
    }

    // Guard against a subscriber that unmounted while the store was being read.
    if (listeners.has(callback)) callback(currentUser);
  })();

  return () => {
    listeners.delete(callback);
  };
}
