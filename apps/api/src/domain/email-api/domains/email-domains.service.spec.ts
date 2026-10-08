import { ConflictException } from '@nestjs/common';
import { DeveloperEmailDomainStatus, MailAppStatus, MailDomainStatus } from '@prisma/client';
import { EmailDomainsService } from './email-domains.service';

describe('EmailDomainsService', () => {
  const prisma: any = {
    developerEmailDomain: {
      count: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
    developerEmailSender: {
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
    developerApp: {
      findFirst: jest.fn(),
    },
    mailApp: {
      count: jest.fn(),
    },
  };
  const ses = {
    createEmailIdentity: jest.fn(),
    deleteEmailIdentity: jest.fn(),
    getEmailIdentity: jest.fn(),
  };
  const entitlements = {
    ensureEntitlement: jest.fn().mockResolvedValue({
      plan: 'PRO_10K',
      addonDomainsExtra: 0,
    }),
  };

  const service = new EmailDomainsService(
    prisma,
    ses as never,
    entitlements as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.mailApp.count.mockResolvedValue(0);
    prisma.developerEmailDomain.count.mockResolvedValue(0);
    ses.deleteEmailIdentity.mockResolvedValue(undefined);
    ses.createEmailIdentity.mockResolvedValue({
      sending: true,
      dkim: 'SUCCESS',
      tokens: ['a', 'b', 'c'],
    });
  });

  it('create always stores PENDING even when SES is already verified', async () => {
    prisma.developerEmailDomain.count.mockResolvedValue(0);
    prisma.developerEmailDomain.findUnique.mockResolvedValue(null);
    prisma.developerEmailDomain.upsert.mockResolvedValue({
      domain: 'example.com',
      status: DeveloperEmailDomainStatus.PENDING,
      dkimTokens: ['a', 'b', 'c'],
      ownershipToken: 'token',
      ownershipVerifiedAt: null,
      verifiedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const result = await service.create('user-1', 'app-1', 'example.com');

    expect(ses.deleteEmailIdentity).toHaveBeenCalledWith('example.com');
    expect(result.status).toBe('pending');
    expect(prisma.developerEmailDomain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          status: DeveloperEmailDomainStatus.PENDING,
          ownershipToken: expect.any(String),
        }),
      }),
    );
  });

  it('create rejects domains active on Mail', async () => {
    prisma.developerEmailDomain.findUnique.mockResolvedValue(null);
    prisma.mailApp.count.mockResolvedValue(1);

    await expect(
      service.create('user-1', 'app-1', 'example.com'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('verify requires DNS ownership and does not trust SES alone', async () => {
    prisma.developerEmailDomain.findUnique.mockResolvedValue({
      id: 'domain-1',
      userId: 'user-1',
      domain: 'example.com',
      status: DeveloperEmailDomainStatus.PENDING,
      dkimTokens: ['a', 'b', 'c'],
      ownershipToken: 'abc',
      ownershipVerifiedAt: null,
      verifiedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    prisma.developerEmailDomain.update.mockResolvedValue({
      domain: 'example.com',
      status: DeveloperEmailDomainStatus.PENDING,
      dkimTokens: ['a', 'b', 'c'],
      ownershipToken: 'abc',
      ownershipVerifiedAt: null,
      verifiedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    ses.getEmailIdentity.mockResolvedValue({
      found: true,
      sending: true,
      dkim: 'SUCCESS',
      tokens: ['a', 'b', 'c'],
    });

    const result = await service.verify('user-1', 'app-1', 'example.com');

    expect(result.verified).toBe(false);
    expect(prisma.mailApp.count).toHaveBeenCalledWith({
      where: {
        primaryDomain: 'example.com',
        status: MailAppStatus.ACTIVE,
        domainStatus: MailDomainStatus.ACTIVE,
      },
    });
  });

  it('delete removes SES identity', async () => {
    prisma.developerEmailDomain.findUnique.mockResolvedValue({
      id: 'domain-1',
      userId: 'user-1',
    });
    prisma.developerEmailSender.deleteMany.mockResolvedValue({ count: 0 });
    prisma.developerEmailDomain.delete.mockResolvedValue({ id: 'domain-1' });

    await service.delete('user-1', 'app-1', 'example.com');

    expect(ses.deleteEmailIdentity).toHaveBeenCalledWith('example.com');
  });
});
