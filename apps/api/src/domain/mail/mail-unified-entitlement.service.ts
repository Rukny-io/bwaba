import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  DeveloperEmailDomainStatus,
  DeveloperEmailPlan,
  DeveloperEmailSubscriptionStatus,
  MailAppStatus,
  MailDomainStatus,
} from '@prisma/client';
import { randomInt } from 'crypto';
import {
  emailApiDomainLimit,
  getEmailApiPlan,
  getMailLimitsForEmailPlan,
} from '@rukny/email-api-pricing';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { EmailEntitlementService } from '../email-api/shared/email-entitlement.service';
import type { MailPlanLimits } from './mail-plan-limits.config';

export type UnifiedMailLimitsPayload = {
  planId: string;
  plan: DeveloperEmailPlan | string;
  unified: true;
  mailboxCount: number;
  limits: MailPlanLimits;
  storageQuotaBytesPerMailbox: number;
  emailPlan: {
    id: string;
    marketingNameEn: string;
    priceMonthlyIqd: number;
    monthlyQuota: number;
  };
};

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
export class MailUnifiedEntitlementService {
  private readonly logger = new Logger(MailUnifiedEntitlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailEntitlements: EmailEntitlementService,
  ) {}

  private normalizeDomain(domain: string): string {
    return domain.trim().toLowerCase();
  }

  private generateDeveloperAppId(): string {
    const timestamp = Date.now().toString();
    const randomPart = randomInt(100, 999).toString();
    return (timestamp + randomPart).slice(0, 16);
  }

