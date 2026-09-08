import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  MailDomainStatus,
  MailDomainTrustStatus,
  MailDomainVerificationRequestStatus,
} from '@prisma/client';
import { MailDomainVerificationService } from './mail-domain-verification.service';

describe('MailDomainVerificationService', () => {
  const securityLogs = { createLog: jest.fn().mockResolvedValue(null) };
  const prisma: any = {
    mailApp: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    mailDomainVerificationRequest: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const flags = { requireRuknyVerification: jest.fn() };
  const service = new MailDomainVerificationService(
    prisma,
    securityLogs as never,
    flags as never,
  );

  const pending = {
    id: 'request-1',
    mailAppId: 'internal-app-1',
    requestedById: 'owner-1',
    domain: 'example.com',
    status: MailDomainVerificationRequestStatus.PENDING,
    mailApp: {
      id: 'internal-app-1',
      appId: '1234567890123456',
      primaryDomain: 'example.com',
      domainStatus: MailDomainStatus.ACTIVE,
      domainTrustStatus: MailDomainTrustStatus.PENDING,
    },
  };

  beforeEach(() => {
    for (const model of [prisma.mailApp, prisma.mailDomainVerificationRequest]) {
      for (const candidate of Object.values(model)) {
        (candidate as jest.Mock).mockReset();
      }
    }
    prisma.$transaction.mockReset();
    securityLogs.createLog.mockClear();
    flags.requireRuknyVerification.mockClear();
    securityLogs.createLog.mockResolvedValue(null);
  });

  it('rejects access to another owner app', async () => {
    prisma.mailApp.findUnique.mockResolvedValue({
      id: 'internal-app-1',
      userId: 'other-user',
      primaryDomain: 'example.com',
      domainStatus: MailDomainStatus.ACTIVE,
      domainCheckedAt: new Date(),
    });

    await expect(
      service.listForOwner('owner-1', '1234567890123456'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires current DNS/SES ACTIVE before approval', async () => {
    prisma.mailDomainVerificationRequest.findUnique.mockResolvedValue({
      ...pending,
      mailApp: { ...pending.mailApp, domainStatus: MailDomainStatus.VERIFYING },
    });

    await expect(service.approve(pending.id, 'admin-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('claims a pending request, verifies the app, and audits approval', async () => {
    prisma.mailDomainVerificationRequest.findUnique.mockResolvedValue(pending);
    const updated = {
      ...pending,
      status: MailDomainVerificationRequestStatus.APPROVED,
      mailApp: {
        ...pending.mailApp,
        domainTrustStatus: MailDomainTrustStatus.VERIFIED,
      },
    };
    const tx = {
      mailDomainVerificationRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(updated),
      },
      mailApp: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof tx) => unknown) => callback(tx),
    );

    await expect(service.approve(pending.id, 'admin-1')).resolves.toEqual({
      request: updated,
    });
    expect(tx.mailApp.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          domainTrustStatus: MailDomainTrustStatus.VERIFIED,
          domainReviewedById: 'admin-1',
        }),
      }),
    );
    expect(securityLogs.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        metadata: expect.objectContaining({ decision: 'approved' }),
      }),
    );
  });

  it('does not revoke a non-approved request', async () => {
    prisma.mailDomainVerificationRequest.findUnique.mockResolvedValue(pending);
    await expect(
      service.revoke(pending.id, 'admin-1', 'Policy change'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents deciding an already-decided request', async () => {
    prisma.mailDomainVerificationRequest.findUnique.mockResolvedValue({
      ...pending,
      status: MailDomainVerificationRequestStatus.REJECTED,
    });
    await expect(service.approve(pending.id, 'admin-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('moves an owned active-domain request to PENDING atomically', async () => {
    prisma.mailApp.findUnique.mockResolvedValue({
      id: 'internal-app-1',
      userId: 'owner-1',
      primaryDomain: 'example.com',
      domainStatus: MailDomainStatus.ACTIVE,
      domainCheckedAt: new Date('2026-09-08T12:00:00Z'),
      domainTrustStatus: MailDomainTrustStatus.UNVERIFIED,
    });
    prisma.mailDomainVerificationRequest.findFirst.mockResolvedValue(null);
    const created = { ...pending };
    const tx = {
      mailDomainVerificationRequest: {
        create: jest.fn().mockResolvedValue(created),
      },
      mailApp: { update: jest.fn().mockResolvedValue({}) },
    };
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof tx) => unknown) => callback(tx),
    );

    await expect(
      service.request('owner-1', '1234567890123456'),
    ).resolves.toEqual({ request: created });
    expect(tx.mailApp.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          domainTrustStatus: MailDomainTrustStatus.PENDING,
        }),
      }),
    );
  });

  it('rejects a pending request, records the reason, and audits it', async () => {
    prisma.mailDomainVerificationRequest.findUnique
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce({
        ...pending,
        status: MailDomainVerificationRequestStatus.REJECTED,
        rejectionReason: 'Ownership mismatch',
      });
    const rejected = {
      ...pending,
      status: MailDomainVerificationRequestStatus.REJECTED,
      rejectionReason: 'Ownership mismatch',
    };
    const tx = {
      mailDomainVerificationRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(rejected),
      },
      mailApp: { update: jest.fn().mockResolvedValue({}) },
    };
    prisma.$transaction.mockImplementation(
      (callback: (client: typeof tx) => unknown) => callback(tx),
    );

    await expect(
      service.reject(pending.id, 'admin-1', ' Ownership mismatch '),
    ).resolves.toEqual({ request: rejected });
    expect(tx.mailApp.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          domainTrustStatus: MailDomainTrustStatus.REJECTED,
          domainTrustReason: 'Ownership mismatch',
        }),
      }),
    );
    expect(securityLogs.createLog).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          decision: 'rejected',
          reason: 'Ownership mismatch',
        }),
      }),
    );
  });

  it('revokes only the currently verified app and preserves request history', async () => {
    const approved = {
      ...pending,
      status: MailDomainVerificationRequestStatus.APPROVED,
      mailApp: {
        ...pending.mailApp,
        domainTrustStatus: MailDomainTrustStatus.VERIFIED,
      },
    };
    prisma.mailDomainVerificationRequest.findUnique
      .mockResolvedValueOnce(approved)
      .mockResolvedValueOnce({
        ...approved,
        mailApp: {
          ...approved.mailApp,
          domainTrustStatus: MailDomainTrustStatus.REVOKED,
        },
      });
    prisma.mailApp.updateMany.mockResolvedValue({ count: 1 });

    await service.revoke(pending.id, 'admin-1', 'Certificate expired');
    expect(prisma.mailApp.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          domainTrustStatus: MailDomainTrustStatus.VERIFIED,
        }),
        data: expect.objectContaining({
          domainTrustStatus: MailDomainTrustStatus.REVOKED,
          domainTrustReason: 'Certificate expired',
        }),
      }),
    );
    expect(
      prisma.mailDomainVerificationRequest.updateMany,
    ).not.toHaveBeenCalled();
  });
});
