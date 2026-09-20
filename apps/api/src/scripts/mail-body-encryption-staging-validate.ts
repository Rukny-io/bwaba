/**
 * Staging validation gate: KMS, flags, pilot apps, plaintext scan, crypto round-trip.
 * Usage: npx ts-node src/scripts/mail-body-encryption-staging-validate.ts
 */
import { MailBodyCryptoStatus } from '@prisma/client';
import { MailBodyCryptoService } from '../domain/mail/crypto/mail-body-crypto.service';
import { toBuffer } from '../domain/mail/crypto/mail-body-crypto.types';
import { createMailBodyEncryptionScriptContext } from '../domain/mail/crypto/mail-body-encryption-script.util';

type Check = { name: string; ok: boolean; detail?: unknown };

async function main() {
  const checks: Check[] = [];
  const { prisma, kms, crypto } = createMailBodyEncryptionScriptContext();

  const globalEnabled =
    process.env.MAIL_BODY_ENCRYPTION_ENABLED === 'true' ||
    process.env.MAIL_BODY_ENCRYPTION_ENABLED === '1';

  checks.push({
    name: 'global_flag',
    ok: globalEnabled,
    detail: { MAIL_BODY_ENCRYPTION_ENABLED: globalEnabled },
  });

  const dualWriteExplicit =
    process.env.MAIL_BODY_ENCRYPTION_DUAL_WRITE?.trim().toLowerCase();
  const dualWrite =
    dualWriteExplicit === 'true' || dualWriteExplicit === '1'
      ? true
      : dualWriteExplicit === 'false' || dualWriteExplicit === '0'
        ? false
        : process.env.NODE_ENV !== 'production';
  checks.push({
    name: 'dual_write_flag',
    ok: true,
    detail: { MAIL_BODY_ENCRYPTION_DUAL_WRITE: dualWrite },
  });

  checks.push({
    name: 'kms_configured',
    ok: kms.canUseEncryption(),
    detail: { keyId: kms.configuredKeyId() || null },
  });

  if (kms.canUseEncryption()) {
    try {
      const generated = await kms.generateDataKey();
      const decrypted = await kms.decryptDataKey(generated.encryptedKey);
      checks.push({
        name: 'kms_round_trip',
        ok: decrypted.equals(generated.plaintextKey),
      });
    } catch (error) {
      checks.push({
        name: 'kms_round_trip',
        ok: false,
        detail: String(error),
      });
    }
  }

  const pilotApps = await prisma.mailApp.findMany({
    where: { bodyEncryptionEnabled: true },
    select: { id: true, name: true },
  });
  checks.push({
    name: 'pilot_apps',
    ok: pilotApps.length > 0,
    detail: pilotApps,
  });

  const violating = await prisma.mailMessage.count({
    where: {
      bodyCryptoStatus: MailBodyCryptoStatus.ENCRYPTED,
      OR: [{ bodyText: { not: null } }, { bodyHtml: { not: null } }],
    },
  });
  checks.push({
    name: 'scan_no_plaintext_on_encrypted',
    ok: violating === 0,
    detail: { encryptedWithPlaintextViolation: violating },
  });

  const migrating = await prisma.mailMessage.count({
    where: { bodyCryptoStatus: MailBodyCryptoStatus.MIGRATING },
  });
  const encrypted = await prisma.mailMessage.count({
    where: { bodyCryptoStatus: MailBodyCryptoStatus.ENCRYPTED },
  });
  checks.push({
    name: 'crypto_row_counts',
    ok: true,
    detail: { migratingRows: migrating, encryptedRows: encrypted },
  });

  const cryptoRoundTrip = await testInMemoryCrypto(crypto);
  checks.push(cryptoRoundTrip);

  const pilotMessage = await prisma.mailMessage.findFirst({
    where: {
      mailbox: { mailApp: { bodyEncryptionEnabled: true } },
      bodyCryptoStatus: { in: [MailBodyCryptoStatus.MIGRATING, MailBodyCryptoStatus.ENCRYPTED] },
    },
    select: {
      id: true,
      mailboxId: true,
      messageId: true,
      bodyText: true,
      bodyHtml: true,
      bodyCryptoStatus: true,
      bodyCryptoVersion: true,
      bodyKmsKeyId: true,
      bodyEncryptedDek: true,
      bodyTextCiphertext: true,
      bodyHtmlCiphertext: true,
    },
  });

  if (pilotMessage?.bodyEncryptedDek) {
    try {
      const resolved = await crypto.resolveBodies({
        ...pilotMessage,
        bodyEncryptedDek: toBuffer(pilotMessage.bodyEncryptedDek),
        bodyTextCiphertext: toBuffer(pilotMessage.bodyTextCiphertext),
        bodyHtmlCiphertext: toBuffer(pilotMessage.bodyHtmlCiphertext),
      });
      checks.push({
        name: 'pilot_message_decrypt',
        ok:
          (resolved.bodyText?.length ?? 0) > 0 ||
          (resolved.bodyHtml?.length ?? 0) > 0,
        detail: { messageId: pilotMessage.id, status: pilotMessage.bodyCryptoStatus },
      });
    } catch (error) {
      checks.push({
        name: 'pilot_message_decrypt',
        ok: false,
        detail: String(error),
      });
    }
  } else {
    checks.push({
      name: 'pilot_message_decrypt',
      ok: true,
      detail: 'skipped — no encrypted pilot messages yet',
    });
  }

  const ok = checks.every((c) => c.ok);
  console.log(JSON.stringify({ ok, checks }, null, 2));
  await prisma.$disconnect();
  if (!ok) process.exit(2);
}

async function testInMemoryCrypto(
  crypto: MailBodyCryptoService,
): Promise<Check> {
  try {
    const created = await crypto.buildCreateFields({
      encryptionEnabled: true,
      mailboxId: 'staging-validate-mbx',
      messageId: '<staging-validate@test>',
      bodyText: 'staging validate',
      bodyHtml: '<p>staging validate</p>',
      dualWritePlaintext: true,
    });
    const resolved = await crypto.resolveBodies({
      id: 'staging-validate-row',
      mailboxId: 'staging-validate-mbx',
      messageId: '<staging-validate@test>',
      bodyText: created.bodyText,
      bodyHtml: created.bodyHtml,
      bodyCryptoStatus: created.bodyCryptoStatus,
      bodyCryptoVersion: created.bodyCryptoVersion,
      bodyKmsKeyId: created.bodyKmsKeyId,
      bodyEncryptedDek: created.bodyEncryptedDek,
      bodyTextCiphertext: created.bodyTextCiphertext,
      bodyHtmlCiphertext: created.bodyHtmlCiphertext,
    });
    return {
      name: 'crypto_service_round_trip',
      ok:
        resolved.bodyText === 'staging validate' &&
        resolved.bodyHtml === '<p>staging validate</p>',
    };
  } catch (error) {
    return {
      name: 'crypto_service_round_trip',
      ok: false,
      detail: String(error),
    };
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
