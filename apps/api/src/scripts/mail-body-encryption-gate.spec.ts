/**
 * Automated gate checks (no DB): KMS round-trip + crypto service round-trip.
 */
import { ConfigService } from '@nestjs/config';
import { MailBodyCryptoStatus } from '@prisma/client';
import { MailBodyCryptoService } from '../domain/mail/crypto/mail-body-crypto.service';
import { MailKmsClient } from '../domain/mail/crypto/mail-kms.client';

const FIELD_KEY =
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

describe('mail body encryption gate', () => {
  const kms = new MailKmsClient(
    new ConfigService({
      MAIL_BODY_ENCRYPTION_DEV_FALLBACK: 'true',
      FIELD_ENCRYPTION_KEY: FIELD_KEY,
      NODE_ENV: 'development',
    }),
  );

  const crypto = new MailBodyCryptoService(kms, {
    get: async () => null,
    setex: async () => undefined,
  } as never);

  it('kms generate + decrypt round-trip', async () => {
    const generated = await kms.generateDataKey();
    const decrypted = await kms.decryptDataKey(generated.encryptedKey);
    expect(decrypted.equals(generated.plaintextKey)).toBe(true);
  });

  it('crypto service encrypt + resolve round-trip', async () => {
    const created = await crypto.buildCreateFields({
      encryptionEnabled: true,
      mailboxId: 'gate-mbx',
      messageId: '<gate@test>',
      bodyText: 'gate test',
      bodyHtml: '<p>gate test</p>',
      dualWritePlaintext: true,
    });

    expect(created.bodyCryptoStatus).toBe(MailBodyCryptoStatus.MIGRATING);

    const resolved = await crypto.resolveBodies({
      id: 'gate-row',
      mailboxId: 'gate-mbx',
      messageId: '<gate@test>',
      bodyText: created.bodyText,
      bodyHtml: created.bodyHtml,
      bodyCryptoStatus: created.bodyCryptoStatus,
      bodyCryptoVersion: created.bodyCryptoVersion,
      bodyKmsKeyId: created.bodyKmsKeyId,
      bodyEncryptedDek: created.bodyEncryptedDek,
      bodyTextCiphertext: created.bodyTextCiphertext,
      bodyHtmlCiphertext: created.bodyHtmlCiphertext,
    });

    expect(resolved.bodyText).toBe('gate test');
    expect(resolved.bodyHtml).toBe('<p>gate test</p>');
  });
});
