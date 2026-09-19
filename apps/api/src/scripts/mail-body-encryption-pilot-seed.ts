/**
 * Seed minimal Mail pilot data for encryption validation (dev/staging only).
 * Usage: npx ts-node src/scripts/mail-body-encryption-pilot-seed.ts
 */
import {
  MailMessageDirection,
  MailMessageFolder,
  MailMessageStatus,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { loadScriptEnv } from './load-script-env';
import { createScriptPrisma } from './script-prisma';

const PILOT_APP_NAME = 'Encryption Pilot (auto-seed)';
const PILOT_DOMAIN = 'encryption-pilot.local';
const PILOT_LOCAL = 'inbox';

async function main() {
  loadScriptEnv();
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to seed pilot data in NODE_ENV=production');
    process.exit(1);
  }

  const prisma = createScriptPrisma();

  const existing = await prisma.mailApp.findFirst({
    where: { name: PILOT_APP_NAME },
    include: {
      mailboxes: { take: 1 },
    },
  });

  if (existing?.mailboxes[0]) {
    const count = await prisma.mailMessage.count({
      where: { mailboxId: existing.mailboxes[0].id },
    });
    console.log(
      JSON.stringify({
        ok: true,
        reused: true,
        mailAppId: existing.id,
        mailboxId: existing.mailboxes[0].id,
        messageCount: count,
      }),
    );
    await prisma.$disconnect();
    return;
  }

  const user = await prisma.user.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  if (!user) {
    console.error('No users in database — create a user first');
    process.exit(1);
  }

  const appId = `${Date.now()}`.padStart(16, '0').slice(-16);
  const mailApp = await prisma.mailApp.create({
    data: {
      appId,
      userId: user.id,
      slotIndex: 0,
      name: PILOT_APP_NAME,
      contactEmail: 'pilot@rukny.local',
      primaryDomain: PILOT_DOMAIN,
      bodyEncryptionEnabled: false,
    },
  });

  const mailbox = await prisma.mailMailbox.create({
    data: {
      mailAppId: mailApp.id,
      localPart: PILOT_LOCAL,
      domain: PILOT_DOMAIN,
      displayName: 'Pilot Inbox',
      assignedUserId: user.id,
      passwordHash: '$2a$10$pilotseedplaceholderhashxxxxxxxxxxxxxxxxxxx',
    },
  });

  const threadId = randomBytes(8).toString('hex');
  const messages = await prisma.mailMessage.createMany({
    data: [
      {
        mailboxId: mailbox.id,
        userId: user.id,
        threadId,
        messageId: `<pilot-seed-1@${PILOT_DOMAIN}>`,
        direction: MailMessageDirection.INBOUND,
        folder: MailMessageFolder.INBOX,
        status: MailMessageStatus.RECEIVED,
        fromAddress: `sender@${PILOT_DOMAIN}`,
        toAddresses: [`${PILOT_LOCAL}@${PILOT_DOMAIN}`],
        subject: 'Pilot seed message 1',
        bodyText: 'Plaintext body for encryption backfill test.',
        bodyHtml: '<p>Plaintext body for encryption backfill test.</p>',
        snippet: 'Plaintext body for encryption backfill test.',
        receivedAt: new Date(),
      },
      {
        mailboxId: mailbox.id,
        userId: user.id,
        threadId,
        messageId: `<pilot-seed-2@${PILOT_DOMAIN}>`,
        direction: MailMessageDirection.INBOUND,
        folder: MailMessageFolder.INBOX,
        status: MailMessageStatus.RECEIVED,
        fromAddress: `sender2@${PILOT_DOMAIN}`,
        toAddresses: [`${PILOT_LOCAL}@${PILOT_DOMAIN}`],
        subject: 'Pilot seed message 2',
        bodyText: 'Second message for round-trip validation.',
        bodyHtml: '<p>Second message for round-trip validation.</p>',
        snippet: 'Second message for round-trip validation.',
        receivedAt: new Date(),
      },
    ],
  });

  console.log(
    JSON.stringify({
      ok: true,
      reused: false,
      mailAppId: mailApp.id,
      mailboxId: mailbox.id,
      messagesCreated: messages.count,
    }),
  );

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
