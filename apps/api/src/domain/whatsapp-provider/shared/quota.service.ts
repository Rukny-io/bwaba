import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { RedisService } from '../../../core/cache/redis.service';
import {
  normalizeDeveloperPlan,
  platformPlanGrantsDeveloperPro,
  resolveLimitValue,
  DEVELOPER_PLAN_LIMITS,
  type DeveloperPlanTier,
} from '../../developer/subscriptions/dev-plan-limits.config';

/**
 * 📊 خدمة التحقق من الحصص
 *
 * الرسائل: الفوترة عبر المحفظة (usage) — لا حد شهري على الاشتراك
 * الموارد الأخرى: حسب Free / Pro
 */
@Injectable()
export class QuotaService {
  private readonly logger = new Logger(QuotaService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private async resolveEffectivePlan(userId: string): Promise<DeveloperPlanTier> {
    const subscription = await this.prisma.developerSubscription.findUnique({
      where: { userId },
      select: { plan: true },
    });

    if (subscription && normalizeDeveloperPlan(subscription.plan) === 'PRO') {
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

  private async getEffectiveLimits(userId: string) {
    const plan = await this.resolveEffectivePlan(userId);
    return DEVELOPER_PLAN_LIMITS[plan];
  }

  /**
   * الرسائل تُفوتر عبر المحفظة — لا حد اشتراك شهري
   */
  async checkMessageQuota(_userId: string): Promise<boolean> {
    return true;
  }

  async incrementMessageCount(userId: string) {
    await this.prisma.developerSubscription.update({
      where: { userId },
      data: { messagesUsed: { increment: 1 } },
    });
  }

  async checkRateLimit(userId: string, apiKeyId: string): Promise<boolean> {
    const limits = await this.getEffectiveLimits(userId);
    const rateLimit = limits.rateLimitPerMinute;
    const key = `ratelimit:${apiKeyId}`;

    const current = await this.redis.get<number>(key);
    if (current !== null && current !== undefined && current >= rateLimit) {
      return false;
    }

    const pipeline = await this.redis.getClient();
    if (pipeline) {
      const multi = pipeline.multi();
      multi.incr(key);
      multi.expire(key, 60);
      await multi.exec();
    }

    return true;
  }

  async enforceQuota(userId: string, resource: 'messages' | 'phoneNumbers') {
    if (resource === 'messages') {
      return;
    }

    if (resource === 'phoneNumbers') {
      const limits = await this.getEffectiveLimits(userId);
      const max = resolveLimitValue(limits.maxPhoneNumbers);
      const count = await this.prisma.developerPhoneNumber.count({
        where: { account: { userId }, status: { not: 'BANNED' } },
      });
      if (count >= max) {
        throw new ForbiddenException(
          `Phone number limit reached (${max === Number.MAX_SAFE_INTEGER ? 'unlimited' : max}). Upgrade to Pro.`,
        );
      }
    }
  }
}
