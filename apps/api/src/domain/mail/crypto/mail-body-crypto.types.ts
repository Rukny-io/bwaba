import type { MailBodyCryptoStatus } from '@prisma/client';

export const MAIL_BODY_CRYPTO_VERSION = 1;

export const MAIL_BODY_CRYPTO_DEK_CACHE_TTL_SEC = 600;

export type MailBodyField = 'bodyText' | 'bodyHtml';

export type EncryptedBodyPayload = {
  bodyCryptoStatus: MailBodyCryptoStatus;
  bodyCryptoVersion: number;
  bodyKmsKeyId: string;
  bodyEncryptedDek: Buffer;
  bodyTextCiphertext: Buffer | null;
  bodyHtmlCiphertext: Buffer | null;
};

export type ResolvedMailBodies = {
  bodyText: string | null;
  bodyHtml: string | null;
};

export function toPrismaBytes(
  value: Buffer | null | undefined,
): Uint8Array<ArrayBuffer> | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  return copy;
}

export function toBuffer(
  value: Uint8Array | Buffer | null | undefined,
): Buffer | null {
  if (value == null) return null;
  return Buffer.isBuffer(value) ? value : Buffer.from(value);
}

export type MailMessageBodyRow = {
  id: string;
  mailboxId: string;
  messageId: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  bodyCryptoStatus: MailBodyCryptoStatus;
  bodyCryptoVersion: number | null;
  bodyKmsKeyId: string | null;
  bodyEncryptedDek: Buffer | null;
  bodyTextCiphertext: Buffer | null;
  bodyHtmlCiphertext: Buffer | null;
};
