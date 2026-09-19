/**
 * List or toggle pilot MailApp body encryption flag.
 * Usage:
 *   npx ts-node src/scripts/mail-body-encryption-pilot.ts --list
 *   npx ts-node src/scripts/mail-body-encryption-pilot.ts --enable <mailAppId>
 *   npx ts-node src/scripts/mail-body-encryption-pilot.ts --disable <mailAppId> [--dry-run]
 */
import { loadScriptEnv } from './load-script-env';
import { createScriptPrisma } from './script-prisma';

loadScriptEnv();
const prisma = createScriptPrisma();

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  return process.argv[idx + 1];
}

async function listApps() {
  const apps = await prisma.mailApp.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      bodyEncryptionEnabled: true,
      createdAt: true,
      primaryDomain: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        globalFlag:
          process.env.MAIL_BODY_ENCRYPTION_ENABLED === 'true' ||
          process.env.MAIL_BODY_ENCRYPTION_ENABLED === '1',
        mailKmsKeyId: process.env.MAIL_KMS_KEY_ID || null,
        apps,
      },
      null,
      2,
    ),
  );
}

async function setPilot(enabled: boolean, appId: string, dryRun: boolean) {
  const app = await prisma.mailApp.findUnique({
    where: { id: appId },
    select: { id: true, name: true, bodyEncryptionEnabled: true },
  });

  if (!app) {
    console.error(`MailApp not found: ${appId}`);
    process.exit(1);
  }

  if (!dryRun) {
    await prisma.mailApp.update({
      where: { id: appId },
      data: { bodyEncryptionEnabled: enabled },
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun,
        appId: app.id,
        name: app.name,
        previous: app.bodyEncryptionEnabled,
        bodyEncryptionEnabled: enabled,
        reminder:
          'Set MAIL_BODY_ENCRYPTION_ENABLED=true on API and restart before new mail encrypts',
      },
      null,
      2,
    ),
  );
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (process.argv.includes('--list')) {
    await listApps();
    return;
  }

  const enableId = argValue('--enable');
  if (enableId) {
    await setPilot(true, enableId, dryRun);
    return;
  }

  const disableId = argValue('--disable');
  if (disableId) {
    await setPilot(false, disableId, dryRun);
    return;
  }

  console.error('Usage: --list | --enable <id> | --disable <id> [--dry-run]');
  process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
