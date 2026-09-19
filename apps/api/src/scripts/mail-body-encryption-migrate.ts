/**
 * Backfill: encrypt existing mail_messages bodies for apps with bodyEncryptionEnabled.
 * Usage: npx ts-node src/scripts/mail-body-encryption-migrate.ts [--batch=200] [--dry-run]
 */
import { MailBodyCryptoStatus } from '@prisma/client';
import { toPrismaBytes } from '../domain/mail/crypto/mail-body-crypto.types';
import { createMailBodyEncryptionScriptContext } from '../domain/mail/crypto/mail-body-encryption-script.util';

async function main() {
  const { prisma, kms, crypto } = createMailBodyEncryptionScriptContext();
  const batch = Number(process.argv.find((a) => a.startsWith('--batch='))?.split('=')[1] || 200);
  const dryRun = process.argv.includes('--dry-run');

  if (!kms.canUseEncryption()) {
    console.error(
      'MAIL_KMS_KEY_ID or MAIL_BODY_ENCRYPTION_DEV_FALLBACK+FIELD_ENCRYPTION_KEY required',
    );
    process.exit(1);
  }

  let migrated = 0;
  let errors = 0;

  for (;;) {
    const rows = await prisma.mailMessage.findMany({
      where: {
        bodyCryptoStatus: MailBodyCryptoStatus.NONE,
        OR: [{ bodyText: { not: null } }, { bodyHtml: { not: null } }],
        mailbox: {
          mailApp: { bodyEncryptionEnabled: true },
        },
      },
      take: batch,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        mailboxId: true,
        messageId: true,
        bodyText: true,
        bodyHtml: true,
      },
    });

    if (!rows.length) break;

    for (const row of rows) {
      const messageId = row.messageId || row.id;
      try {
        const fields = await crypto.buildCreateFields({
          encryptionEnabled: true,
          mailboxId: row.mailboxId,
          messageId,
          bodyText: row.bodyText,
          bodyHtml: row.bodyHtml,
          dualWritePlaintext: true,
        });

        if (!dryRun) {
          await prisma.mailMessage.update({
            where: { id: row.id },
            data: {
              bodyText: fields.bodyText,
              bodyHtml: fields.bodyHtml,
              bodyCryptoStatus: fields.bodyCryptoStatus,
              bodyCryptoVersion: fields.bodyCryptoVersion,
              bodyKmsKeyId: fields.bodyKmsKeyId,
              bodyEncryptedDek: toPrismaBytes(fields.bodyEncryptedDek),
              bodyTextCiphertext: toPrismaBytes(fields.bodyTextCiphertext),
              bodyHtmlCiphertext: toPrismaBytes(fields.bodyHtmlCiphertext),
            },
          });
        }
        migrated += 1;
      } catch (error) {
        errors += 1;
        console.error(`Failed row ${row.id}:`, error);
      }
    }

    console.log(`Progress: migrated=${migrated} errors=${errors}`);
    if (dryRun) break;
  }

  console.log(`Done. migrated=${migrated} errors=${errors} dryRun=${dryRun}`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
