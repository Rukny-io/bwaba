import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { MailBodyCryptoStatus } from '@prisma/client';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';
import { RedisService } from '../../../core/cache/redis.service';
import {
  MAIL_BODY_CRYPTO_DEK_CACHE_TTL_SEC,
  MAIL_BODY_CRYPTO_VERSION,
  type EncryptedBodyPayload,
  type MailBodyField,
  type MailMessageBodyRow,
  type ResolvedMailBodies,
} from './mail-body-crypto.types';
import { MailKmsClient } from './mail-kms.client';

const GCM_NONCE_BYTES = 12;
const GCM_TAG_BYTES = 16;

@Injectable()
export class MailBodyCryptoService {
  private readonly logger = new Logger(MailBodyCryptoService.name);

  constructor(
    private readonly kms: MailKmsClient,
    private readonly redis: RedisService,
  ) {
    this.kms.logConfigurationWarningOnce();
  }

  async buildCreateFields(input: {
    encryptionEnabled: boolean;
    mailboxId: string;
    messageId: string;
    bodyText: string | null;
    bodyHtml: string | null;
    dualWritePlaintext: boolean;
  }): Promise<{
    bodyText: string | null;
    bodyHtml: string | null;
    bodyCryptoStatus: MailBodyCryptoStatus;
    bodyCryptoVersion: number | null;
    bodyKmsKeyId: string | null;
    bodyEncryptedDek: Buffer | null;
    bodyTextCiphertext: Buffer | null;
    bodyHtmlCiphertext: Buffer | null;
  }> {
    if (!input.encryptionEnabled) {
      return {
        bodyText: input.bodyText,
        bodyHtml: input.bodyHtml,
        bodyCryptoStatus: MailBodyCryptoStatus.NONE,
        bodyCryptoVersion: null,
        bodyKmsKeyId: null,
        bodyEncryptedDek: null,
        bodyTextCiphertext: null,
        bodyHtmlCiphertext: null,
      };
    }

    const result = await this.encryptBodies({
      mailboxId: input.mailboxId,
      messageId: input.messageId,
      bodyText: input.bodyText,
      bodyHtml: input.bodyHtml,
      dualWritePlaintext: input.dualWritePlaintext,
    });

    return {
      bodyText: result.bodyText,
      bodyHtml: result.bodyHtml,
      bodyCryptoStatus: result.encrypted.bodyCryptoStatus,
      bodyCryptoVersion: result.encrypted.bodyCryptoVersion,
      bodyKmsKeyId: result.encrypted.bodyKmsKeyId,
      bodyEncryptedDek: result.encrypted.bodyEncryptedDek,
      bodyTextCiphertext: result.encrypted.bodyTextCiphertext,
      bodyHtmlCiphertext: result.encrypted.bodyHtmlCiphertext,
    };
  }

  hasEncryptedPayload(row: MailMessageBodyRow): boolean {
    return (
      row.bodyCryptoStatus !== MailBodyCryptoStatus.NONE &&
      row.bodyEncryptedDek != null &&
      (row.bodyTextCiphertext != null || row.bodyHtmlCiphertext != null)
    );
  }

  async encryptBodies(input: {
    mailboxId: string;
    messageId: string;
    bodyText: string | null;
    bodyHtml: string | null;
    /** Dual-write: keep plaintext columns while status is MIGRATING */
    dualWritePlaintext: boolean;
  }): Promise<{
    bodyText: string | null;
    bodyHtml: string | null;
    encrypted: EncryptedBodyPayload;
  }> {
    if (!this.kms.canUseEncryption()) {
      throw new InternalServerErrorException(
        'Mail body encryption is enabled but KMS/dev fallback is not configured',
      );
    }

    const { plaintextKey, encryptedKey, keyId } =
      await this.kms.generateDataKey();

    try {
      const bodyTextCiphertext = this.encryptField(
        input.bodyText,
        plaintextKey,
        input.mailboxId,
        input.messageId,
        'bodyText',
      );
      const bodyHtmlCiphertext = this.encryptField(
        input.bodyHtml,
        plaintextKey,
        input.mailboxId,
        input.messageId,
        'bodyHtml',
      );

      const encrypted: EncryptedBodyPayload = {
        bodyCryptoStatus: input.dualWritePlaintext
          ? MailBodyCryptoStatus.MIGRATING
          : MailBodyCryptoStatus.ENCRYPTED,
        bodyCryptoVersion: MAIL_BODY_CRYPTO_VERSION,
        bodyKmsKeyId: keyId,
        bodyEncryptedDek: encryptedKey,
        bodyTextCiphertext,
        bodyHtmlCiphertext,
      };

      return {
        bodyText: input.dualWritePlaintext ? input.bodyText : null,
        bodyHtml: input.dualWritePlaintext ? input.bodyHtml : null,
        encrypted,
      };
    } finally {
      plaintextKey.fill(0);
    }
  }

