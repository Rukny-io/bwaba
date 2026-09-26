import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  DeveloperEmailPlan,
  DeveloperEmailMarketingPlan,
  DeveloperEmailSubscriptionStatus,
} from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import {
  EMAIL_API_AUTOMATION,
  EMAIL_API_FREE,
  EMAIL_API_MARKETING_PLANS,
  EMAIL_API_OVERAGE_PACK,
  EMAIL_API_TRANSACTIONAL_PLANS,
  DeveloperEmailMarketingPlanId,
  DeveloperEmailPlanId,
  addOneEmailBillingMonth,
  emailApiOveragePer1kIqd,
  getEmailApiMarketingPlan,
  getEmailApiPlan,
  startOfUtcDay,
} from '../billing/email-api-plan-limits.config';

export type EmailQuotaReservation = 'monthly' | 'free' | 'overage';

export {
  EMAIL_API_FREE,
  EMAIL_API_OVERAGE_PACK,
  EMAIL_API_TRANSACTIONAL_PLANS,
  EMAIL_API_MARKETING_PLANS,
  EMAIL_API_AUTOMATION,
  DeveloperEmailPlanId,
  DeveloperEmailMarketingPlanId,
  getEmailApiPlan,
  getEmailApiMarketingPlan,
};

/** @deprecated Use EMAIL_API_FREE.monthlyQuota */
export const EMAIL_API_TRIAL_QUOTA = EMAIL_API_FREE.monthlyQuota;

/** @deprecated Use PRO_10K catalog */
export const EMAIL_API_STARTER_MONTHLY_QUOTA = 10_000;

/** @deprecated Use PRO_10K catalog */
export const EMAIL_API_STARTER_MONTHLY_PRICE_IQD = 5_000;

@Injectable()
export class EmailEntitlementService {
  private readonly logger = new Logger(EmailEntitlementService.name);

  constructor(private readonly prisma: PrismaService) {}

  async ensureEntitlement(userId: string) {
    const now = new Date();
    const periodEnd = addOneEmailBillingMonth(now);
    return this.prisma.developerEmailEntitlement.upsert({
      where: { userId },
      create: {
        userId,
        plan: DeveloperEmailPlan.FREE,
        trialGrantedAt: now,
        trialQuota: EMAIL_API_FREE.monthlyQuota,
        freePeriodStart: now,
        freePeriodEnd: periodEnd,
        marketingContactsLimit: getEmailApiMarketingPlan(
          DeveloperEmailMarketingPlanId.FREE,
        ).contactsLimit,
        automationRunsIncluded: EMAIL_API_AUTOMATION.includedRunsPerMonth,
      },
      update: {},
    });
  }

  async reserveLiveSend(userId: string): Promise<EmailQuotaReservation> {
    await this.ensureEntitlement(userId);
    await this.refreshFreePeriodIfNeeded(userId);

    for (let attempt = 0; attempt < 3; attempt++) {
      const current = await this.prisma.developerEmailEntitlement.findUnique({
        where: { userId },
      });
      if (!current) break;

      const now = new Date();
      const subscriptionActive = this.isSubscriptionActive(current, now);
      const planDef = getEmailApiPlan(current.plan);
      const monthlyQuota =
        current.plan === DeveloperEmailPlan.ENTERPRISE &&
        current.enterpriseMonthlyQuota
          ? current.enterpriseMonthlyQuota
          : subscriptionActive
            ? current.monthlyQuota || planDef.monthlyQuota
            : 0;
      const packCredits = Math.max(0, current.overagePackCredits);
      const allowance = monthlyQuota + packCredits;

      if (subscriptionActive && current.monthlyUsed < allowance) {
        const updated = await this.prisma.developerEmailEntitlement.updateMany({
          where: {
            id: current.id,
            monthlyUsed: current.monthlyUsed,
            subscriptionStatus: DeveloperEmailSubscriptionStatus.ACTIVE,
          },
          data: { monthlyUsed: { increment: 1 } },
        });
        if (updated.count === 1) {
          return current.monthlyUsed >= monthlyQuota ? 'overage' : 'monthly';
        }
        continue;
      }

      const dailyOk = await this.canUseFreeDaily(current);
      const freeRemaining = Math.max(
        0,
        EMAIL_API_FREE.monthlyQuota - current.freeMonthlyUsed,
      );
      if (!subscriptionActive && freeRemaining > 0 && dailyOk) {
        const updated = await this.prisma.developerEmailEntitlement.updateMany({
          where: {
            id: current.id,
            freeMonthlyUsed: current.freeMonthlyUsed,
          },
          data: {
            freeMonthlyUsed: { increment: 1 },
            freeDailyUsed: { increment: 1 },
            freeDailyDate: startOfUtcDay(now),
          },
        });
        if (updated.count === 1) return 'free';
        continue;
      }

      throw this.quotaExceeded(current, subscriptionActive, planDef.id);
    }

    throw new HttpException(
      {
        code: 'quota_busy',
        message: 'Could not reserve email quota. Try again.',
      },
      HttpStatus.CONFLICT,
    );
  }

