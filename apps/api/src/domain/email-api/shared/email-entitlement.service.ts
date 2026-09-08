import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DeveloperEmailSubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';

export const EMAIL_API_TRIAL_QUOTA = 1_000;
export const EMAIL_API_STARTER_MONTHLY_QUOTA = 10_000;
export const EMAIL_API_STARTER_MONTHLY_PRICE_IQD = 15_000;

export type EmailQuotaReservation = 'trial' | 'monthly';

/** Account-scoped quota reservations. updateMany conditions make each counter
 * increment atomic even when several API requests arrive at the same time. */
@Injectable()
export class EmailEntitlementService {
  constructor(private readonly prisma: PrismaService) {}

  async reserveLiveSend(userId: string): Promise<EmailQuotaReservation> {
    await this.prisma.developerEmailEntitlement.upsert({
      where: { userId },
      create: {
        userId,
        trialGrantedAt: new Date(),
        trialQuota: EMAIL_API_TRIAL_QUOTA,
      },
      update: {},
    });

    const now = new Date();
    const monthly = await this.prisma.developerEmailEntitlement.updateMany({
      where: {
        userId,
        subscriptionStatus: DeveloperEmailSubscriptionStatus.ACTIVE,
        periodStartsAt: { lte: now },
        periodEndsAt: { gt: now },
        // MVP has one paid plan. Keep this constant in sync with activation
        // until additional plan tiers require a SQL field-to-field predicate.
        monthlyUsed: { lt: EMAIL_API_STARTER_MONTHLY_QUOTA },
      },
      data: { monthlyUsed: { increment: 1 } },
    });
    if (monthly.count === 1) return 'monthly';

    // Prisma cannot express a field-to-field comparison in an update predicate.
    // The free quota is immutable at 1,000, making this guarded update atomic.
    const trial = await this.prisma.developerEmailEntitlement.updateMany({
      where: { userId, trialUsed: { lt: EMAIL_API_TRIAL_QUOTA } },
      data: { trialUsed: { increment: 1 } },
    });
    if (trial.count === 1) return 'trial';

    throw new HttpException(
      {
        code: 'quota_exceeded',
        message:
          'Email API quota exceeded. Activate Email API Starter to continue.',
        monthlyPriceIqd: EMAIL_API_STARTER_MONTHLY_PRICE_IQD,
        monthlyQuota: EMAIL_API_STARTER_MONTHLY_QUOTA,
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }

  async getSummary(userId: string) {
    const entitlement = await this.prisma.developerEmailEntitlement.upsert({
      where: { userId },
      create: {
        userId,
        trialGrantedAt: new Date(),
        trialQuota: EMAIL_API_TRIAL_QUOTA,
      },
      update: {},
    });
    const now = new Date();
    const subscriptionActive =
      entitlement.subscriptionStatus ===
        DeveloperEmailSubscriptionStatus.ACTIVE &&
      !!entitlement.periodStartsAt &&
      !!entitlement.periodEndsAt &&
      entitlement.periodStartsAt <= now &&
      entitlement.periodEndsAt > now;
    return {
      trial: {
        quota: entitlement.trialQuota,
        used: entitlement.trialUsed,
        remaining: Math.max(0, entitlement.trialQuota - entitlement.trialUsed),
      },
      subscription: {
        status: subscriptionActive
          ? 'active'
          : entitlement.subscriptionStatus.toLowerCase(),
        priceIqd: EMAIL_API_STARTER_MONTHLY_PRICE_IQD,
        quota: entitlement.monthlyQuota,
        used: entitlement.monthlyUsed,
        remaining: subscriptionActive
          ? Math.max(0, entitlement.monthlyQuota - entitlement.monthlyUsed)
          : 0,
        periodEndsAt: entitlement.periodEndsAt?.toISOString() ?? null,
      },
    };
  }

  /** Manual activation used until a payment gateway is wired to the product. */
  async activateStarter(userId: string, periodEndsAt?: Date) {
    const startsAt = new Date();
    const endsAt =
      periodEndsAt ?? new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (endsAt <= startsAt)
      throw new HttpException(
        'Subscription expiry must be in the future.',
        HttpStatus.BAD_REQUEST,
      );
    await this.prisma.developerEmailEntitlement.upsert({
      where: { userId },
      create: {
        userId,
        trialGrantedAt: startsAt,
        trialQuota: EMAIL_API_TRIAL_QUOTA,
        subscriptionStatus: DeveloperEmailSubscriptionStatus.ACTIVE,
        periodStartsAt: startsAt,
        periodEndsAt: endsAt,
        monthlyQuota: EMAIL_API_STARTER_MONTHLY_QUOTA,
      },
      update: {
        subscriptionStatus: DeveloperEmailSubscriptionStatus.ACTIVE,
        periodStartsAt: startsAt,
        periodEndsAt: endsAt,
        monthlyQuota: EMAIL_API_STARTER_MONTHLY_QUOTA,
        monthlyUsed: 0,
      },
    });
    return this.getSummary(userId);
  }

  async releaseLiveSend(
    userId: string,
    reservation: EmailQuotaReservation,
  ): Promise<void> {
    await this.prisma.developerEmailEntitlement.update({
      where: { userId },
      data:
        reservation === 'monthly'
          ? { monthlyUsed: { decrement: 1 } }
          : { trialUsed: { decrement: 1 } },
    });
  }
}
