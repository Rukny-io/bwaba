import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DecryptCommand,
  GenerateDataKeyCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import { randomBytes } from 'crypto';
import {
  devFallbackKeyId,
  devFallbackUnwrapDek,
  devFallbackWrapDek,
  isDevFallbackWrappedDek,
} from './mail-kms-dev-fallback';

export type GeneratedDataKey = {
  plaintextKey: Buffer;
  encryptedKey: Buffer;
  keyId: string;
};

@Injectable()
export class MailKmsClient {
  private readonly logger = new Logger(MailKmsClient.name);
  private readonly client: KMSClient;
  private readonly keyId: string;
  private readonly devFallback: boolean;
  private readonly fieldEncryptionKey: string;
  private warnedDevFallback = false;

  constructor(private readonly config: ConfigService) {
    const region =
      this.config.get<string>('MAIL_AWS_REGION')?.trim() ||
      this.config.get<string>('AWS_REGION')?.trim() ||
      'eu-north-1';
    this.keyId =
      this.config.get<string>('MAIL_KMS_KEY_ID')?.trim() ||
      this.config.get<string>('AWS_KMS_KEY_ID')?.trim() ||
      '';
    this.client = new KMSClient({ region });
    this.devFallback =
      this.config.get<string>('MAIL_BODY_ENCRYPTION_DEV_FALLBACK') === 'true' &&
      this.config.get<string>('NODE_ENV') !== 'production';
    this.fieldEncryptionKey =
      this.config.get<string>('FIELD_ENCRYPTION_KEY')?.trim() || '';
  }

  isConfigured(): boolean {
    return this.keyId.length > 0;
  }

  canUseEncryption(): boolean {
    return this.isConfigured() || this.devFallbackActive();
  }

  configuredKeyId(): string {
    return this.isConfigured() ? this.keyId : devFallbackKeyId();
  }

  private devFallbackActive(): boolean {
    return this.devFallback && this.fieldEncryptionKey.length >= 64;
  }

  async generateDataKey(): Promise<GeneratedDataKey> {
    if (this.devFallbackActive() && !this.isConfigured()) {
      if (!this.warnedDevFallback) {
        this.logger.warn(
          'Using MAIL_BODY_ENCRYPTION_DEV_FALLBACK — never enable in production',
        );
        this.warnedDevFallback = true;
      }
      const plaintextKey = randomBytes(32);
      return {
        plaintextKey,
        encryptedKey: devFallbackWrapDek(
          plaintextKey,
          this.fieldEncryptionKey,
        ),
        keyId: devFallbackKeyId(),
      };
    }
    if (!this.isConfigured()) {
      throw new Error('MAIL_KMS_KEY_ID is not configured');
    }
    const response = await this.client.send(
      new GenerateDataKeyCommand({
        KeyId: this.keyId,
        KeySpec: 'AES_256',
      }),
    );
    if (!response.Plaintext || !response.CiphertextBlob) {
      throw new Error('KMS GenerateDataKey returned empty key material');
    }
    return {
      plaintextKey: Buffer.from(response.Plaintext),
      encryptedKey: Buffer.from(response.CiphertextBlob),
      keyId: response.KeyId || this.keyId,
    };
  }

  async decryptDataKey(encryptedKey: Buffer): Promise<Buffer> {
    if (isDevFallbackWrappedDek(encryptedKey)) {
      if (!this.devFallbackActive()) {
        throw new Error('Dev-fallback DEK cannot be decrypted in this environment');
      }
      return devFallbackUnwrapDek(encryptedKey, this.fieldEncryptionKey);
    }
    const response = await this.client.send(
      new DecryptCommand({
        CiphertextBlob: encryptedKey,
      }),
    );
    if (!response.Plaintext) {
      throw new Error('KMS Decrypt returned empty plaintext key');
    }
    return Buffer.from(response.Plaintext);
  }

  logConfigurationWarningOnce(): void {
    if (!this.canUseEncryption()) {
      this.logger.warn(
        'Mail body encryption unavailable: set MAIL_KMS_KEY_ID or dev fallback (non-production only)',
      );
    }
  }
}
