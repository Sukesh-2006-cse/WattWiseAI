/**
 * WattWise AI - On-Device Account & Session Persistence
 *
 * The storage half of local authentication: it knows how accounts and the
 * active session are written to AsyncStorage, and nothing else. Credential
 * policy (hashing, validation, error mapping) lives in `authService.ts`.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_STORAGE_KEYS } from '../constants/auth';

/**
 * A persisted account record. `passwordHash` + `passwordSalt` replace the
 * password entirely - the raw value is never written to disk.
 */
export interface StoredAccount {
  uid: string;
  email: string; // always normalized (trimmed + lowercased)
  displayName: string;
  passwordHash: string;
  passwordSalt: string;
  algorithm: string;
  createdAt: string;
  lastLoginAt: string | null;
}

/**
 * The active session pointer written on sign-in and cleared on sign-out.
 */
export interface StoredSession {
  uid: string;
  email: string;
  issuedAt: string;
}

/** Account store shape: normalized email -> account. */
type AccountMap = Record<string, StoredAccount>;

/**
 * Normalizes an email into the canonical key used by the store, so
 * "  Jane@Example.COM " and "jane@example.com" are the same account.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Reads every stored account. Returns an empty map on first run or if the
 * stored JSON is unreadable, so a corrupt entry can never hard-crash boot.
 */
export async function readAccounts(): Promise<AccountMap> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.ACCOUNTS);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as AccountMap) : {};
  } catch {
    return {};
  }
}

/**
 * Persists the full account map.
 */
export async function writeAccounts(accounts: AccountMap): Promise<void> {
  await AsyncStorage.setItem(AUTH_STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
}

/**
 * Looks up a single account by email, or null when no account exists.
 */
export async function findAccountByEmail(email: string): Promise<StoredAccount | null> {
  const accounts = await readAccounts();
  return accounts[normalizeEmail(email)] ?? null;
}

/**
 * Looks up a single account by uid, or null when none matches.
 */
export async function findAccountByUid(uid: string): Promise<StoredAccount | null> {
  const accounts = await readAccounts();
  return Object.values(accounts).find((account) => account.uid === uid) ?? null;
}

/**
 * Inserts or replaces an account, keyed by its normalized email.
 */
export async function saveAccount(account: StoredAccount): Promise<void> {
  const accounts = await readAccounts();
  accounts[normalizeEmail(account.email)] = account;
  await writeAccounts(accounts);
}

/**
 * Reads the persisted session pointer, or null when signed out.
 */
export async function readSession(): Promise<StoredSession | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.SESSION);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && parsed.uid ? (parsed as StoredSession) : null;
  } catch {
    return null;
  }
}

/**
 * Writes the session pointer for a freshly authenticated account.
 */
export async function writeSession(session: StoredSession): Promise<void> {
  await AsyncStorage.setItem(AUTH_STORAGE_KEYS.SESSION, JSON.stringify(session));
}

/**
 * Clears the session pointer. Accounts are left untouched.
 */
export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
}
