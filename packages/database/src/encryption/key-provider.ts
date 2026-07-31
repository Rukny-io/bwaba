/**
 * 🔒 F-10 — Pluggable encryption key provider.
 *
 * Keys are resolved through an interface so the storage backend can evolve from
 * environment variables → AWS KMS → HashiCorp Vault without touching call sites.
 * Envelope encryption (a KMS-wrapped data key) plugs in by implementing
 * `getDataKey()` to unwrap the DEK at boot and cache it.
 */
import { createHash } from 'crypto';

export interface KeyProvider {
  /** 32-byte data-encryption key (DEK) for AES-256-GCM. */
  getDataKey(): Buffer;
  /** 32-byte key for the deterministic email blind index (HMAC). */
  getBlindIndexKey(): Buffer;
  /** Opaque key version, embedded in ciphertext for rotation. */
  getKeyVersion(): string;
}

function decodeKey(hex: string | undefined, name: string): Buffer {
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      `${name} must be a 64-hex-char (32-byte) key. Generate with: openssl rand -hex 32`,
    );
  }
  return Buffer.from(hex, 'hex');
}

/**
 * Default provider that reads keys from environment variables.
 * FIELD_ENCRYPTION_KEY, BLIND_INDEX_KEY (both 64 hex chars).
 */
export class EnvKeyProvider implements KeyProvider {
  private readonly dataKey: Buffer;
  private readonly blindIndexKey: Buffer;
  private readonly version: string;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    this.dataKey = decodeKey(env.FIELD_ENCRYPTION_KEY, 'FIELD_ENCRYPTION_KEY');
    this.blindIndexKey = decodeKey(env.BLIND_INDEX_KEY, 'BLIND_INDEX_KEY');
    // Version derived from a key fingerprint so rotating the key rotates the tag.
    this.version =
      env.FIELD_ENCRYPTION_KEY_VERSION ||
      'k' + createHash('sha256').update(this.dataKey).digest('hex').slice(0, 8);
  }

  getDataKey(): Buffer {
    return this.dataKey;
  }
  getBlindIndexKey(): Buffer {
    return this.blindIndexKey;
  }
  getKeyVersion(): string {
    return this.version;
  }
}

/**
 * Skeleton for KMS/Vault-backed envelope encryption. Unwrap the wrapped DEK once
 * at construction (async factory) and hold the plaintext DEK in memory only.
 *
 * Example wiring (AWS KMS):
 *   const { Plaintext } = await kms.decrypt({ CiphertextBlob }).promise();
 *   return new StaticKeyProvider(Buffer.from(Plaintext), blindIndexKey, version);
 */
export class StaticKeyProvider implements KeyProvider {
  constructor(
    private readonly dataKey: Buffer,
    private readonly blindIndexKey: Buffer,
    private readonly version: string,
  ) {
    if (dataKey.length !== 32 || blindIndexKey.length !== 32) {
      throw new Error('StaticKeyProvider requires 32-byte keys');
    }
  }
  getDataKey(): Buffer {
    return this.dataKey;
  }
  getBlindIndexKey(): Buffer {
    return this.blindIndexKey;
  }
  getKeyVersion(): string {
    return this.version;
  }
}
