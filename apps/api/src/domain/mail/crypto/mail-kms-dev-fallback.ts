import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const DEV_KEY_ID = 'local-dev-fallback';
const DEV_PREFIX = 'rukny-mail-dek:';

function masterKey(fieldEncryptionKey: string): Buffer {
  return scryptSync(fieldEncryptionKey, 'rukny-mail-body-dek-salt', 32);
}

export function devFallbackKeyId(): string {
  return DEV_KEY_ID;
}

export function devFallbackWrapDek(
  plaintextDek: Buffer,
  fieldEncryptionKey: string,
): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', masterKey(fieldEncryptionKey), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintextDek),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.from(
    `${DEV_PREFIX}${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`,
    'utf8',
  );
}

export function devFallbackUnwrapDek(
  wrapped: Buffer,
  fieldEncryptionKey: string,
): Buffer {
  const decoded = wrapped.toString('utf8');
  if (!decoded.startsWith(DEV_PREFIX)) {
    throw new Error('Not a dev-fallback wrapped DEK');
  }
  const payload = decoded.slice(DEV_PREFIX.length);
  const [ivHex, encryptedHex, tagHex] = payload.split(':');
  if (!ivHex || !encryptedHex || !tagHex) {
    throw new Error('Invalid dev-fallback DEK format');
  }
  const decipher = createDecipheriv(
    'aes-256-gcm',
    masterKey(fieldEncryptionKey),
    Buffer.from(ivHex, 'hex'),
  );
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);
}

export function isDevFallbackWrappedDek(wrapped: Buffer): boolean {
  return wrapped.toString('utf8').startsWith(DEV_PREFIX);
}