  async getSummary(userId: string) {
    const entitlement = await this.ensureEntitlement(userId);
    await this.refreshFreePeriodIfNeeded(userId);
    const fresh = await this.prisma.developerEmailEntitlement.findUniqueOrThrow({
      where: { userId: entitlement.userId },
    });
    const now = new Date();
    const subscriptionActive = this.isSubscriptionActive(fresh, now);
    const planDef = getEmailApiPlan(fresh.plan);
    const marketingDef = getEmailApiMarketingPlan(fresh.marketingPlan);
    const monthlyQuota =
      fresh.plan === DeveloperEmailPlan.ENTERPRISE && fresh.enterpriseMonthlyQuota
        ? fresh.enterpriseMonthlyQuota
        : subscriptionActive
          ? fresh.monthlyQuota || planDef.monthlyQuota
          : 0;
    const packCredits = Math.max(0, fresh.overagePackCredits);
    const allowance = monthlyQuota + packCredits;
    const freeRemaining = Math.max(
      0,
      EMAIL_API_FREE.monthlyQuota - fresh.freeMonthlyUsed,
    );
    const dailyRemaining = Math.max(
      0,
      EMAIL_API_FREE.dailyLimit - this.effectiveFreeDailyUsed(fresh, now),
    );

    return {
      plan: {
        id: fresh.plan,
        name: planDef.marketingNameEn,
        marketingNameEn: planDef.marketingNameEn,
        marketingNameAr: planDef.marketingNameAr,
        invoiceLabelEn: planDef.invoiceLabelEn,
        invoiceLabelAr: planDef.invoiceLabelAr,
        tier: planDef.tier,
        slug: planDef.slug,
        priceIqd: planDef.priceMonthlyIqd,
        monthlyQuota: planDef.monthlyQuota,
        overagePer1kIqd: emailApiOveragePer1kIqd(fresh.plan),
        domainsIncluded: planDef.domainsIncluded,
      },
      free: {
        quota: EMAIL_API_FREE.monthlyQuota,
        used: fresh.freeMonthlyUsed,
        remaining: freeRemaining,
        dailyLimit: EMAIL_API_FREE.dailyLimit,
        dailyUsed: this.effectiveFreeDailyUsed(fresh, now),
        dailyRemaining,
        periodEndsAt: fresh.freePeriodEnd?.toISOString() ?? null,
      },
      subscription: {
        status: subscriptionActive
          ? 'active'
          : fresh.subscriptionStatus.toLowerCase(),
        priceIqd: planDef.priceMonthlyIqd,
        quota: monthlyQuota,
        used: fresh.monthlyUsed,
        remaining: subscriptionActive
          ? Math.max(0, allowance - fresh.monthlyUsed)
          : 0,
        packCredits,
        periodEndsAt: fresh.periodEndsAt?.toISOString() ?? null,
      },
      marketing: {
        plan: fresh.marketingPlan,
        name: marketingDef.marketingNameEn,
        marketingNameEn: marketingDef.marketingNameEn,
        marketingNameAr: marketingDef.marketingNameAr,
        invoiceLabelEn: marketingDef.invoiceLabelEn,
        invoiceLabelAr: marketingDef.invoiceLabelAr,
        tier: marketingDef.tier,
        slug: marketingDef.slug,
        contactsLimit: fresh.marketingContactsLimit || marketingDef.contactsLimit,
        contactsUsed: fresh.marketingContactsUsed,
        contactsRemaining: Math.max(
          0,
          (fresh.marketingContactsLimit || marketingDef.contactsLimit) -
            fresh.marketingContactsUsed,
        ),
        priceIqd: marketingDef.priceMonthlyIqd,
      },
      automations: {
        included: fresh.automationRunsIncluded,
        used: fresh.automationRunsUsed,
        remaining: Math.max(
          0,
          fresh.automationRunsIncluded - fresh.automationRunsUsed,
        ),
        overagePriceIqd: EMAIL_API_AUTOMATION.overagePriceIqdPerRun,
      },
      addons: {
        domainsExtraPacks: fresh.addonDomainsExtra,
        dedicatedIpEnabled: fresh.dedicatedIpEnabled,
        ssoEnabled: fresh.ssoEnabled,
      },
      /** Legacy shape for existing portal clients */
      trial: {
        quota: EMAIL_API_FREE.monthlyQuota,
        used: fresh.freeMonthlyUsed,
        remaining: freeRemaining,
      },
      catalog: {
        transactional: EMAIL_API_TRANSACTIONAL_PLANS.filter((p) => p.selfServe),
        marketing: EMAIL_API_MARKETING_PLANS.filter((p) => p.selfServe),
        overagePack: EMAIL_API_OVERAGE_PACK,
      },
    };
  }

