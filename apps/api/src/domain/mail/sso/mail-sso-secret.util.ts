import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const SALT = 'rukny-mail-sso-idp-secret';
let cachedKey: { source: string; key: Buffer } | null = null;

function keyFor(source: string): Buffer {
  if (cachedKey?.source === source) return cachedKey.key;
  const key = scryptSync(source, SALT, 32);
  cachedKey = { source, key };
  return key;
}

function masterKey(): string {
  const value = process.env.MAIL_SSO_SECRET_KEY || process.env.ENCRYPTION_KEY || '';
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error('MAIL_SSO_SECRET_KEY or ENCRYPTION_KEY must be set to store IdP secrets.');
  }
  return value || 'dev-only-mail-sso-key';
}

/** AES-256-GCM, encoded as base64url(iv).base64url(tag).base64url(ciphertext). */
export function encryptMailSsoSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFor(masterKey()), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((b) => b.toString('base64url')).join('.');
}

export function decryptMailSsoSecret(ciphertext: string): string {
  const [iv, tag, data] = ciphertext.split('.').map((part) => Buffer.from(part, 'base64url'));
  if (!iv || !tag || !data) throw new Error('Invalid encrypted secret.');
  const decipher = createDecipheriv('aes-256-gcm', keyFor(masterKey()), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}