  async resolveBodies(row: MailMessageBodyRow): Promise<ResolvedMailBodies> {
    if (!this.hasEncryptedPayload(row)) {
      return {
        bodyText: row.bodyText,
        bodyHtml: row.bodyHtml,
      };
    }

    const messageId = row.messageId || row.id;

    try {
      const dek = await this.unwrapDek(row, messageId);
      try {
        const bodyText = this.decryptField(
          row.bodyTextCiphertext,
          dek,
          row.mailboxId,
          messageId,
          'bodyText',
        );
        const bodyHtml = this.decryptField(
          row.bodyHtmlCiphertext,
          dek,
          row.mailboxId,
          messageId,
          'bodyHtml',
        );
        return { bodyText, bodyHtml };
      } finally {
        dek.fill(0);
      }
    } catch (error) {
      if (row.bodyText != null || row.bodyHtml != null) {
        this.logger.warn(
          `Decrypt failed for message ${row.id}; falling back to plaintext during MIGRATING`,
        );
        return {
          bodyText: row.bodyText,
          bodyHtml: row.bodyHtml,
        };
      }
      throw new InternalServerErrorException('BODY_DECRYPT_FAILED');
    }
  }

  private aad(
    mailboxId: string,
    messageId: string,
    field: MailBodyField,
  ): Buffer {
    return Buffer.from(
      `mailMessage:${messageId}:${field}:mailbox:${mailboxId}`,
      'utf8',
    );
  }

  private encryptField(
    plaintext: string | null,
    dek: Buffer,
    mailboxId: string,
    messageId: string,
    field: MailBodyField,
  ): Buffer | null {
    if (!plaintext) return null;
    const nonce = randomBytes(GCM_NONCE_BYTES);
    const cipher = createCipheriv('aes-256-gcm', dek, nonce);
    cipher.setAAD(this.aad(mailboxId, messageId, field));
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([nonce, ciphertext, tag]);
  }

  private decryptField(
    payload: Buffer | null,
    dek: Buffer,
    mailboxId: string,
    messageId: string,
    field: MailBodyField,
  ): string | null {
    if (!payload || payload.length === 0) return null;
    if (payload.length < GCM_NONCE_BYTES + GCM_TAG_BYTES + 1) {
      throw new Error('Ciphertext too short');
    }
    const nonce = payload.subarray(0, GCM_NONCE_BYTES);
    const tag = payload.subarray(payload.length - GCM_TAG_BYTES);
    const ciphertext = payload.subarray(
      GCM_NONCE_BYTES,
      payload.length - GCM_TAG_BYTES,
    );
    const decipher = createDecipheriv('aes-256-gcm', dek, nonce);
    decipher.setAAD(this.aad(mailboxId, messageId, field));
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString('utf8');
  }

  private dekCacheKey(messageRecordId: string): string {
    return `mail:body-dek:${messageRecordId}`;
  }

  private async unwrapDek(
    row: MailMessageBodyRow,
    messageId: string,
  ): Promise<Buffer> {
    const cacheKey = this.dekCacheKey(row.id);
    const cached = await this.redis.get<string>(cacheKey);
    if (cached) {
      return Buffer.from(cached, 'base64');
    }
    if (!row.bodyEncryptedDek) {
      throw new Error('Missing encrypted DEK');
    }
    const dek = await this.kms.decryptDataKey(
      Buffer.isBuffer(row.bodyEncryptedDek)
        ? row.bodyEncryptedDek
        : Buffer.from(row.bodyEncryptedDek),
    );
    await this.redis.setex(
      cacheKey,
      MAIL_BODY_CRYPTO_DEK_CACHE_TTL_SEC,
      dek.toString('base64'),
    );
    return dek;
  }
}
