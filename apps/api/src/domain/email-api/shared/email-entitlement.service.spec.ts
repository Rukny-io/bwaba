import { HttpException } from '@nestjs/common';
import {
  DeveloperEmailPlan,
  DeveloperEmailSubscriptionStatus,
} from '@prisma/client';
import {
  EMAIL_API_FREE,
  EMAIL_API_OVERAGE_PACK,
  DeveloperEmailPlanId,
  EmailEntitlementService,
} from './email-entitlement.service';

describe('EmailEntitlementService', () => {
  const now = new Date('2026-09-26T12:00:00.000Z');
  const periodEnd = new Date('2026-10-26T12:00:00.000Z');

  function createService(state: Record<string, unknown> = {}) {
    const row = {
      id: 'ent_1',
      userId: 'user_1',
      plan: DeveloperEmailPlan.FREE,
      trialGrantedAt: now,
      trialQuota: EMAIL_API_FREE.monthlyQuota,
      trialUsed: 0,
      subscriptionStatus: DeveloperEmailSubscriptionStatus.INACTIVE,
      periodStartsAt: null,
      periodEndsAt: null,
      monthlyQuota: 0,
      monthlyUsed: 0,
      overagePackCredits: 0,
      freePeriodStart: now,
      freePeriodEnd: periodEnd,
      freeMonthlyUsed: 0,
      freeDailyUsed: 0,
      freeDailyDate: null,
      marketingPlan: 'FREE',
      marketingContactsLimit: 1500,
      marketingContactsUsed: 0,
      automationRunsIncluded: 15000,
      automationRunsUsed: 0,
      addonDomainsExtra: 0,
      dedicatedIpEnabled: false,
      ssoEnabled: false,
      enterpriseMonthlyQuota: null,
      ...state,
    };

    const prisma = {
      developerEmailEntitlement: {
        upsert: jest.fn().mockResolvedValue(row),
        findUnique: jest.fn().mockResolvedValue(row),
        findUniqueOrThrow: jest.fn().mockResolvedValue(row),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue(row),
      },
    };
    return {
      service: new EmailEntitlementService(prisma as any),
      prisma,
      row,
    };
  }

  it('creates free monthly entitlement with 3,000 quota', async () => {
    const { service, prisma } = createService();
    await service.ensureEntitlement('user_1');
    expect(prisma.developerEmailEntitlement.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          trialQuota: EMAIL_API_FREE.monthlyQuota,
        }),
      }),
    );
  });

  it('reserves from paid monthly quota first', async () => {
    const { service, prisma } = createService({
      plan: DeveloperEmailPlan.PRO_50K,
      subscriptionStatus: DeveloperEmailSubscriptionStatus.ACTIVE,
      periodStartsAt: now,
      periodEndsAt: periodEnd,
      monthlyQuota: 50_000,
      monthlyUsed: 10,
    });
    await expect(service.reserveLiveSend('user_1')).resolves.toBe('monthly');
    expect(prisma.developerEmailEntitlement.updateMany).toHaveBeenCalled();
  });

  it('reserves from free tier when no active subscription', async () => {
    const { service } = createService({
      freeMonthlyUsed: 100,
    });
    await expect(service.reserveLiveSend('user_1')).resolves.toBe('free');
  });

  it('returns 402 when quota is exhausted', async () => {
    const { service, prisma } = createService({
      freeMonthlyUsed: EMAIL_API_FREE.monthlyQuota,
      freeDailyUsed: EMAIL_API_FREE.dailyLimit,
    });
    prisma.developerEmailEntitlement.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.reserveLiveSend('user_1')).rejects.toBeInstanceOf(
      HttpException,
    );
    await expect(service.reserveLiveSend('user_1')).rejects.toMatchObject({
      status: 402,
    });
  });

  it('activates PRO_10K plan with catalog quota', async () => {
    const { service, prisma } = createService();
    await service.activatePlan('user_1', DeveloperEmailPlanId.PRO_10K, periodEnd);
    expect(prisma.developerEmailEntitlement.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          plan: DeveloperEmailPlan.PRO_10K,
          monthlyQuota: 10_000,
        }),
      }),
    );
  });

  it('summary includes overage pack and marketing usage', async () => {
    const { service } = createService({
      overagePackCredits: 2000,
      marketingContactsUsed: 10,
    });
    const summary = await service.getSummary('user_1');
    expect(summary.subscription.packCredits).toBe(2000);
    expect(summary.marketing.contactsUsed).toBe(10);
    expect(summary.catalog.overagePack).toEqual(EMAIL_API_OVERAGE_PACK);
  });
});