  async activatePlan(
    userId: string,
    planId: DeveloperEmailPlanId | DeveloperEmailPlan,
    periodEndsAt?: Date,
    enterpriseMonthlyQuota?: number,
  ) {
    const planKey = String(planId) as DeveloperEmailPlanId;
    const planDef = getEmailApiPlan(planKey);
    if (!planDef.selfServe && planKey !== DeveloperEmailPlanId.ENTERPRISE) {
      throw new HttpException('Plan is not self-serve.', HttpStatus.BAD_REQUEST);
    }

    const startsAt = new Date();
    const endsAt = periodEndsAt ?? addOneEmailBillingMonth(startsAt);
    if (endsAt <= startsAt) {
      throw new HttpException(
        'Subscription expiry must be in the future.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const monthlyQuota =
      planKey === DeveloperEmailPlanId.ENTERPRISE
        ? Math.max(0, enterpriseMonthlyQuota ?? 0)
        : planDef.monthlyQuota;

    await this.prisma.developerEmailEntitlement.upsert({
      where: { userId },
      create: {
        userId,
        plan: planKey as DeveloperEmailPlan,
        trialGrantedAt: startsAt,
        trialQuota: EMAIL_API_FREE.monthlyQuota,
        freePeriodStart: startsAt,
        freePeriodEnd: addOneEmailBillingMonth(startsAt),
        subscriptionStatus: DeveloperEmailSubscriptionStatus.ACTIVE,
        periodStartsAt: startsAt,
        periodEndsAt: endsAt,
        monthlyQuota,
        enterpriseMonthlyQuota:
          planKey === DeveloperEmailPlanId.ENTERPRISE
            ? monthlyQuota
            : undefined,
      },
      update: {
        plan: planKey as DeveloperEmailPlan,
        subscriptionStatus: DeveloperEmailSubscriptionStatus.ACTIVE,
        periodStartsAt: startsAt,
        periodEndsAt: endsAt,
        monthlyQuota,
        monthlyUsed: 0,
        enterpriseMonthlyQuota:
          planKey === DeveloperEmailPlanId.ENTERPRISE
            ? monthlyQuota
            : null,
      },
    });
    return this.getSummary(userId);
  }

  /** @deprecated Use activatePlan(PRO_10K) */
  activateStarter(userId: string, periodEndsAt?: Date) {
    return this.activatePlan(
      userId,
      DeveloperEmailPlanId.PRO_10K,
      periodEndsAt,
    );
  }

  async activateMarketingPlan(
    userId: string,
    planId: DeveloperEmailMarketingPlanId,
  ) {
    const planDef = getEmailApiMarketingPlan(planId);
    await this.ensureEntitlement(userId);
    await this.prisma.developerEmailEntitlement.update({
      where: { userId },
      data: {
        marketingPlan: planId as DeveloperEmailMarketingPlan,
        marketingContactsLimit: planDef.contactsLimit,
      },
    });
    return this.getSummary(userId);
  }

  async creditOveragePack(userId: string, emails: number) {
    const n = Math.max(0, Math.floor(emails));
    if (n <= 0) return;
    await this.prisma.developerEmailEntitlement.update({
      where: { userId },
      data: { overagePackCredits: { increment: n } },
    });
  }

  async reserveAutomationRun(userId: string): Promise<'included' | 'overage'> {
    await this.ensureEntitlement(userId);
    const current = await this.prisma.developerEmailEntitlement.findUnique({
      where: { userId },
    });
    if (!current) {
      throw new HttpException('Entitlement not found.', HttpStatus.NOT_FOUND);
    }
    if (current.automationRunsUsed < current.automationRunsIncluded) {
      await this.prisma.developerEmailEntitlement.update({
        where: { userId },
        data: { automationRunsUsed: { increment: 1 } },
      });
      return 'included';
    }
    return 'overage';
  }

  async releaseLiveSend(
    userId: string,
    reservation: EmailQuotaReservation,
  ): Promise<void> {
    const data =
      reservation === 'monthly' || reservation === 'overage'
        ? { monthlyUsed: { decrement: 1 } }
        : { freeMonthlyUsed: { decrement: 1 }, freeDailyUsed: { decrement: 1 } };
    await this.prisma.developerEmailEntitlement.update({
      where: { userId },
      data,
    });
  }

  async resetBillingPeriods(): Promise<{ free: number; paid: number }> {
    const now = new Date();
    const nextPeriodEnd = addOneEmailBillingMonth(now);

    const freeReset = await this.prisma.developerEmailEntitlement.updateMany({
      where: {
        OR: [{ freePeriodEnd: { lte: now } }, { freePeriodEnd: null }],
      },
      data: {
        freeMonthlyUsed: 0,
        freeDailyUsed: 0,
        freeDailyDate: null,
        freePeriodStart: now,
        freePeriodEnd: nextPeriodEnd,
        automationRunsUsed: 0,
      },
    });

    const paidReset = await this.prisma.developerEmailEntitlement.updateMany({
      where: {
        subscriptionStatus: DeveloperEmailSubscriptionStatus.ACTIVE,
        periodEndsAt: { lte: now },
      },
      data: {
        subscriptionStatus: DeveloperEmailSubscriptionStatus.EXPIRED,
      },
    });

    const renewed = await this.prisma.developerEmailEntitlement.updateMany({
      where: {
        subscriptionStatus: DeveloperEmailSubscriptionStatus.ACTIVE,
        periodEndsAt: { gt: now },
        periodStartsAt: { lte: now },
      },
      data: {
        monthlyUsed: 0,
        overagePackCredits: 0,
        periodStartsAt: now,
        periodEndsAt: nextPeriodEnd,
      },
    });

    this.logger.log(
      `Email billing reset: free=${freeReset.count}, expired=${paidReset.count}, renewed=${renewed.count}`,
    );
    return { free: freeReset.count, paid: renewed.count };
  }

  hashContactEmail(email: string): string {
    return createHash('sha256')
      .update(email.trim().toLowerCase())
      .digest('hex');
  }

  private isSubscriptionActive(
    entitlement: {
      subscriptionStatus: DeveloperEmailSubscriptionStatus;
      periodStartsAt: Date | null;
      periodEndsAt: Date | null;
    },
    now: Date,
  ) {
    return (
      entitlement.subscriptionStatus ===
        DeveloperEmailSubscriptionStatus.ACTIVE &&
      !!entitlement.periodStartsAt &&
      !!entitlement.periodEndsAt &&
      entitlement.periodStartsAt <= now &&
      entitlement.periodEndsAt > now
    );
  }

  private effectiveFreeDailyUsed(
    entitlement: { freeDailyUsed: number; freeDailyDate: Date | null },
    now: Date,
  ) {
    if (!entitlement.freeDailyDate) return 0;
    const day = startOfUtcDay(now).getTime();
    const stored = startOfUtcDay(entitlement.freeDailyDate).getTime();
    return day === stored ? entitlement.freeDailyUsed : 0;
  }

  private async canUseFreeDaily(entitlement: {
    freeDailyUsed: number;
    freeDailyDate: Date | null;
  }) {
    const used = this.effectiveFreeDailyUsed(entitlement, new Date());
    return used < EMAIL_API_FREE.dailyLimit;
  }

  private async refreshFreePeriodIfNeeded(userId: string) {
    const now = new Date();
    const row = await this.prisma.developerEmailEntitlement.findUnique({
      where: { userId },
      select: { freePeriodEnd: true },
    });
    if (!row?.freePeriodEnd || row.freePeriodEnd > now) return;
    await this.prisma.developerEmailEntitlement.update({
      where: { userId },
      data: {
        freeMonthlyUsed: 0,
        freeDailyUsed: 0,
        freeDailyDate: null,
        freePeriodStart: now,
        freePeriodEnd: addOneEmailBillingMonth(now),
        automationRunsUsed: 0,
      },
    });
  }

  private quotaExceeded(
    entitlement: { plan: DeveloperEmailPlan; overagePackCredits: number },
    subscriptionActive: boolean,
    planId: DeveloperEmailPlanId,
  ) {
    const planDef = getEmailApiPlan(planId);
    const upgradePlans = EMAIL_API_TRANSACTIONAL_PLANS.filter(
      (p) => p.selfServe && p.id !== DeveloperEmailPlanId.FREE,
    ).slice(0, 3);

    throw new HttpException(
      {
        code: 'quota_exceeded',
        message: subscriptionActive
          ? 'Email API quota exceeded. Buy an overage pack or upgrade your plan.'
          : 'Email API free quota exceeded. Upgrade to a paid plan to continue.',
        plan: entitlement.plan,
        monthlyPriceIqd: planDef.priceMonthlyIqd,
        monthlyQuota: planDef.monthlyQuota,
        overagePack: EMAIL_API_OVERAGE_PACK,
        upgradeOptions: upgradePlans.map((p) => ({
          id: p.id,
          priceIqd: p.priceMonthlyIqd,
          monthlyQuota: p.monthlyQuota,
        })),
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}
