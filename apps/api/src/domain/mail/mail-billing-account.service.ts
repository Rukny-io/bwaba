import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MailAppStatus,
  MailDomainStatus,
  MailMailboxStatus,
  MailPlan,
  SubscriptionStatus,
} from '@prisma/client';
import { isMailUnlimited } from '@rukny/mail-pricing';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import {
  MAIL_DOMAINS_INCLUDED,
  MAIL_PLAN_LIMITS,
} from './mail-plan-limits.config';

/**
 * Canonical Mail billing boundary.
 *
 * Legacy per-app subscriptions remain readable while data is migrated. New
 * quota checks use this service so a customer cannot accidentally spend the
 * same account entitlement once per Mail app.
 */
@Injectable()
export class MailBillingAccountService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureForOwner(ownerUserId: string) {
    return this.prisma.mailBillingAccount.upsert({
      where: { ownerUserId },
      create: { ownerUserId },
      update: {},
      include: { subscription: true },
    });
  }

  async ensureForApp(mailAppId: string) {
    const app = await this.prisma.mailApp.findUnique({
      where: { id: mailAppId },
      select: { id: true, userId: true, billingAccountId: true },
    });
    if (!app) throw new NotFoundException('Mail workspace not found.');

    const account =
      (app.billingAccountId
        ? await this.prisma.mailBillingAccount.findUnique({
            where: { id: app.billingAccountId },
            include: { subscription: true },
          })
        : null) ?? (await this.ensureForOwner(app.userId));

    if (app.billingAccountId !== account.id) {
      await this.prisma.mailApp.update({
        where: { id: app.id },
        data: { billingAccountId: account.id },
      });
    }

    const legacy = await this.prisma.mailSubscription.findUnique({
      where: { mailAppId: app.id },
      select: { mailboxCount: true },
    });
    await this.prisma.mailAppSeatAllocation.upsert({
      where: { mailAppId: app.id },
      create: {
        billingAccountId: account.id,
        mailAppId: app.id,
        mailboxSeats: Math.max(0, legacy?.mailboxCount ?? 0),
        domainSlots: 1,
      },
      update: { billingAccountId: account.id },
    });

    return this.prisma.mailBillingAccount.findUniqueOrThrow({
      where: { id: account.id },
      include: { subscription: true },
    });
  }

  async assertDomainCapacity(
    mailAppId: string,
    rawDomain: string,
  ): Promise<void> {
    const account = await this.ensureForApp(mailAppId);
    await this.assertLegacySubscriptionsReconciled(
      account.ownerUserId,
      account.subscription !== null,
    );
    const app = await this.prisma.mailApp.findUnique({
      where: { id: mailAppId },
      select: { primaryDomain: true, domains: { select: { domain: true } } },
    });
    if (!app) throw new NotFoundException('Mail workspace not found.');

    const domain = rawDomain.trim().toLowerCase().replace(/\.$/, '');
    if (app.domains.some((row) => row.domain === domain)) return;

    const plan =
      account.subscription?.status === SubscriptionStatus.ACTIVE
        ? account.subscription.plan
        : MailPlan.FREE;
    const configuredLimit = MAIL_DOMAINS_INCLUDED[plan] ?? 1;
    const limit = isMailUnlimited(configuredLimit)
      ? Number.MAX_SAFE_INTEGER
      : configuredLimit;
    const used = await this.prisma.mailDomain.count({
      where: {
        mailApp: { billingAccountId: account.id, status: MailAppStatus.ACTIVE },
        status: MailDomainStatus.ACTIVE,
      },
    });
    if (used >= limit) {
      throw new BadRequestException(
        `Domain limit reached for this Mail billing account (${limit}).`,
      );
    }
  }

  async assertMailboxCapacity(mailAppId: string): Promise<void> {
    const account = await this.ensureForApp(mailAppId);
    await this.assertLegacySubscriptionsReconciled(
      account.ownerUserId,
      account.subscription !== null,
    );
    const allocation = await this.prisma.mailAppSeatAllocation.findUnique({
      where: { mailAppId },
    });
    const activeInApp = await this.prisma.mailMailbox.count({
      where: { mailAppId, status: MailMailboxStatus.ACTIVE },
    });

    if (account.subscription?.status === SubscriptionStatus.ACTIVE) {
      const accountSeats = account.subscription.mailboxCount;
      const totalActive = await this.prisma.mailMailbox.count({
        where: {
          mailApp: { billingAccountId: account.id },
          status: MailMailboxStatus.ACTIVE,
        },
      });
      if (totalActive >= accountSeats) {
        throw new BadRequestException(
          `Mailbox limit reached for this Mail billing account (${accountSeats}).`,
        );
      }
    }

    const fallbackPlan = account.subscription?.plan ?? MailPlan.FREE;
    const appSeats =
      allocation?.mailboxSeats ??
      MAIL_PLAN_LIMITS[fallbackPlan].mailboxesIncluded;
    if (!isMailUnlimited(appSeats) && activeInApp >= appSeats) {
      throw new BadRequestException(
        `Mailbox limit reached for this Mail app (${appSeats}).`,
      );
    }
  }

  private async assertLegacySubscriptionsReconciled(
    ownerUserId: string,
    hasCanonicalSubscription: boolean,
  ): Promise<void> {
    if (hasCanonicalSubscription) return;
    const activeLegacyCount = await this.prisma.mailSubscription.count({
      where: { userId: ownerUserId, status: SubscriptionStatus.ACTIVE },
    });
    if (activeLegacyCount > 1) {
      throw new BadRequestException({
        code: 'MAIL_BILLING_MIGRATION_REQUIRED',
        message:
          'This Mail billing account has multiple active legacy subscriptions. Reconcile them before changing domains or mailboxes.',
      });
    }
  }
}
