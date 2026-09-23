import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { MailPlan, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import {
  MAIL_INCLUDED_OUTBOUND,
  MAIL_OUTBOUND_PACK_EMAILS,
  mailOutboundPackPriceIqd,
} from './mail-plan-limits.config';

export type MailOutboundUsageView = {
  plan: MailPlan;
  planId: string;
  status: string;
  included: number;
  used: number;
  packCredits: number;
  allowance: number;
  remaining: number;
  percentUsed: number;
  periodStart: string | null;
  periodEnd: string | null;
  packsAvailable: boolean;
  packEmails: number;
  packPriceIqd: number | null;
};

@Injectable()
export class MailOutboundUsageService {
  private readonly logger = new Logger(MailOutboundUsageService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUsageForMailApp(mailAppUuid: string): Promise<MailOutboundUsageView | null> {
    const sub = await this.prisma.mailSubscription.findUnique({
      where: { mailAppId: mailAppUuid },
    });
    if (!sub) return null;

    const included = MAIL_INCLUDED_OUTBOUND[sub.plan] ?? 0;
    const used = Math.max(0, sub.outboundUsed ?? 0);
    const packCredits = Math.max(0, sub.outboundPackCredits ?? 0);
    const allowance = included + packCredits;
    const remaining = Math.max(0, allowance - used);
    const percentUsed =
      allowance > 0
        ? Math.min(100, Math.round((used / allowance) * 1000) / 10)
        : 0;
    const packPriceIqd = mailOutboundPackPriceIqd(sub.plan);

    return {
      plan: sub.plan,
      planId: sub.plan.toLowerCase(),
      status: sub.status,
      included,
      used,
      packCredits,
      allowance,
      remaining,
      percentUsed,
      periodStart: sub.currentPeriodStart?.toISOString() ?? null,
      periodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      packsAvailable:
        sub.status === SubscriptionStatus.ACTIVE && packPriceIqd != null,
      packEmails: MAIL_OUTBOUND_PACK_EMAILS,
      packPriceIqd,
    };
  }

  /**
   * Atomically reserve `count` outbound recipient slots.
   * Throws 402 when quota is exhausted.
   */
  async reserveOutbound(
    mailAppUuid: string,
    count: number,
  ): Promise<{ remaining: number }> {
    const n = Math.max(1, Math.floor(count));
    const sub = await this.prisma.mailSubscription.findUnique({
      where: { mailAppId: mailAppUuid },
    });
    if (!sub || sub.status !== SubscriptionStatus.ACTIVE) {
      throw new HttpException(
        {
          code: 'mail_plan_inactive',
          message: 'This Mail app needs an active plan before you can send mail.',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const included = MAIL_INCLUDED_OUTBOUND[sub.plan] ?? 0;
    // Prisma cannot compare outboundUsed < included + outboundPackCredits in updateMany.
    // Read → check → conditional update with expected used value; retry once on race.
    for (let attempt = 0; attempt < 3; attempt++) {
      const current = await this.prisma.mailSubscription.findUnique({
        where: { id: sub.id },
        select: {
          id: true,
          outboundUsed: true,
          outboundPackCredits: true,
          plan: true,
          status: true,
        },
      });
      if (!current || current.status !== SubscriptionStatus.ACTIVE) {
        throw new HttpException(
          {
            code: 'mail_plan_inactive',
            message:
              'This Mail app needs an active plan before you can send mail.',
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      const planIncluded = MAIL_INCLUDED_OUTBOUND[current.plan] ?? included;
      const used = current.outboundUsed;
      const packCredits = current.outboundPackCredits;
      const allowance = planIncluded + packCredits;
      if (used + n > allowance) {
        const packPrice = mailOutboundPackPriceIqd(current.plan);
        throw new HttpException(
          {
            code: 'outbound_quota_exceeded',
            message:
              packPrice != null
                ? 'Outbound email quota reached. Buy more emails from Billing → Usage.'
                : 'Outbound email quota reached for this plan.',
            used,
            included: planIncluded,
            packCredits,
            remaining: Math.max(0, allowance - used),
            packPriceIqd: packPrice,
            packEmails: MAIL_OUTBOUND_PACK_EMAILS,
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }

      const updated = await this.prisma.mailSubscription.updateMany({
        where: {
          id: current.id,
          outboundUsed: used,
          status: SubscriptionStatus.ACTIVE,
        },
        data: { outboundUsed: { increment: n } },
      });
      if (updated.count === 1) {
        return { remaining: Math.max(0, allowance - used - n) };
      }
    }

    this.logger.warn(`outbound reserve raced for mailApp ${mailAppUuid}`);
    throw new HttpException(
      {
        code: 'outbound_quota_busy',
        message: 'Could not reserve send quota. Try again.',
      },
      HttpStatus.CONFLICT,
    );
  }

  async creditPackEmails(subscriptionId: string, emails: number) {
    const n = Math.max(0, Math.floor(emails));
    if (n <= 0) return;
    await this.prisma.mailSubscription.update({
      where: { id: subscriptionId },
      data: { outboundPackCredits: { increment: n } },
    });
  }

  /** Reset usage counters when a new billing period starts (seat payment / admin). */
  async resetPeriodCounters(subscriptionId: string) {
    await this.prisma.mailSubscription.update({
      where: { id: subscriptionId },
      data: { outboundUsed: 0, outboundPackCredits: 0 },
    });
  }
}
