/**
 * Migrate legacy mail_subscriptions to unified Email API entitlements.
 *
 * Usage (dry-run):
 *   npx ts-node -r tsconfig-paths/register scripts/migrate-mail-to-unified-billing.ts --dry-run
 *
 * Usage (apply):
 *   npx ts-node -r tsconfig-paths/register scripts/migrate-mail-to-unified-billing.ts
 */

import {
  DeveloperEmailPlan,
  DeveloperEmailSubscriptionStatus,
  MailPlan,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const dryRun = process.argv.includes('--dry-run');

const GRACE_MONTHS = 3;

/** Legacy mail monthly price (IQD) honored until grace ends. */
const LEGACY_PRICE_IQD: Partial<Record<MailPlan, number>> = {
  [MailPlan.STANDARD]: 6_000,
  [MailPlan.PREMIUM]: 10_000,
};

function addMonths(from: Date, months: number): Date {
  const next = new Date(from);
  next.setMonth(next.getMonth() + months);
  return next;
}

function targetEmailPlan(legacy: MailPlan): DeveloperEmailPlan {
  switch (legacy) {
    case MailPlan.STANDARD:
      return DeveloperEmailPlan.PRO_25K;
    case MailPlan.PREMIUM:
      return DeveloperEmailPlan.PRO_50K;
    default:
      return DeveloperEmailPlan.FREE;
  }
}

async function resolveDeveloperAppId(
  mailAppId: string,
  userId: string,
  linkedDeveloperAppId: string | null,
): Promise<string | null> {
  if (linkedDeveloperAppId) return linkedDeveloperAppId;

  const existing = await prisma.developerApp.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
      installedProducts: { some: { productId: 'emailApi' } },
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  return existing?.id ?? null;
}

async function migrateSubscription(
  sub: {
    id: string;
    plan: MailPlan;
    status: SubscriptionStatus;
    mailApp: {
      id: string;
      appId: string;
      userId: string;
      linkedDeveloperAppId: string | null;
      primaryDomain: string | null;
    } | null;
  },
) {
  const app = sub.mailApp;
  if (!app) return;

  const emailPlan = targetEmailPlan(sub.plan);
  const legacyPrice = LEGACY_PRICE_IQD[sub.plan];
  const graceUntil =
    legacyPrice != null ? addMonths(new Date(), GRACE_MONTHS) : null;

  console.log(
    `  app ${app.appId}: ${sub.plan} (${sub.status}) -> ${emailPlan}` +
      (graceUntil
        ? ` · grace ${legacyPrice?.toLocaleString('en-IQ')} IQD until ${graceUntil.toISOString().slice(0, 10)}`
        : ' · immediate FREE'),
  );

  if (dryRun) return;

  const developerAppId = await resolveDeveloperAppId(
    app.id,
    app.userId,
    app.linkedDeveloperAppId,
  );
  if (!developerAppId) {
    console.warn(`    skip: no developer app for mail app ${app.appId}`);
    return;
  }

  await prisma.mailApp.update({
    where: { id: app.id },
    data: { linkedDeveloperAppId: developerAppId },
  });

  const existingEntitlement = await prisma.developerEmailEntitlement.findUnique({
    where: { developerAppId },
    select: { id: true },
  });

  const entitlementData = {
    plan: emailPlan,
    subscriptionStatus: DeveloperEmailSubscriptionStatus.ACTIVE,
    periodEndsAt: graceUntil,
  };

  if (existingEntitlement) {
    await prisma.developerEmailEntitlement.update({
      where: { developerAppId },
      data: entitlementData,
    });
  } else {
    await prisma.developerEmailEntitlement.create({
      data: {
        developerAppId,
        userId: app.userId,
        ...entitlementData,
      },
    });
  }

  if (sub.status === SubscriptionStatus.ACTIVE) {
    await prisma.mailSubscription.update({
      where: { id: sub.id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  } else if (sub.status === SubscriptionStatus.EXPIRED) {
    await prisma.mailSubscription.update({
      where: { id: sub.id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  }

  if (legacyPrice != null && graceUntil) {
    console.log(
      `    note: bill ${legacyPrice.toLocaleString('en-IQ')} IQD manually until ${graceUntil.toISOString().slice(0, 10)} (no entitlement price override column)`,
    );
  }
}

async function main() {
  const subs = await prisma.mailSubscription.findMany({
    where: {
      status: {
        in: [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.EXPIRED,
          SubscriptionStatus.PAST_DUE,
        ],
      },
    },
    include: {
      mailApp: {
        select: {
          id: true,
          appId: true,
          userId: true,
          linkedDeveloperAppId: true,
          primaryDomain: true,
        },
      },
    },
  });

  console.log(
    `${dryRun ? '[dry-run] ' : ''}Found ${subs.length} legacy mail subscriptions to process`,
  );

  for (const sub of subs) {
    await migrateSubscription(sub);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
