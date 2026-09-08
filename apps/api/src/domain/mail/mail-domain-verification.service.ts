import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MailDomainStatus,
  MailDomainTrustStatus,
  MailDomainVerificationRequestStatus,
  Prisma,
  SecurityAction,
  SecurityStatus,
} from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { SecurityLogService } from '../../infrastructure/security/log.service';
import { MailFeatureFlags } from './mail-feature-flags';

const REQUEST_INCLUDE = {
  mailApp: {
    select: {
      id: true,
      appId: true,
      name: true,
      primaryDomain: true,
      domainStatus: true,
      domainCheckedAt: true,
      domainTrustStatus: true,
      domainVerifiedAt: true,
      domainTrustReason: true,
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { name: true, username: true, avatar: true } },
        },
      },
    },
  },
  requestedBy: {
    select: {
      id: true,
      email: true,
      profile: { select: { name: true, username: true, avatar: true } },
    },
  },
  reviewedBy: {
    select: {
      id: true,
      email: true,
      profile: { select: { name: true, username: true, avatar: true } },
    },
  },
} as const;

@Injectable()
export class MailDomainVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly securityLogs: SecurityLogService,
    private readonly flags: MailFeatureFlags,
  ) {}

  async request(userId: string, publicAppId: string) {
    this.flags.requireRuknyVerification();
    const app = await this.requireOwnedApp(userId, publicAppId);
    if (!app.primaryDomain) {
      throw new BadRequestException(
        'Connect a domain before requesting verification.',
      );
    }
    if (app.domainTrustStatus === MailDomainTrustStatus.VERIFIED) {
      throw new ConflictException('This domain is already verified.');
    }

    const existing = await this.prisma.mailDomainVerificationRequest.findFirst({
      where: {
        mailAppId: app.id,
        status: MailDomainVerificationRequestStatus.PENDING,
      },
      include: REQUEST_INCLUDE,
    });
    if (existing) {
      throw new ConflictException(
        'A domain verification request is already pending.',
      );
    }

    let created;
    try {
      created = await this.prisma.$transaction(async (tx) => {
        const row = await tx.mailDomainVerificationRequest.create({
          data: {
            mailAppId: app.id,
            requestedById: userId,
            domain: app.primaryDomain!,
            evidence: {
              domainStatus: app.domainStatus,
              domainCheckedAt: app.domainCheckedAt?.toISOString() ?? null,
            },
          },
          include: REQUEST_INCLUDE,
        });
        await tx.mailApp.update({
          where: { id: app.id },
          data: {
            domainTrustStatus: MailDomainTrustStatus.PENDING,
            domainTrustReason: null,
          },
        });
        return row;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A domain verification request is already pending.',
        );
      }
      throw error;
    }
    return { request: created };
  }

  async listForOwner(userId: string, publicAppId: string) {
    this.flags.requireRuknyVerification();
    const app = await this.requireOwnedApp(userId, publicAppId);
    const requests = await this.prisma.mailDomainVerificationRequest.findMany({
      where: { mailAppId: app.id, requestedById: userId },
      orderBy: { createdAt: 'desc' },
      include: REQUEST_INCLUDE,
    });
    return { requests };
  }

  async getForOwner(userId: string, publicAppId: string, requestId: string) {
    this.flags.requireRuknyVerification();
    const app = await this.requireOwnedApp(userId, publicAppId);
    const request = await this.prisma.mailDomainVerificationRequest.findFirst({
      where: { id: requestId, mailAppId: app.id, requestedById: userId },
      include: REQUEST_INCLUDE,
    });
    if (!request)
      throw new NotFoundException('Domain verification request not found.');
    return { request };
  }

  async listAdmin(options: { page: number; limit: number; status?: string }) {
    this.flags.requireRuknyVerification();
    const page = Math.max(1, options.page);
    const limit = Math.min(Math.max(1, options.limit), 100);
    const status = Object.values(MailDomainVerificationRequestStatus).includes(
      options.status as MailDomainVerificationRequestStatus,
    )
      ? (options.status as MailDomainVerificationRequestStatus)
      : undefined;
    const where = status ? { status } : {};
    const [requests, total] = await Promise.all([
      this.prisma.mailDomainVerificationRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: REQUEST_INCLUDE,
      }),
      this.prisma.mailDomainVerificationRequest.count({ where }),
    ]);
    return {
      data: requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getAdmin(requestId: string) {
    this.flags.requireRuknyVerification();
    const request = await this.requireRequest(requestId);
    return { request };
  }

  async approve(requestId: string, adminId: string) {
    this.flags.requireRuknyVerification();
    const request = await this.requirePendingRequest(requestId);
    if (
      request.mailApp.domainStatus !== MailDomainStatus.ACTIVE ||
      request.mailApp.primaryDomain !== request.domain
    ) {
      throw new BadRequestException(
        'The current domain must match the request and have ACTIVE DNS/SES verification.',
      );
    }

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.mailDomainVerificationRequest.updateMany({
        where: {
          id: requestId,
          status: MailDomainVerificationRequestStatus.PENDING,
        },
        data: {
          status: MailDomainVerificationRequestStatus.APPROVED,
          reviewedById: adminId,
          reviewedAt: now,
          rejectionReason: null,
        },
      });
      if (claimed.count !== 1) {
        throw new ConflictException('This request has already been decided.');
      }
      const verified = await tx.mailApp.updateMany({
        where: {
          id: request.mailAppId,
          domainStatus: MailDomainStatus.ACTIVE,
          primaryDomain: request.domain,
        },
        data: {
          domainTrustStatus: MailDomainTrustStatus.VERIFIED,
          domainVerifiedAt: now,
          domainReviewedById: adminId,
          domainTrustReason: null,
        },
      });
      if (verified.count !== 1) {
        throw new BadRequestException(
          'The current domain must match the request and have ACTIVE DNS/SES verification.',
        );
      }
      return tx.mailDomainVerificationRequest.findUniqueOrThrow({
        where: { id: requestId },
        include: REQUEST_INCLUDE,
      });
    });
    await this.audit(adminId, 'approved', updated);
    return { request: updated };
  }

  async reject(requestId: string, adminId: string, reason: string) {
    this.flags.requireRuknyVerification();
    const request = await this.requirePendingRequest(requestId);
    const rejectionReason = reason.trim();
    if (!rejectionReason)
      throw new BadRequestException('A rejection reason is required.');
    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.mailDomainVerificationRequest.updateMany({
        where: {
          id: requestId,
          status: MailDomainVerificationRequestStatus.PENDING,
        },
        data: {
          status: MailDomainVerificationRequestStatus.REJECTED,
          reviewedById: adminId,
          reviewedAt: now,
          rejectionReason,
        },
      });
      if (claimed.count !== 1) {
        throw new ConflictException('This request has already been decided.');
      }
      await tx.mailApp.update({
        where: { id: request.mailAppId },
        data: {
          domainTrustStatus: MailDomainTrustStatus.REJECTED,
          domainVerifiedAt: null,
          domainReviewedById: adminId,
          domainTrustReason: rejectionReason,
        },
      });
      return tx.mailDomainVerificationRequest.findUniqueOrThrow({
        where: { id: requestId },
        include: REQUEST_INCLUDE,
      });
    });
    await this.audit(adminId, 'rejected', updated, rejectionReason);
    return { request: updated };
  }

  async revoke(requestId: string, adminId: string, reason: string) {
    this.flags.requireRuknyVerification();
    const request = await this.requireRequest(requestId);
    if (request.status !== MailDomainVerificationRequestStatus.APPROVED) {
      throw new BadRequestException(
        'Only an approved verification can be revoked.',
      );
    }
    if (request.mailApp.domainTrustStatus !== MailDomainTrustStatus.VERIFIED) {
      throw new ConflictException('This domain is not currently verified.');
    }
    const revokeReason = reason.trim();
    if (!revokeReason)
      throw new BadRequestException('A revocation reason is required.');

    const revoked = await this.prisma.mailApp.updateMany({
      where: {
        id: request.mailAppId,
        domainTrustStatus: MailDomainTrustStatus.VERIFIED,
      },
      data: {
        domainTrustStatus: MailDomainTrustStatus.REVOKED,
        domainVerifiedAt: null,
        domainReviewedById: adminId,
        domainTrustReason: revokeReason,
      },
    });
    if (revoked.count !== 1) {
      throw new ConflictException('This domain is not currently verified.');
    }
    const updated = await this.requireRequest(requestId);
    await this.audit(adminId, 'revoked', updated, revokeReason);
    return { request: updated };
  }

  private async requireOwnedApp(userId: string, publicAppId: string) {
    const app = await this.prisma.mailApp.findUnique({
      where: { appId: publicAppId },
      select: {
        id: true,
        userId: true,
        primaryDomain: true,
        domainStatus: true,
        domainCheckedAt: true,
        domainTrustStatus: true,
      },
    });
    if (!app) throw new NotFoundException('Mail app not found.');
    if (app.userId !== userId)
      throw new ForbiddenException('You do not own this Mail app.');
    return app;
  }

  private async requireRequest(requestId: string) {
    const request = await this.prisma.mailDomainVerificationRequest.findUnique({
      where: { id: requestId },
      include: REQUEST_INCLUDE,
    });
    if (!request)
      throw new NotFoundException('Domain verification request not found.');
    return request;
  }

  private async requirePendingRequest(requestId: string) {
    const request = await this.requireRequest(requestId);
    if (request.status !== MailDomainVerificationRequestStatus.PENDING) {
      throw new ConflictException('This request has already been decided.');
    }
    return request;
  }

  private async audit(
    adminId: string,
    decision: 'approved' | 'rejected' | 'revoked',
    request: Awaited<
      ReturnType<MailDomainVerificationService['requireRequest']>
    >,
    reason?: string,
  ) {
    await this.securityLogs.createLog({
      userId: adminId,
      action: SecurityAction.SECURITY_SETTINGS_CHANGED,
      status: SecurityStatus.SUCCESS,
      description: `Mail domain verification ${decision}: ${request.domain}`,
      metadata: {
        event: 'MAIL_DOMAIN_VERIFICATION_DECISION',
        decision,
        requestId: request.id,
        mailAppId: request.mailApp.appId,
        domain: request.domain,
        reason: reason ?? null,
      },
    });
  }
}