  private async provisionDeveloperAppForMail(
    userId: string,
    mailApp: { name: string; contactEmail: string | null },
  ) {
    let appId = this.generateDeveloperAppId();
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const exists = await this.prisma.developerApp.findUnique({
        where: { appId },
        select: { id: true },
      });
      if (!exists) break;
      appId = this.generateDeveloperAppId();
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const developerApp = await tx.developerApp.create({
        data: {
          appId,
          userId,
          name: mailApp.name.trim() || 'Rukny Mail',
          contactEmail: mailApp.contactEmail,
          verified: true,
        },
        select: { id: true },
      });

      await tx.developerAppWallet.create({
        data: { developerAppId: developerApp.id },
      });

      await tx.developerAppProduct.create({
        data: {
          developerAppId: developerApp.id,
          productId: 'emailApi',
          installedBy: userId,
        },
      });

      return developerApp;
    });

    this.logger.log(
      `Auto-provisioned developer app ${appId} for Mail user ${userId}`,
    );
    return created;
  }

  async ensureLinkedDeveloperApp(
    mailAppUuid: string,
    userId: string,
  ): Promise<string | null> {
    const mailApp = await this.prisma.mailApp.findFirst({
      where: { id: mailAppUuid, userId },
      select: {
        id: true,
        linkedDeveloperAppId: true,
        name: true,
        contactEmail: true,
      },
    });
    if (!mailApp) return null;
    if (mailApp.linkedDeveloperAppId) return mailApp.linkedDeveloperAppId;

    let devApp = await this.prisma.developerApp.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        installedProducts: { some: { productId: 'emailApi' } },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!devApp) {
      devApp = await this.provisionDeveloperAppForMail(userId, mailApp);
    }

    await this.prisma.mailApp.update({
      where: { id: mailApp.id },
      data: { linkedDeveloperAppId: devApp.id },
    });
    await this.emailEntitlements.ensureEntitlement(userId, devApp.id);
    return devApp.id;
  }

  async collectAccountDomains(
    developerAppId: string,
    userId: string,
  ): Promise<Set<string>> {
    const mailDomains = await this.prisma.mailApp.findMany({
      where: {
        userId,
        linkedDeveloperAppId: developerAppId,
        status: MailAppStatus.ACTIVE,
        primaryDomain: { not: null },
      },
      select: { primaryDomain: true },
    });
    const apiDomains = await this.prisma.developerEmailDomain.findMany({
      where: { developerAppId, userId },
      select: { domain: true },
    });

    const domains = new Set<string>();
    for (const row of mailDomains) {
      if (row.primaryDomain) {
        domains.add(this.normalizeDomain(row.primaryDomain));
      }
    }
    for (const row of apiDomains) {
      domains.add(this.normalizeDomain(row.domain));
    }
    return domains;
  }

  async getDomainQuotaForMailApp(
    mailAppUuid: string,
    userId: string,
  ): Promise<MailDomainQuotaPayload | null> {
    const developerAppId = await this.ensureLinkedDeveloperApp(
      mailAppUuid,
      userId,
    );
    if (!developerAppId) return null;

    const entitlement = await this.emailEntitlements.ensureEntitlement(
      userId,
      developerAppId,
    );
    const limit = emailApiDomainLimit(
      entitlement.plan,
      entitlement.addonDomainsExtra,
    );
    const domainSet = await this.collectAccountDomains(developerAppId, userId);
    const planDef = getEmailApiPlan(entitlement.plan);
    const used = domainSet.size;

    return {
      used,
      limit,
      remaining: Math.max(0, limit - used),
      planId: planDef.slug,
      marketingNameEn: planDef.marketingNameEn,
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

    const developerAppId = await this.ensureLinkedDeveloperApp(
      mailAppUuid,
      userId,
    );
    if (!developerAppId) {
      throw new BadRequestException('Could not link billing account.');
    }

    const entitlement = await this.emailEntitlements.ensureEntitlement(
      userId,
      developerAppId,
    );
    const limit = emailApiDomainLimit(
      entitlement.plan,
      entitlement.addonDomainsExtra,
    );
    const allDomains = await this.collectAccountDomains(developerAppId, userId);

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
      const planDef = getEmailApiPlan(entitlement.plan);
      throw new BadRequestException(
        `Domain limit reached (${limit} on ${planDef.marketingNameEn}). Upgrade your plan to add more domains.`,
      );
    }
  }

  async syncMailDomainToEntitlement(
    userId: string,
    developerAppId: string,
    rawDomain: string,
    opts: {
      dkimTokens?: string[];
      domainStatus?: MailDomainStatus;
    } = {},
  ): Promise<void> {
    const domain = this.normalizeDomain(rawDomain);
    if (!domain) return;

    const verified = opts.domainStatus === MailDomainStatus.ACTIVE;
    const status = verified
      ? DeveloperEmailDomainStatus.VERIFIED
      : DeveloperEmailDomainStatus.PENDING;

    await this.prisma.developerEmailDomain.upsert({
      where: {
        developerAppId_domain: { developerAppId, domain },
      },
      create: {
        userId,
        developerAppId,
        domain,
        status,
        dkimTokens: opts.dkimTokens ?? [],
        verifiedAt: verified ? new Date() : undefined,
      },
      update: {
        status,
        ...(opts.dkimTokens ? { dkimTokens: opts.dkimTokens } : {}),
        verifiedAt: verified ? new Date() : undefined,
      },
    });
  }

  async releaseMailDomainFromEntitlement(
    userId: string,
    developerAppId: string,
    rawDomain: string,
  ): Promise<void> {
    const domain = this.normalizeDomain(rawDomain);
    if (!domain) return;

    const stillOnMail = await this.prisma.mailApp.count({
      where: {
        userId,
        linkedDeveloperAppId: developerAppId,
        status: MailAppStatus.ACTIVE,
        primaryDomain: domain,
      },
    });
    if (stillOnMail > 0) return;

    const record = await this.prisma.developerEmailDomain.findUnique({
      where: { developerAppId_domain: { developerAppId, domain } },
      select: { id: true, userId: true },
    });
    if (!record || record.userId !== userId) return;

    await this.prisma.developerEmailSender.deleteMany({
      where: { emailDomainId: record.id },
    });
    await this.prisma.developerEmailDomain.delete({
      where: { id: record.id },
    });
  }

  async resolveLinkedEntitlement(mailAppUuid: string) {
    const mailApp = await this.prisma.mailApp.findUnique({
      where: { id: mailAppUuid },
      select: {
        id: true,
        userId: true,
        linkedDeveloperAppId: true,
      },
    });
    if (!mailApp?.linkedDeveloperAppId) return null;

    const entitlement = await this.prisma.developerEmailEntitlement.findUnique({
      where: { developerAppId: mailApp.linkedDeveloperAppId },
    });
    if (!entitlement) return null;

    return { mailApp, entitlement };
  }

  async getLimitsForMailApp(
    mailAppUuid: string,
  ): Promise<UnifiedMailLimitsPayload | null> {
    const link = await this.resolveLinkedEntitlement(mailAppUuid);
    if (!link) return null;

    const planDef = getEmailApiPlan(link.entitlement.plan);
    const mailLimits = getMailLimitsForEmailPlan(link.entitlement.plan);
    const subscriptionActive =
      link.entitlement.subscriptionStatus ===
        DeveloperEmailSubscriptionStatus.ACTIVE &&
      (!link.entitlement.periodEndsAt ||
        link.entitlement.periodEndsAt > new Date());

    const hasAccess =
      link.entitlement.plan === DeveloperEmailPlan.FREE || subscriptionActive;
    if (!hasAccess) return null;

    return {
      planId: planDef.slug,
      plan: link.entitlement.plan,
      unified: true,
      mailboxCount: mailLimits.mailboxesIncluded,
      limits: mailLimits as MailPlanLimits,
      storageQuotaBytesPerMailbox: mailLimits.storageGbPerMailbox * 1024 ** 3,
      emailPlan: {
        id: planDef.id,
        marketingNameEn: planDef.marketingNameEn,
        priceMonthlyIqd: planDef.priceMonthlyIqd,
        monthlyQuota: planDef.monthlyQuota,
      },
    };
  }

  async reserveOutbound(
    mailAppUuid: string,
    count: number,
  ): Promise<{ remaining: number } | null> {
    const link = await this.resolveLinkedEntitlement(mailAppUuid);
    if (!link) return null;

    const n = Math.max(1, Math.floor(count));
    for (let i = 0; i < n; i++) {
      await this.emailEntitlements.reserveLiveSend(
        link.mailApp.userId,
        link.entitlement.developerAppId,
      );
    }

    const summary = await this.emailEntitlements.getSummary(
      link.mailApp.userId,
      link.entitlement.developerAppId,
    );
    const remaining =
      summary.subscription.remaining + summary.free.remaining;
    return { remaining };
  }
}
