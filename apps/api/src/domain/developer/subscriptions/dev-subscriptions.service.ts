import {
  Injectable,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { RedisService } from '../../../core/cache/redis.service';
import {
  DEVELOPER_PLAN_LIMITS,
  DEVELOPER_PRO_PRICING,
  DeveloperPlanLimits,
  DeveloperPlanTier,
  normalizeDeveloperPlan,
  platformPlanGrantsDeveloperPro,
  resolveLimitValue,
} from './dev-plan-limits.config';
import { UpgradePlanDto } from './dto/upgrade-plan.dto';

const LEGACY_PLANS_TO_MIGRATE = new Set(['STARTER', 'GROWTH', 'ENTERPRISE']);

@Injectable()
export class DevSubscriptionsService {
  private readonly logger = new Logger(DevSubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  /**
   * الخطة الفعلية: Pro من اشتراك المطوّر أو من باقة المنصة النشطة.
   */
  async resolveEffectivePlan(
    userId: string,
    devSubscription?: { plan: string } | null,
  ): Promise<DeveloperPlanTier> {
    const record =
      devSubscription ??
      (await this.prisma.developerSubscription.findUnique({
        where: { userId },
        select: { plan: true },
      }));

    if (record && normalizeDeveloperPlan(record.plan) === 'PRO') {
      return 'PRO';
    }

    const platform = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true },
    });

    if (
      platform?.status === 'ACTIVE' &&
      platformPlanGrantsDeveloperPro(platform.plan)
    ) {
      return 'PRO';
    }

    return 'FREE';
  }

  /**
   * الحصول على الاشتراك الحالي + حصص محسوبة
   */
  async getSubscription(userId: string) {
    const subscription = await this.ensureDeveloperSubscription(userId);
    const effectivePlan = await this.resolveEffectivePlan(userId, subscription);
    const limits = DEVELOPER_PLAN_LIMITS[effectivePlan];
    const quotas = await this.getResourceQuotas(userId, subscription, effectivePlan);

    const platform = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true },
    });

    return {
      ...subscription,
      plan: effectivePlan,
      storedPlan: subscription.plan,
      effectivePlan,
      platformPlan:
        platform?.status === 'ACTIVE' ? platform.plan : null,
      billingModel: 'usage' as const,
      ...quotas,
      messagesLimit: limits.maxMessagesPerMonth,
      apiKeysLimit: quotas.apiKeysLimit,
      apiKeysUsed: quotas.apiKeysUsed,
      appsLimit: quotas.appsLimit,
      appsUsed: quotas.appsUsed,
    };
  }

  /**
   * حصص الموارد حسب الخطة الفعلية
   */
  async getResourceQuotas(
    userId: string,
    subscriptionRecord?: Awaited<ReturnType<typeof this.ensureDeveloperSubscription>>,
    effectivePlan?: DeveloperPlanTier,
  ) {
    const subscription =
      subscriptionRecord ?? (await this.ensureDeveloperSubscription(userId));
    const plan =
      effectivePlan ?? (await this.resolveEffectivePlan(userId, subscription));
    const limits = DEVELOPER_PLAN_LIMITS[plan];

    const [activeKeyCount, activeAppCount] = await Promise.all([
      this.prisma.developerApiKey.count({
        where: { userId, status: 'ACTIVE' },
      }),
      this.prisma.developerApp.count({
        where: { userId, status: 'ACTIVE' },
      }),
    ]);

    return {
      apiKeysUsed: Math.max(subscription.apiKeysUsed, activeKeyCount),
      apiKeysLimit: resolveLimitValue(limits.maxApiKeys),
      appsUsed: Math.max(subscription.appsUsed ?? 0, activeAppCount),
      appsLimit: resolveLimitValue(limits.maxApps),
      phoneNumbersLimit: resolveLimitValue(limits.maxPhoneNumbers),
      webhooksLimit: resolveLimitValue(limits.maxWebhooks),
      contactsLimit: resolveLimitValue(limits.maxContacts),
      rateLimitPerMinute: limits.rateLimitPerMinute,
      logRetentionDays: limits.logRetentionDays,
    };
  }

  /** @deprecated استخدم getResourceQuotas */
  async getApiKeyQuota(
    userId: string,
    subscriptionRecord?: Awaited<ReturnType<typeof this.ensureDeveloperSubscription>>,
  ) {
    const subscription =
      subscriptionRecord ?? (await this.ensureDeveloperSubscription(userId));
    const effectivePlan = await this.resolveEffectivePlan(userId, subscription);
    const quotas = await this.getResourceQuotas(
      userId,
      subscription,
      effectivePlan,
    );

    const platform = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true, status: true },
    });

    return {
      used: quotas.apiKeysUsed,
      limit: quotas.apiKeysLimit,
      developerPlan: effectivePlan,
      platformPlan:
        platform?.status === 'ACTIVE' ? platform.plan : null,
    };
  }

  private async ensureDeveloperSubscription(userId: string) {
    let subscription = await this.prisma.developerSubscription.findUnique({
      where: { userId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!subscription) {
      const freeLimits = DEVELOPER_PLAN_LIMITS.FREE;
      subscription = await this.prisma.developerSubscription.create({
        data: {
          userId,
          plan: 'FREE',
          status: 'ACTIVE',
          messagesLimit: freeLimits.maxMessagesPerMonth,
          apiKeysLimit: resolveLimitValue(freeLimits.maxApiKeys),
          phoneNumbersLimit: resolveLimitValue(freeLimits.maxPhoneNumbers),
          webhooksLimit: resolveLimitValue(freeLimits.maxWebhooks),
          contactsLimit: resolveLimitValue(freeLimits.maxContacts),
          appsLimit: resolveLimitValue(freeLimits.maxApps),
          rateLimitPerMinute: freeLimits.rateLimitPerMinute,
          logRetentionDays: freeLimits.logRetentionDays,
        },
        include: {
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });
      return subscription;
    }

    if (LEGACY_PLANS_TO_MIGRATE.has(subscription.plan)) {
      const proLimits = DEVELOPER_PLAN_LIMITS.PRO;
      subscription = await this.prisma.developerSubscription.update({
        where: { userId },
        data: {
          plan: 'PRO',
          messagesLimit: proLimits.maxMessagesPerMonth,
          apiKeysLimit: resolveLimitValue(proLimits.maxApiKeys),
          phoneNumbersLimit: resolveLimitValue(proLimits.maxPhoneNumbers),
          webhooksLimit: resolveLimitValue(proLimits.maxWebhooks),
          contactsLimit: resolveLimitValue(proLimits.maxContacts),
          appsLimit: resolveLimitValue(proLimits.maxApps),
          rateLimitPerMinute: proLimits.rateLimitPerMinute,
          logRetentionDays: proLimits.logRetentionDays,
        },
        include: {
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });
      await this.redis.del(`devsub:${userId}`);
      this.logger.log(`Migrated developer subscription ${userId} to PRO`);
    }

    return subscription;
  }

  getAvailablePlans() {
    return [
      {
        plan: 'FREE',
        limits: DEVELOPER_PLAN_LIMITS.FREE,
        pricing: { monthly: 0, yearly: 0 },
        billingModel: 'usage',
      },
      {
        plan: 'PRO',
        limits: DEVELOPER_PLAN_LIMITS.PRO,
        pricing: {
          monthly: DEVELOPER_PRO_PRICING.monthly,
          yearly: DEVELOPER_PRO_PRICING.yearly,
        },
        billingModel: 'usage',
      },
    ];
  }

  async upgradePlan(userId: string, dto: UpgradePlanDto) {
    if (dto.plan !== 'PRO') {
      throw new ForbiddenException('Only the Pro plan is available for upgrade');
    }

    const effectivePlan = await this.resolveEffectivePlan(userId);
    const stored = await this.ensureDeveloperSubscription(userId);

    if (
      effectivePlan === 'PRO' &&
      (stored.plan === 'PRO' || LEGACY_PLANS_TO_MIGRATE.has(stored.plan))
    ) {
      throw new ForbiddenException('You are already on the Pro plan');
    }

    const cycle = dto.billingCycle === 'YEARLY' ? 'yearly' : 'monthly';
    const price = DEVELOPER_PRO_PRICING[cycle];
    const limits = DEVELOPER_PLAN_LIMITS.PRO;
    const now = new Date();
    const periodEnd = new Date(now);

    if (cycle === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const updated = await this.prisma.developerSubscription.update({
      where: { userId },
      data: {
        plan: 'PRO',
        billingCycle: cycle === 'monthly' ? 'MONTHLY' : 'YEARLY',
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        messagesLimit: limits.maxMessagesPerMonth,
        apiKeysLimit: resolveLimitValue(limits.maxApiKeys),
        phoneNumbersLimit: resolveLimitValue(limits.maxPhoneNumbers),
        webhooksLimit: resolveLimitValue(limits.maxWebhooks),
        contactsLimit: resolveLimitValue(limits.maxContacts),
        appsLimit: resolveLimitValue(limits.maxApps),
        rateLimitPerMinute: limits.rateLimitPerMinute,
        logRetentionDays: limits.logRetentionDays,
      },
    });

    await this.prisma.developerPayment.create({
      data: {
        subscriptionId: updated.id,
        amount: price,
        type: 'SUBSCRIPTION',
        status: 'COMPLETED',
        paymentMethod: dto.paymentMethod,
        paidAt: now,
      },
    });

    await this.redis.del(`devsub:${userId}`);
    this.logger.log(`User ${userId} upgraded to Pro`);

    return this.getSubscription(userId);
  }

  async getPlanLimits(userId: string): Promise<DeveloperPlanLimits> {
    const effectivePlan = await this.resolveEffectivePlan(userId);
    const limits = DEVELOPER_PLAN_LIMITS[effectivePlan];
    await this.redis.set(`devsub:${userId}`, limits, 300);
    return limits;
  }

  async checkResourceLimit(
    userId: string,
    resource: 'messages' | 'apiKeys' | 'phoneNumbers' | 'webhooks' | 'contacts' | 'apps',
  ) {
    const subscription = await this.ensureDeveloperSubscription(userId);
    const effectivePlan = await this.resolveEffectivePlan(userId, subscription);
    const limits = DEVELOPER_PLAN_LIMITS[effectivePlan];
    const quotas = await this.getResourceQuotas(
      userId,
      subscription,
      effectivePlan,
    );

    const resourceMap: Record<string, { used: number; max: number }> = {
      messages: {
        used: subscription.messagesUsed,
        max: resolveLimitValue(limits.maxMessagesPerMonth),
      },
      apiKeys: {
        used: quotas.apiKeysUsed,
        max: quotas.apiKeysLimit,
      },
      apps: {
        used: quotas.appsUsed,
        max: quotas.appsLimit,
      },
      phoneNumbers: {
        used: subscription.phoneNumbersUsed,
        max: resolveLimitValue(limits.maxPhoneNumbers),
      },
      webhooks: {
        used: subscription.webhooksUsed,
        max: resolveLimitValue(limits.maxWebhooks),
      },
      contacts: {
        used: subscription.contactsUsed,
        max: resolveLimitValue(limits.maxContacts),
      },
    };

    const check = resourceMap[resource];
    if (!check) return true;

    return check.used < check.max;
  }
}
