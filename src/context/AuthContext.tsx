/**
 * WattWise AI - Global Authentication State Provider
 *
 * Holds the single source of truth for "who is signed in".
 * The session is restored automatically on cold start from the on-device
 * account store, so a signed-in user never sees the login screen again
 * until they explicitly sign out.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as authService from '../services/authService';
import { AuthServiceError } from '../services/authService';
import {
  AuthUser,
  ResetPasswordPayload,
  SignInPayload,
  SignUpPayload,
} from '../types/auth';

interface AuthContextValue {
  /** The signed-in user, or null when signed out. */
  user: AuthUser | null;
  /** True until the persisted session has been restored (splash gate). */
  initializing: boolean;
  /** True while a sign-in / sign-up / sign-out request is in flight. */
  submitting: boolean;
  /** Last auth error message, or null. */
  error: string | null;
  isAuthenticated: boolean;

  signIn: (payload: SignInPayload) => Promise<boolean>;
  signUp: (payload: SignUpPayload) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  /**
   * Subscribe once to session changes. This fires as soon as the on-device
   * account store has been read, which ends the splash state.
   */
  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((nextUser) => {
      if (!isMounted.current) return;
      setUser(nextUser);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Shared wrapper: manages the submitting flag and normalizes errors.
   * The auth listener above is what actually sets `user`, so the UI reacts to
   * one source of truth regardless of which entry point triggered the change.
   */
  const run = useCallback(async (action: () => Promise<void>): Promise<boolean> => {
    setSubmitting(true);
    setError(null);

    try {
      await action();
      return true;
    } catch (err: any) {
      const message =
        err instanceof AuthServiceError
          ? err.message
          : err?.message || 'Something went wrong. Please try again.';
      if (isMounted.current) setError(message);
      return false;
    } finally {
      if (isMounted.current) setSubmitting(false);
    }
  }, []);

  const signIn = useCallback(
    (payload: SignInPayload) =>
      run(async () => {
        const nextUser = await authService.signIn(payload);
        if (isMounted.current) setUser(nextUser);
      }),
    [run]
  );

  const signUp = useCallback(
    (payload: SignUpPayload) =>
      run(async () => {
        const nextUser = await authService.signUp(payload);
        if (isMounted.current) setUser(nextUser);
      }),
    [run]
  );

  const resetPassword = useCallback(
    (payload: ResetPasswordPayload) => run(() => authService.resetPassword(payload)),
    [run]
  );

  const signOut = useCallback(async () => {
    await run(async () => {
      await authService.signOut();
      if (isMounted.current) setUser(null);
    });
  }, [run]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      submitting,
      error,
      isAuthenticated: Boolean(user),
      signIn,
      signUp,
      signOut,
      resetPassword,
      clearError,
    }),
    [
      user,
      initializing,
      submitting,
      error,
      signIn,
      signUp,
      signOut,
      resetPassword,
      clearError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Access the auth session. Throws if used outside <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return context;
}
