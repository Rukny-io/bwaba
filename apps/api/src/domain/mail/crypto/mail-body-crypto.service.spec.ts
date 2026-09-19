import { MailBodyCryptoStatus } from '@prisma/client';
import { MailBodyCryptoService } from './mail-body-crypto.service';
import { MailKmsClient } from './mail-kms.client';
import type { MailMessageBodyRow } from './mail-body-crypto.types';

describe('MailBodyCryptoService', () => {
  const dek = Buffer.alloc(32, 7);

  function service() {
    const kms = {
      isConfigured: () => true,
      canUseEncryption: () => true,
      logConfigurationWarningOnce: () => undefined,
      generateDataKey: jest.fn(async () => ({
        plaintextKey: dek,
        encryptedKey: Buffer.from('encrypted-dek'),
        keyId: 'arn:aws:kms:eu-north-1:123:key/abc',
      })),
      decryptDataKey: jest.fn(async () => dek),
    } as unknown as MailKmsClient;

    const redis = {
      get: jest.fn(async () => null),
      setex: jest.fn(async () => undefined),
    };

    return new MailBodyCryptoService(kms, redis as never);
  }

  it('encrypts and decrypts bodies with AAD binding', async () => {
    const subject = service();
    const created = await subject.buildCreateFields({
      encryptionEnabled: true,
      mailboxId: 'mbx-1',
      messageId: '<msg@test.com>',
      bodyText: 'hello',
      bodyHtml: '<p>hello</p>',
      dualWritePlaintext: true,
    });

    expect(created.bodyCryptoStatus).toBe(MailBodyCryptoStatus.MIGRATING);
    expect(created.bodyText).toBe('hello');
    expect(created.bodyEncryptedDek).toBeTruthy();
    expect(created.bodyTextCiphertext).toBeTruthy();

    const row: MailMessageBodyRow = {
      id: 'row-1',
      mailboxId: 'mbx-1',
      messageId: '<msg@test.com>',
      bodyText: created.bodyText,
      bodyHtml: created.bodyHtml,
      bodyCryptoStatus: created.bodyCryptoStatus,
      bodyCryptoVersion: created.bodyCryptoVersion,
      bodyKmsKeyId: created.bodyKmsKeyId,
      bodyEncryptedDek: created.bodyEncryptedDek,
      bodyTextCiphertext: created.bodyTextCiphertext,
      bodyHtmlCiphertext: created.bodyHtmlCiphertext,
    };

    const resolved = await subject.resolveBodies(row);
    expect(resolved.bodyText).toBe('hello');
    expect(resolved.bodyHtml).toBe('<p>hello</p>');
  });

  it('returns plaintext when encryption disabled', async () => {
    const subject = service();
    const fields = await subject.buildCreateFields({
      encryptionEnabled: false,
      mailboxId: 'mbx-1',
      messageId: '<msg@test.com>',
      bodyText: 'plain',
      bodyHtml: null,
      dualWritePlaintext: true,
    });
    expect(fields.bodyCryptoStatus).toBe(MailBodyCryptoStatus.NONE);
    expect(fields.bodyText).toBe('plain');
    expect(fields.bodyEncryptedDek).toBeNull();
  });

  it('fails decrypt when AAD mailbox does not match', async () => {
    const subject = service();
    const created = await subject.buildCreateFields({
      encryptionEnabled: true,
      mailboxId: 'mbx-1',
      messageId: '<msg@test.com>',
      bodyText: 'secret',
      bodyHtml: null,
      dualWritePlaintext: false,
    });

    const row: MailMessageBodyRow = {
      id: 'row-1',
      mailboxId: 'mbx-other',
      messageId: '<msg@test.com>',
      bodyText: null,
      bodyHtml: null,
      bodyCryptoStatus: created.bodyCryptoStatus,
      bodyCryptoVersion: created.bodyCryptoVersion,
      bodyKmsKeyId: created.bodyKmsKeyId,
      bodyEncryptedDek: created.bodyEncryptedDek,
      bodyTextCiphertext: created.bodyTextCiphertext,
      bodyHtmlCiphertext: created.bodyHtmlCiphertext,
    };

    await expect(subject.resolveBodies(row)).rejects.toThrow(
      'BODY_DECRYPT_FAILED',
    );
  });
});
