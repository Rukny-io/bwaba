import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeveloperEmailDomainStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { MailSesService } from '../../mail/mail-ses.service';
import { EmailEntitlementService } from '../shared/email-entitlement.service';
import { emailApiDomainLimit } from '../billing/email-api-plan-limits.config';

@Injectable()
export class EmailDomainsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ses: MailSesService,
    private readonly entitlements: EmailEntitlementService,
  ) {}

  async list(userId: string, developerAppId: string) {
    const domains = await this.prisma.developerEmailDomain.findMany({
      where: { userId, developerAppId },
      orderBy: { createdAt: 'desc' },
      select: {
        domain: true,
        status: true,
        dkimTokens: true,
        verifiedAt: true,
        createdAt: true,
      },
    });
    return domains.map((domain) => this.publicDomain(domain));
  }

  async listSenders(userId: string, developerAppId: string) {
    const senders = await this.prisma.developerEmailSender.findMany({
      where: {
        developerAppId,
        developerApp: { userId },
        emailDomain: { userId, developerAppId },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        localPart: true,
        status: true,
        createdAt: true,
        emailDomain: { select: { domain: true, status: true } },
      },
    });
    return senders.map((sender) => ({
      id: sender.id,
      email: `${sender.localPart}@${sender.emailDomain.domain}`,
      status: sender.status.toLowerCase(),
      domainStatus: sender.emailDomain.status.toLowerCase(),
      createdAt: sender.createdAt.toISOString(),
    }));
  }

  async create(userId: string, developerAppId: string, rawDomain: string) {
    const domain = this.normalizeDomain(rawDomain);
    const entitlement = await this.entitlements.ensureEntitlement(
      userId,
      developerAppId,
    );
    const domainCount = await this.prisma.developerEmailDomain.count({
      where: { developerAppId },
    });
    const limit = emailApiDomainLimit(
      entitlement.plan,
      entitlement.addonDomainsExtra,
    );
    const existing = await this.prisma.developerEmailDomain.findUnique({
      where: { developerAppId_domain: { developerAppId, domain } },
    });
    if (!existing && domainCount >= limit) {
      throw new BadRequestException(
        `Domain limit reached (${limit}). Upgrade your plan or add a domains pack.`,
      );
    }

    const identity = await this.ses.createEmailIdentity(domain);
    const status = identity.sending
      ? DeveloperEmailDomainStatus.VERIFIED
      : DeveloperEmailDomainStatus.PENDING;
    const saved = await this.prisma.developerEmailDomain.upsert({
      where: { developerAppId_domain: { developerAppId, domain } },
      create: {
        userId,
        developerAppId,
        domain,
        status,
        dkimTokens: identity.tokens,
        verifiedAt: identity.sending ? new Date() : undefined,
      },
      update: {
        status,
        dkimTokens: identity.tokens,
        verifiedAt: identity.sending ? new Date() : undefined,
      },
      select: {
        domain: true,
        status: true,
        dkimTokens: true,
        verifiedAt: true,
        createdAt: true,
      },
    });
    return this.publicDomain(saved);
  }

  async get(userId: string, developerAppId: string, rawDomain: string) {
    const domain = this.normalizeDomain(rawDomain);
    const record = await this.prisma.developerEmailDomain.findUnique({
      where: { developerAppId_domain: { developerAppId, domain } },
      select: {
        id: true,
        domain: true,
        status: true,
        dkimTokens: true,
        verifiedAt: true,
        createdAt: true,
        userId: true,
      },
    });
    if (!record || record.userId !== userId) {
      throw new NotFoundException('Email domain not found.');
    }
    const identity = await this.ses.getEmailIdentity(domain);
    const status = identity.sending
      ? DeveloperEmailDomainStatus.VERIFIED
      : DeveloperEmailDomainStatus.PENDING;
    const updated = await this.prisma.developerEmailDomain.update({
      where: { id: record.id },
      data: {
        status,
        dkimTokens: identity.tokens,
        verifiedAt: identity.sending ? (record.verifiedAt ?? new Date()) : null,
      },
      select: {
        domain: true,
        status: true,
        dkimTokens: true,
        verifiedAt: true,
        createdAt: true,
      },
    });
    return this.publicDomain(updated);
  }

  async delete(userId: string, developerAppId: string, rawDomain: string) {
    const domain = this.normalizeDomain(rawDomain);
    const record = await this.prisma.developerEmailDomain.findUnique({
      where: { developerAppId_domain: { developerAppId, domain } },
      select: { id: true, userId: true },
    });
    if (!record || record.userId !== userId) {
      throw new NotFoundException('Email domain not found.');
    }
    await this.prisma.developerEmailSender.deleteMany({
      where: { emailDomainId: record.id },
    });
    await this.prisma.developerEmailDomain.delete({
      where: { id: record.id },
    });
    return { success: true };
  }

  async createSender(userId: string, developerAppId: string, rawEmail: string) {
    const email = rawEmail.trim().toLowerCase();
    const [localPart, domain] = this.splitAddress(email);
    const ownedDomain = await this.prisma.developerEmailDomain.findFirst({
      where: {
        userId,
        developerAppId,
        domain,
        status: DeveloperEmailDomainStatus.VERIFIED,
      },
      select: { id: true },
    });
    if (!ownedDomain) {
      throw new BadRequestException(
        'Domain is not verified for this app.',
      );
    }
    const app = await this.prisma.developerApp.findFirst({
      where: { id: developerAppId, userId },
      select: { id: true },
    });
    if (!app) {
      throw new ForbiddenException(
        'Developer app does not belong to this account.',
      );
    }
    const sender = await this.prisma.developerEmailSender.upsert({
      where: {
        developerAppId_emailDomainId_localPart: {
          developerAppId,
          emailDomainId: ownedDomain.id,
          localPart,
        },
      },
      create: { developerAppId, emailDomainId: ownedDomain.id, localPart },
      update: { status: 'ACTIVE' },
      select: {
        id: true,
        localPart: true,
        status: true,
        emailDomain: { select: { domain: true } },
      },
    });
    return {
      id: sender.id,
      email: `${sender.localPart}@${sender.emailDomain.domain}`,
      status: sender.status.toLowerCase(),
    };
  }

  private normalizeDomain(value: string) {
    const domain = value.trim().toLowerCase().replace(/\.$/, '');
    if (
      !domain ||
      domain.includes('@') ||
      domain.includes('/') ||
      domain.includes('..')
    ) {
      throw new BadRequestException('Invalid domain.');
    }
    return domain;
  }

  private splitAddress(value: string): [string, string] {
    const at = value.lastIndexOf('@');
    if (at <= 0 || at === value.length - 1 || /\r|\n/.test(value))
      throw new BadRequestException('Invalid sender email.');
    return [value.slice(0, at), value.slice(at + 1)];
  }

  private publicDomain(domain: {
    domain: string;
    status: DeveloperEmailDomainStatus;
    dkimTokens: string[];
    verifiedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      domain: domain.domain,
      status: domain.status.toLowerCase(),
      dkimTokens: domain.dkimTokens,
      verifiedAt: domain.verifiedAt?.toISOString() ?? null,
      createdAt: domain.createdAt.toISOString(),
    };
  }
}
