/**
 * Migrate Mail workspaces from unified Email API entitlements to standalone MailSubscription.
 *
 * Usage:
 *   npx ts-node scripts/migrate-unified-to-mail-only.ts --dry-run
 *   npx ts-node scripts/migrate-unified-to-mail-only.ts
 */
import { MailPlan, PrismaClient, SubscriptionStatus } from '@prisma/client';
import { addOneMonth } from '../src/domain/mail/mail-plan-limits.config';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

function mapEmailPlanToMailPlan(emailPlan: string): MailPlan {
  const id = emailPlan.trim().toUpperCase();
  if (id === 'FREE' || id === 'PRO_10K') return MailPlan.FREE;
  if (
    id === 'PRO_25K' ||
    id === 'PRO_50K' ||
    id === 'SCALE_100K' ||
    id === 'SCALE_200K'
  ) {
    return MailPlan.STARTER;
  }
  if (id === 'PRO_100K' || id.startsWith('SCALE_')) {
    return MailPlan.PROFESSIONAL;
  }
  if (id === 'ENTERPRISE') return MailPlan.CUSTOM;
  return MailPlan.FREE;
}

async function main() {
  const apps = await prisma.mailApp.findMany({
    where: {
      status: 'ACTIVE',
      linkedDeveloperAppId: { not: null },
    },
    select: {
      id: true,
      appId: true,
      userId: true,
      linkedDeveloperAppId: true,
      subscription: { select: { id: true, plan: true, status: true } },
    },
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const app of apps) {
    if (
      app.subscription?.status === SubscriptionStatus.ACTIVE &&
      app.subscription.plan !== MailPlan.FREE
    ) {
      skipped += 1;
      continue;
    }

    const entitlement = app.linkedDeveloperAppId
      ? await prisma.developerEmailEntitlement.findUnique({
          where: { developerAppId: app.linkedDeveloperAppId },
        })
      : null;

    const targetPlan = entitlement
      ? mapEmailPlanToMailPlan(String(entitlement.plan))
      : MailPlan.FREE;
    const now = new Date();

    if (dryRun) {
      console.log(
        `[dry-run] ${app.appId}: ${app.subscription?.plan ?? 'none'} -> ${targetPlan}`,
      );
      continue;
    }

    if (app.subscription) {
      await prisma.mailSubscription.update({
        where: { id: app.subscription.id },
        data: {
          plan: targetPlan,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: addOneMonth(now),
        },
      });
      updated += 1;
    } else {
      await prisma.mailSubscription.create({
        data: {
          mailAppId: app.id,
          userId: app.userId,
          plan: targetPlan,
          status: SubscriptionStatus.ACTIVE,
          mailboxCount:
            targetPlan === MailPlan.PROFESSIONAL
              ? 5
              : targetPlan === MailPlan.STARTER
                ? 3
                : 1,
          outboundUsed: 0,
          outboundPackCredits: 0,
          currentPeriodStart: now,
          currentPeriodEnd: addOneMonth(now),
        },
      });
      created += 1;
    }
  }

  console.log(
    JSON.stringify(
      { dryRun, apps: apps.length, created, updated, skipped },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
