import { BadRequestException } from '@nestjs/common';
import { DeveloperEmailPlan, MailAppStatus } from '@prisma/client';
import { MailUnifiedEntitlementService } from './mail-unified-entitlement.service';

describe('MailUnifiedEntitlementService domain quota', () => {
  const prisma = {
    mailApp: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    developerApp: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    developerAppWallet: { create: jest.fn() },
    developerAppProduct: { create: jest.fn() },
    developerEmailDomain: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    developerEmailSender: { deleteMany: jest.fn() },
    developerEmailEntitlement: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };

  const emailEntitlements = {
    ensureEntitlement: jest.fn(),
    reserveLiveSend: jest.fn(),
    getSummary: jest.fn(),
  };

  let service: MailUnifiedEntitlementService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MailUnifiedEntitlementService(
      prisma as never,
      emailEntitlements as never,
    );
  });

  it('blocks a fourth unique domain on the free plan', async () => {
    prisma.mailApp.findFirst.mockResolvedValue({
      id: 'mail-1',
      primaryDomain: null,
    });
    prisma.developerApp.findFirst.mockResolvedValue({ id: 'dev-1' });
    prisma.mailApp.update.mockResolvedValue({});
    emailEntitlements.ensureEntitlement.mockResolvedValue({
      plan: DeveloperEmailPlan.FREE,
      addonDomainsExtra: 0,
    });
    prisma.mailApp.findMany.mockResolvedValue([
      { primaryDomain: 'a.test' },
      { primaryDomain: 'b.test' },
      { primaryDomain: 'c.test' },
    ]);
    prisma.developerEmailDomain.findMany.mockResolvedValue([]);

    await expect(
      service.assertCanAttachDomain('mail-1', 'user-1', 'd.test'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows replacing the current workspace domain without consuming a new slot', async () => {
    prisma.mailApp.findFirst.mockResolvedValue({
      id: 'mail-1',
      primaryDomain: 'old.test',
    });
    prisma.developerApp.findFirst.mockResolvedValue({ id: 'dev-1' });
    prisma.mailApp.update.mockResolvedValue({});
    emailEntitlements.ensureEntitlement.mockResolvedValue({
      plan: DeveloperEmailPlan.FREE,
      addonDomainsExtra: 0,
    });
    prisma.mailApp.findMany.mockResolvedValue([
      { primaryDomain: 'old.test' },
      { primaryDomain: 'b.test' },
      { primaryDomain: 'c.test' },
    ]);
    prisma.developerEmailDomain.findMany.mockResolvedValue([]);

    await expect(
      service.assertCanAttachDomain('mail-1', 'user-1', 'new.test'),
    ).resolves.toBeUndefined();
  });

  it('counts developer email domains and mail workspaces together', async () => {
    prisma.mailApp.findMany.mockResolvedValue([
      { primaryDomain: 'mail.test' },
    ]);
    prisma.developerEmailDomain.findMany.mockResolvedValue([
      { domain: 'api.test' },
    ]);

    const domains = await service.collectAccountDomains('dev-1', 'user-1');
    expect(domains.size).toBe(2);
    expect([...domains].sort()).toEqual(['api.test', 'mail.test']);
  });
});
