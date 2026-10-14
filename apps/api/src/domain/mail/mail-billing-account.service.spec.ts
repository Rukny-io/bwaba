import { BadRequestException } from '@nestjs/common';
import { MailBillingAccountService } from './mail-billing-account.service';

describe('MailBillingAccountService', () => {
  const prisma: any = {
    mailBillingAccount: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    mailApp: { findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
    mailSubscription: { findUnique: jest.fn(), count: jest.fn() },
    mailAppSeatAllocation: { upsert: jest.fn(), findUnique: jest.fn() },
    mailMailbox: { count: jest.fn() },
  };

  it('enforces the shared account mailbox seat limit', async () => {
    const service = new MailBillingAccountService(prisma);
    jest.spyOn(service, 'ensureForApp').mockResolvedValue({
      id: 'account-1',
      ownerUserId: 'owner-1',
      subscription: { status: 'ACTIVE', plan: 'STARTER', mailboxCount: 2 },
    } as any);
    prisma.mailSubscription.count.mockResolvedValue(0);
    prisma.mailAppSeatAllocation.findUnique.mockResolvedValue({
      mailboxSeats: 2,
    });
    prisma.mailMailbox.count.mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    await expect(service.assertMailboxCapacity('app-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('allows replacing an app domain when the current app is the only used slot', async () => {
    const service = new MailBillingAccountService(prisma);
    jest.spyOn(service, 'ensureForApp').mockResolvedValue({
      id: 'account-1',
      ownerUserId: 'owner-1',
      subscription: { status: 'ACTIVE', plan: 'STARTER' },
    } as any);
    prisma.mailSubscription.count.mockResolvedValue(0);
    prisma.mailApp.findUnique.mockResolvedValue({
      primaryDomain: 'old.example',
    });
    prisma.mailApp.count.mockResolvedValue(0);

    await expect(
      service.assertDomainCapacity('app-1', 'new.example'),
    ).resolves.toBeUndefined();
  });
});
