/**
 * P5: null plaintext bodies for MIGRATING rows after ciphertext validation.
 * Usage: npx ts-node src/scripts/mail-body-encryption-null-plaintext.ts [--batch=200] [--dry-run] [--app-id=uuid]
 */
import { MailBodyCryptoStatus, Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { createMailBodyEncryptionScriptContext } from '../domain/mail/crypto/mail-body-encryption-script.util';
import { toBuffer } from '../domain/mail/crypto/mail-body-crypto.types';

async function main() {
  const { prisma, kms, crypto } = createMailBodyEncryptionScriptContext();
  const batch = Number(
    process.argv.find((a) => a.startsWith('--batch='))?.split('=')[1] || 200,
  );
  const dryRun = process.argv.includes('--dry-run');
  const mailAppId = process.argv
    .find((a) => a.startsWith('--app-id='))
    ?.split('=')[1];

  if (!kms.canUseEncryption()) {
    console.error('MAIL_KMS_KEY_ID or MAIL_BODY_ENCRYPTION_DEV_FALLBACK required');
    process.exit(1);
  }

  const appFilter: Prisma.MailMessageWhereInput = mailAppId
    ? { mailbox: { mailAppId } }
    : { mailbox: { mailApp: { bodyEncryptionEnabled: true } } };

  let nulled = 0;
  let errors = 0;

  for (;;) {
    const rows = await prisma.mailMessage.findMany({
      where: {
        ...appFilter,
        bodyCryptoStatus: MailBodyCryptoStatus.MIGRATING,
        bodyEncryptedDek: { not: null },
        OR: [{ bodyText: { not: null } }, { bodyHtml: { not: null } }],
      },
      take: batch,
      orderBy: { createdAt: 'asc' },
    });

    if (!rows.length) break;

    for (const row of rows) {
      try {
        const beforeHash = createHash('sha256')
          .update(
            `${row.bodyText ?? ''}\0${row.bodyHtml ?? ''}`,
            'utf8',
          )
          .digest('hex');

        const resolved = await crypto.resolveBodies({
          id: row.id,
          mailboxId: row.mailboxId,
          messageId: row.messageId,
          bodyText: row.bodyText,
          bodyHtml: row.bodyHtml,
          bodyCryptoStatus: row.bodyCryptoStatus,
          bodyCryptoVersion: row.bodyCryptoVersion,
          bodyKmsKeyId: row.bodyKmsKeyId,
          bodyEncryptedDek: toBuffer(row.bodyEncryptedDek),
          bodyTextCiphertext: toBuffer(row.bodyTextCiphertext),
          bodyHtmlCiphertext: toBuffer(row.bodyHtmlCiphertext),
        });

        const afterHash = createHash('sha256')
          .update(
            `${resolved.bodyText ?? ''}\0${resolved.bodyHtml ?? ''}`,
            'utf8',
          )
          .digest('hex');

        if (beforeHash !== afterHash) {
          throw new Error('Round-trip hash mismatch');
        }

        if (!dryRun) {
          await prisma.mailMessage.update({
            where: { id: row.id },
            data: {
              bodyText: null,
              bodyHtml: null,
              bodyCryptoStatus: MailBodyCryptoStatus.ENCRYPTED,
            },
          });
        }
        nulled += 1;
      } catch (error) {
        errors += 1;
        console.error(`Failed row ${row.id}:`, error);
      }
    }

    console.log(`Progress: nulled=${nulled} errors=${errors}`);
    if (dryRun) break;
  }

  console.log(`Done. nulled=${nulled} errors=${errors} dryRun=${dryRun}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
