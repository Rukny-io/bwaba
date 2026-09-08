import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeveloperEmailDomainStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { MailSesService } from '../../mail/mail-ses.service';

@Injectable()
export class EmailDomainsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ses: MailSesService,
  ) {}

  async list(userId: string) {
    const domains = await this.prisma.developerEmailDomain.findMany({
      where: { userId },
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
        emailDomain: { userId },
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

  async create(userId: string, rawDomain: string) {
    const domain = this.normalizeDomain(rawDomain);
    const identity = await this.ses.createEmailIdentity(domain);
    const status = identity.sending
      ? DeveloperEmailDomainStatus.VERIFIED
      : DeveloperEmailDomainStatus.PENDING;
    const saved = await this.prisma.developerEmailDomain.upsert({
      where: { userId_domain: { userId, domain } },
      create: {
        userId,
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

  async get(userId: string, rawDomain: string) {
    const domain = this.normalizeDomain(rawDomain);
    const record = await this.prisma.developerEmailDomain.findUnique({
      where: { userId_domain: { userId, domain } },
      select: {
        id: true,
        domain: true,
        status: true,
        dkimTokens: true,
        verifiedAt: true,
        createdAt: true,
      },
    });
    if (!record) throw new NotFoundException('Email domain not found.');
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

  async createSender(userId: string, developerAppId: string, rawEmail: string) {
    const email = rawEmail.trim().toLowerCase();
    const [localPart, domain] = this.splitAddress(email);
    const ownedDomain = await this.prisma.developerEmailDomain.findFirst({
      where: { userId, domain, status: DeveloperEmailDomainStatus.VERIFIED },
      select: { id: true },
    });
    if (!ownedDomain)
      throw new BadRequestException('Domain is not verified for this account.');
    const app = await this.prisma.developerApp.findFirst({
      where: { id: developerAppId, userId },
      select: { id: true },
    });
    if (!app)
      throw new ForbiddenException(
        'Developer app does not belong to this account.',
      );
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
