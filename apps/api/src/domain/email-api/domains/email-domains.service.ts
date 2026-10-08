import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeveloperEmailDomainStatus,
  MailAppStatus,
  MailDomainStatus,
} from '@prisma/client';
import {
  generateOwnershipToken,
  verifyDomainDns,
} from '@rukny/domain-verification';
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
        ownershipToken: true,
        ownershipVerifiedAt: true,
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

    await this.assertDomainAvailableGlobally(domain, developerAppId);
    await this.ses.deleteEmailIdentity(domain).catch(() => undefined);
    const identity = await this.ses.createEmailIdentity(domain);
    const ownershipToken = generateOwnershipToken();
    const saved = await this.prisma.developerEmailDomain.upsert({
      where: { developerAppId_domain: { developerAppId, domain } },
      create: {
        userId,
        developerAppId,
        domain,
        status: DeveloperEmailDomainStatus.PENDING,
        dkimTokens: identity.tokens,
        ownershipToken,
      },
      update: {
        status: DeveloperEmailDomainStatus.PENDING,
        dkimTokens: identity.tokens,
        ownershipToken,
        ownershipVerifiedAt: null,
        verifiedAt: null,
      },
      select: {
        domain: true,
        status: true,
        dkimTokens: true,
        ownershipToken: true,
        ownershipVerifiedAt: true,
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
        ownershipToken: true,
        ownershipVerifiedAt: true,
        verifiedAt: true,
        createdAt: true,
        userId: true,
      },
    });
    if (!record || record.userId !== userId) {
      throw new NotFoundException('Email domain not found.');
    }
    return this.publicDomain(record);
  }

  async verify(userId: string, developerAppId: string, rawDomain: string) {
    const domain = this.normalizeDomain(rawDomain);
    const record = await this.prisma.developerEmailDomain.findUnique({
      where: { developerAppId_domain: { developerAppId, domain } },
      select: {
        id: true,
        domain: true,
        status: true,
        dkimTokens: true,
        ownershipToken: true,
        ownershipVerifiedAt: true,
        verifiedAt: true,
        createdAt: true,
        userId: true,
      },
    });
    if (!record || record.userId !== userId) {
      throw new NotFoundException('Email domain not found.');
    }
    const ownershipToken = record.ownershipToken ?? generateOwnershipToken();
    if (!record.ownershipToken) {
      await this.prisma.developerEmailDomain.update({
        where: { id: record.id },
        data: { ownershipToken },
      });
    }

    await this.assertDomainAvailableGlobally(domain, developerAppId);

    const result = await verifyDomainDns(domain, {
      dkimTokens: record.dkimTokens,
      ownershipToken,
      getSesStatus: (name) => this.ses.getEmailIdentity(name),
    });
    if (!result.ok) {
      throw new BadRequestException(result.error);
    }

    const verified = result.verified;
    const updated = await this.prisma.developerEmailDomain.update({
      where: { id: record.id },
      data: {
        status: verified
          ? DeveloperEmailDomainStatus.VERIFIED
          : DeveloperEmailDomainStatus.PENDING,
        dkimTokens: result.ses.tokens.length
          ? result.ses.tokens
          : record.dkimTokens,
        ownershipToken,
        ownershipVerifiedAt: verified ? new Date() : null,
        verifiedAt: verified ? new Date() : null,
      },
      select: {
        domain: true,
        status: true,
        dkimTokens: true,
        ownershipToken: true,
        ownershipVerifiedAt: true,
        verifiedAt: true,
        createdAt: true,
      },
    });

    return {
      ...this.publicDomain(updated),
      verified,
      waiting: result.waiting,
      results: result.results,
    };
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
    await this.ses.deleteEmailIdentity(domain).catch(() => undefined);
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

  private async assertDomainAvailableGlobally(
    domain: string,
    developerAppId: string,
  ) {
    const mailConflict = await this.prisma.mailApp.count({
      where: {
        primaryDomain: domain,
        status: MailAppStatus.ACTIVE,
        domainStatus: MailDomainStatus.ACTIVE,
      },
    });
    if (mailConflict > 0) {
      throw new ConflictException(
        'This domain is already active on a Mail workspace.',
      );
    }

    const emailConflict = await this.prisma.developerEmailDomain.count({
      where: {
        domain,
        status: DeveloperEmailDomainStatus.VERIFIED,
        developerAppId: { not: developerAppId },
      },
    });
    if (emailConflict > 0) {
      throw new ConflictException(
        'This domain is already verified on another developer app.',
      );
    }
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
    ownershipToken?: string | null;
    ownershipVerifiedAt?: Date | null;
    verifiedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      domain: domain.domain,
      status: domain.status.toLowerCase(),
      dkimTokens: domain.dkimTokens,
      ownershipToken: domain.ownershipToken ?? null,
      ownershipVerifiedAt: domain.ownershipVerifiedAt?.toISOString() ?? null,
      verifiedAt: domain.verifiedAt?.toISOString() ?? null,
      createdAt: domain.createdAt.toISOString(),
    };
  }
}
