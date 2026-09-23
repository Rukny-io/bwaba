import { HttpException, HttpStatus } from '@nestjs/common';
import { MailPlan, SubscriptionStatus } from '@prisma/client';
import { MailOutboundUsageService } from './mail-outbound-usage.service';

describe('MailOutboundUsageService', () => {
  const mailAppUuid = 'app-uuid-1';
  const subscriptionId = 'sub-1';

  function makeService(prisma: {
    mailSubscription: {
      findUnique: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
    };
  }) {
    return new MailOutboundUsageService(prisma as never);
  }

  it('getUsageForMailApp returns allowance from included + packs', async () => {
    const prisma = {
      mailSubscription: {
        findUnique: jest.fn().mockResolvedValue({
          id: subscriptionId,
          plan: MailPlan.STARTER,
          status: SubscriptionStatus.ACTIVE,
          outboundUsed: 500,
          outboundPackCredits: 1000,
          currentPeriodStart: new Date('2026-09-01'),
          currentPeriodEnd: new Date('2026-10-01'),
        }),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
    };
    const service = makeService(prisma);
    const usage = await service.getUsageForMailApp(mailAppUuid);
    expect(usage).toMatchObject({
      included: 4_000,
      used: 500,
      packCredits: 1_000,
      allowance: 5_000,
      remaining: 4_500,
      packsAvailable: true,
      packPriceIqd: 800,
    });
  });

  it('reserveOutbound increments when under allowance', async () => {
    const prisma = {
      mailSubscription: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: subscriptionId,
            plan: MailPlan.STARTER,
            status: SubscriptionStatus.ACTIVE,
            outboundUsed: 3998,
            outboundPackCredits: 0,
          })
          .mockResolvedValueOnce({
            id: subscriptionId,
            plan: MailPlan.STARTER,
            status: SubscriptionStatus.ACTIVE,
            outboundUsed: 3998,
            outboundPackCredits: 0,
          }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
      },
    };
    const service = makeService(prisma);
    const result = await service.reserveOutbound(mailAppUuid, 2);
    expect(result.remaining).toBe(0);
    expect(prisma.mailSubscription.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { outboundUsed: { increment: 2 } },
      }),
    );
  });

  it('reserveOutbound throws 402 when quota exhausted', async () => {
    const prisma = {
      mailSubscription: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: subscriptionId,
            plan: MailPlan.STARTER,
            status: SubscriptionStatus.ACTIVE,
            outboundUsed: 4000,
            outboundPackCredits: 0,
          })
          .mockResolvedValueOnce({
            id: subscriptionId,
            plan: MailPlan.STARTER,
            status: SubscriptionStatus.ACTIVE,
            outboundUsed: 4000,
            outboundPackCredits: 0,
          }),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
    };
    const service = makeService(prisma);
    await expect(service.reserveOutbound(mailAppUuid, 1)).rejects.toMatchObject({
      status: HttpStatus.PAYMENT_REQUIRED,
    } as Partial<HttpException>);
    expect(prisma.mailSubscription.updateMany).not.toHaveBeenCalled();
  });

  it('creditPackEmails increments pack credits', async () => {
    const prisma = {
      mailSubscription: {
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const service = makeService(prisma);
    await service.creditPackEmails(subscriptionId, 2000);
    expect(prisma.mailSubscription.update).toHaveBeenCalledWith({
      where: { id: subscriptionId },
      data: { outboundPackCredits: { increment: 2000 } },
    });
  });
});
