/**
 * WattWise AI - Password Hashing Helpers
 *
 * Raw passwords never leave this module and are never persisted. Accounts store
 * only a random per-account salt plus an iterated SHA-256 digest.
 */

import * as Crypto from 'expo-crypto';
import { PASSWORD_HASHING } from '../constants/auth';

/**
 * Generates a cryptographically random hex salt for a new account.
 */
export async function generateSalt(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(PASSWORD_HASHING.SALT_BYTES);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Derives the stored digest for a password + salt pair.
 * The same input always produces the same output, which is what makes
 * verification possible without ever keeping the password itself.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  let digest = `${salt}:${password}`;

  for (let round = 0; round < PASSWORD_HASHING.ITERATIONS; round += 1) {
    digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, digest);
  }

  return digest;
}

/**
 * Compares two digests without an early exit, so the comparison time does not
 * leak how many leading characters matched.
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Verifies a candidate password against a stored salt + digest.
 */
export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  const candidate = await hashPassword(password, salt);
  return constantTimeEquals(candidate, expectedHash);
}

/**
 * Generates a unique account identifier.
 */
export function generateUid(): string {
  return Crypto.randomUUID();
}
