import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MailAppStatus, MailPlan, SubscriptionStatus } from '@prisma/client';
import { isMailUnlimited } from '@rukny/mail-pricing';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import {
  MAIL_DOMAINS_INCLUDED,
  MAIL_PLAN_DEFINITIONS,
} from './mail-plan-limits.config';

export type MailDomainQuotaPayload = {
  used: number;
  limit: number;
  remaining: number;
  planId: string;
  marketingNameEn: string;
  domains: string[];
  canAttach?: boolean;
};

@Injectable()
export class MailPlanQuotaService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeDomain(domain: string): string {
    return domain.trim().toLowerCase();
  }

  private async resolvePlanForApp(mailAppUuid: string): Promise<MailPlan> {
    const sub = await this.prisma.mailSubscription.findUnique({
      where: { mailAppId: mailAppUuid },
      select: { plan: true, status: true },
    });
    if (sub?.status === SubscriptionStatus.ACTIVE) {
      return sub.plan;
    }
    return MailPlan.FREE;
  }

  private domainLimitForPlan(plan: MailPlan): number {
    const limit = MAIL_DOMAINS_INCLUDED[plan] ?? 1;
    return isMailUnlimited(limit) ? Number.MAX_SAFE_INTEGER : limit;
  }

  async collectUserDomains(userId: string): Promise<Set<string>> {
    const rows = await this.prisma.mailApp.findMany({
      where: {
        userId,
        status: MailAppStatus.ACTIVE,
        primaryDomain: { not: null },
      },
      select: { primaryDomain: true },
    });
    const domains = new Set<string>();
    for (const row of rows) {
      if (row.primaryDomain) {
        domains.add(this.normalizeDomain(row.primaryDomain));
      }
    }
    return domains;
  }

  async getDomainQuotaForMailApp(
    mailAppUuid: string,
    userId: string,
  ): Promise<MailDomainQuotaPayload> {
    const mailApp = await this.prisma.mailApp.findFirst({
      where: { id: mailAppUuid, userId },
      select: { id: true, primaryDomain: true },
    });
    if (!mailApp) {
      throw new NotFoundException('Mail workspace not found.');
    }

    const plan = await this.resolvePlanForApp(mailAppUuid);
    const limit = this.domainLimitForPlan(plan);
    const domainSet = await this.collectUserDomains(userId);
    const used = domainSet.size;
    const def = MAIL_PLAN_DEFINITIONS[plan];

    return {
      used,
      limit,
      remaining: Math.max(0, limit - used),
      planId: plan.toLowerCase(),
      marketingNameEn: def.name,
      domains: [...domainSet].sort(),
    };
  }

  async canAttachDomain(
    mailAppUuid: string,
    userId: string,
    rawDomain: string,
  ): Promise<boolean> {
    try {
      await this.assertCanAttachDomain(mailAppUuid, userId, rawDomain);
      return true;
    } catch {
      return false;
    }
  }

  async assertCanAttachDomain(
    mailAppUuid: string,
    userId: string,
    rawDomain: string,
  ): Promise<void> {
    const domain = this.normalizeDomain(rawDomain);
    if (!domain) {
      throw new BadRequestException('Invalid domain.');
    }

    const mailApp = await this.prisma.mailApp.findFirst({
      where: { id: mailAppUuid, userId },
      select: { id: true, primaryDomain: true },
    });
    if (!mailApp) {
      throw new NotFoundException('Mail workspace not found.');
    }

    const plan = await this.resolvePlanForApp(mailAppUuid);
    const limit = this.domainLimitForPlan(plan);
    const allDomains = await this.collectUserDomains(userId);

    if (allDomains.has(domain)) {
      return;
    }

    const current = mailApp.primaryDomain
      ? this.normalizeDomain(mailApp.primaryDomain)
      : null;
    const quotaDomains = new Set(allDomains);
    if (current) {
      quotaDomains.delete(current);
    }

    if (quotaDomains.size >= limit) {
      const def = MAIL_PLAN_DEFINITIONS[plan];
      throw new BadRequestException(
        `Domain limit reached (${limit} on ${def.name}). Upgrade your Mail plan to add more domains.`,
      );
    }
  }
}
