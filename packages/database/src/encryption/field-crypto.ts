/**
 * 🔒 F-10 — Field-level AES-256-GCM encryption + email blind index.
 *
 * Ciphertext envelope (string, safe to store in a text column):
 *   enc:v1:<keyVersion>:<base64url(iv)>:<base64url(tag)>:<base64url(ciphertext)>
 *
 * - AES-256-GCM gives confidentiality + integrity (auth tag).
 * - A random 12-byte IV per value ⇒ identical plaintexts encrypt differently
 *   (semantic security), so encrypted columns are NOT queryable by value.
 * - For fields that MUST support equality lookups (email), we additionally store
 *   a deterministic HMAC-SHA256 "blind index" in a separate column and rewrite
 *   `where: { email }` → `where: { emailBlindIndex }`.
 */
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto';
import type { KeyProvider } from './key-provider';

const PREFIX = 'enc';
const SCHEME = 'v1';
const IV_BYTES = 12;

export function isEncrypted(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(`${PREFIX}:${SCHEME}:`);
}

export function encryptValue(plaintext: string, keys: KeyProvider): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', keys.getDataKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    PREFIX,
    SCHEME,
    keys.getKeyVersion(),
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(':');
}

/**
 * Decrypt an envelope. Returns plaintext values as-is (migration fallback), so
 * reads work while the backfill job is still encrypting existing rows.
 */
export function decryptValue(value: string, keys: KeyProvider): string {
  if (!isEncrypted(value)) return value; // plaintext (pre-migration) passthrough

  const parts = value.split(':');
  // enc : v1 : version : iv : tag : ct  → 6 parts
  if (parts.length !== 6) return value;
  const [, , , ivB64, tagB64, ctB64] = parts;
  try {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      keys.getDataKey(),
      Buffer.from(ivB64, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ctB64, 'base64url')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  } catch (err) {
    throw new Error(
      `Field decryption failed (wrong key or tampered data): ${(err as Error).message}`,
    );
  }
}

/**
 * Deterministic blind index for equality search on encrypted fields.
 * Normalizes then HMACs the value so identical inputs map to the same index
 * without revealing plaintext to anyone lacking BLIND_INDEX_KEY.
 */
export function blindIndex(value: string, keys: KeyProvider): string {
  const normalized = value.trim().toLowerCase();
  return createHmac('sha256', keys.getBlindIndexKey())
    .update(normalized)
    .digest('hex');
}
