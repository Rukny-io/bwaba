import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BillingCycle,
  MailPlan,
  PaymentStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { RedisService } from '../../core/cache/redis.service';
import {
  MAIL_PLAN_DEFINITIONS,
  MAIL_PLAN_LIMITS,
  MAIL_PLAN_ORDER,
  addOneMonth,
  mailMonthlyTotal,
} from './mail-plan-limits.config';

@Injectable()
export class MailSubscriptionsService {
  private readonly CACHE_PREFIX = 'mail-sub:';
  private readonly CACHE_TTL = 300;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  getPlansOverview() {
    return {
      currency: 'IQD',
      plans: MAIL_PLAN_ORDER.map((id) => {
        const plan = MAIL_PLAN_DEFINITIONS[id];
        return {
          id: plan.id,
          planId: plan.id.toLowerCase(),
          name: plan.name,
          bestFor: plan.bestFor,
          priceMonthly: plan.priceMonthly,
          priceLabel: `${plan.priceMonthly.toLocaleString('en-IQ')} IQD/mo`,
          priceNote: 'Price per mailbox. 1-month term.',
          popular: plan.popular,
          limits: plan.limits,
          benefits: plan.benefits,
          highlights: [
            `${plan.limits.mailboxesIncluded} mailbox included`,
            `${plan.limits.storageGbPerMailbox} GB storage per mailbox`,
            `${plan.limits.forwardingRules} forwarding rules`,
            `${plan.limits.emailAliases} email aliases`,
            ...plan.benefits,
          ],
        };
      }),
    };
  }

  async getSubscription(userId: string) {
    const subscription = await this.prisma.mailSubscription.findUnique({
      where: { userId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!subscription) {
      return { subscription: null };
    }

    if (
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd.getTime() < Date.now()
    ) {
      const expired = await this.prisma.mailSubscription.update({
        where: { userId },
        data: { status: SubscriptionStatus.EXPIRED },
        include: {
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });
      await this.invalidateCache(userId);
      return { subscription: this.toView(expired) };
    }

    return { subscription: this.toView(subscription) };
  }

  async getActiveLimits(userId: string) {
    const cached = await this.redis
      .get(`${this.CACHE_PREFIX}${userId}`)
      .catch(() => null);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        /* fall through */
      }
    }

    const { subscription } = await this.getSubscription(userId);
    if (!subscription || subscription.status !== 'ACTIVE') {
      return null;
    }

    const payload = {
      planId: subscription.planId,
      plan: subscription.plan,
      mailboxCount: subscription.mailboxCount,
      limits: subscription.limits,
    };
    await this.redis
      .set(
        `${this.CACHE_PREFIX}${userId}`,
        JSON.stringify(payload),
        this.CACHE_TTL,
      )
      .catch(() => {});
    return payload;
  }

  /**
   * Activate or change plan. Payment gateway comes later —
   * records a COMPLETED payment row for audit (manual/phase activation).
   */
  async upsertSubscription(
    userId: string,
    plan: MailPlan,
    mailboxCount = 1,
    billingCycle: BillingCycle = BillingCycle.MONTHLY,
  ) {
    const seats = Math.max(1, Math.floor(mailboxCount));
    if (seats > 500) {
      throw new BadRequestException('Mailbox count must be between 1 and 500.');
    }

    const now = new Date();
    const periodEnd = addOneMonth(now);
    const amount = mailMonthlyTotal(plan, seats);

    const subscription = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.mailSubscription.findUnique({
        where: { userId },
      });

      const saved = existing
        ? await tx.mailSubscription.update({
            where: { userId },
            data: {
              plan,
              status: SubscriptionStatus.ACTIVE,
              billingCycle,
              mailboxCount: seats,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              cancelledAt: null,
            },
          })
        : await tx.mailSubscription.create({
            data: {
              userId,
              plan,
              status: SubscriptionStatus.ACTIVE,
              billingCycle,
              mailboxCount: seats,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            },
          });

      await tx.mailSubscriptionPayment.create({
        data: {
          subscriptionId: saved.id,
          amount,
          billingCycle,
          mailboxCount: seats,
          status: PaymentStatus.COMPLETED,
          paidAt: now,
          metadata: {
            source: 'manual_activation',
            plan,
            note: 'Payment gateway not wired yet',
          },
        },
      });

      return tx.mailSubscription.findUniqueOrThrow({
        where: { id: saved.id },
        include: {
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });
    });

    await this.invalidateCache(userId);
    return { subscription: this.toView(subscription) };
  }

  async cancelSubscription(userId: string) {
    const existing = await this.prisma.mailSubscription.findUnique({
      where: { userId },
    });
    if (!existing) {
      throw new NotFoundException('No Mail subscription found.');
    }

    const subscription = await this.prisma.mailSubscription.update({
      where: { userId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    await this.invalidateCache(userId);
    return { subscription: this.toView(subscription) };
  }

  async adminSetPlan(
    userId: string,
    plan: MailPlan,
    mailboxCount = 1,
    billingCycle: BillingCycle = BillingCycle.MONTHLY,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found.');
    return this.upsertSubscription(userId, plan, mailboxCount, billingCycle);
  }

  private toView(
    subscription: {
      id: string;
      userId: string;
      plan: MailPlan;
      status: SubscriptionStatus;
      billingCycle: BillingCycle;
      mailboxCount: number;
      currentPeriodStart: Date | null;
      currentPeriodEnd: Date | null;
      cancelledAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      payments?: unknown[];
    },
  ) {
    const def = MAIL_PLAN_DEFINITIONS[subscription.plan];
    const limits = MAIL_PLAN_LIMITS[subscription.plan];
    return {
      id: subscription.id,
      userId: subscription.userId,
      plan: subscription.plan,
      planId: subscription.plan.toLowerCase() as
        | 'starter'
        | 'standard'
        | 'premium',
      planName: def.name,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      mailboxCount: subscription.mailboxCount,
      priceMonthlyPerMailbox: def.priceMonthly,
      monthlyTotal: mailMonthlyTotal(
        subscription.plan,
        subscription.mailboxCount,
      ),
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      renewsAt: subscription.currentPeriodEnd,
      cancelledAt: subscription.cancelledAt,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
      limits,
      payments: subscription.payments ?? [],
    };
  }

  private async invalidateCache(userId: string) {
    await this.redis.del(`${this.CACHE_PREFIX}${userId}`).catch(() => {});
  }
}
