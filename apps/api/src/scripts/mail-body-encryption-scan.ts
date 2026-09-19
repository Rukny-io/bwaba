/**
 * Residual plaintext scanner for encrypted mail cohorts.
 * Usage: npx ts-node src/scripts/mail-body-encryption-scan.ts
 */
import { MailBodyCryptoStatus } from '@prisma/client';
import { loadScriptEnv } from './load-script-env';
import { createScriptPrisma } from './script-prisma';

loadScriptEnv();
const prisma = createScriptPrisma();

async function main() {
  const violating = await prisma.mailMessage.count({
    where: {
      bodyCryptoStatus: MailBodyCryptoStatus.ENCRYPTED,
      OR: [{ bodyText: { not: null } }, { bodyHtml: { not: null } }],
    },
  });

  const migrating = await prisma.mailMessage.count({
    where: { bodyCryptoStatus: MailBodyCryptoStatus.MIGRATING },
  });

  const encrypted = await prisma.mailMessage.count({
    where: { bodyCryptoStatus: MailBodyCryptoStatus.ENCRYPTED },
  });

  console.log(
    JSON.stringify(
      {
        encryptedRows: encrypted,
        migratingRows: migrating,
        encryptedWithPlaintextViolation: violating,
        ok: violating === 0,
      },
      null,
      2,
    ),
  );

  if (violating > 0) process.exit(2);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
