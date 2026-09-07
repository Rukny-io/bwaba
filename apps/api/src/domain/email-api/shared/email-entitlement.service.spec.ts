import { HttpException } from '@nestjs/common';
import {
  EMAIL_API_STARTER_MONTHLY_QUOTA,
  EMAIL_API_TRIAL_QUOTA,
  EmailEntitlementService,
} from './email-entitlement.service';

describe('EmailEntitlementService', () => {
  function createService(overrides: Record<string, unknown> = {}) {
    const prisma = {
      developerEmailEntitlement: {
        upsert: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
        ...overrides,
      },
    };
    return { service: new EmailEntitlementService(prisma as any), prisma };
  }

  it('creates a one-time 1,000-message trial and reserves it atomically', async () => {
    const { service, prisma } = createService();
    await expect(service.reserveLiveSend('user_1')).resolves.toBe('trial');
    expect(prisma.developerEmailEntitlement.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ trialQuota: EMAIL_API_TRIAL_QUOTA }),
    }));
  });

  it('uses the paid monthly allocation before trial allocation', async () => {
    const { service, prisma } = createService({
      updateMany: jest.fn().mockResolvedValueOnce({ count: 1 }),
    });
    await expect(service.reserveLiveSend('user_1')).resolves.toBe('monthly');
    expect(prisma.developerEmailEntitlement.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ monthlyUsed: { lt: EMAIL_API_STARTER_MONTHLY_QUOTA } }),
    }));
  });

  it('returns 402 when neither trial nor active monthly quota is available', async () => {
    const { service } = createService({
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    });
    await expect(service.reserveLiveSend('user_1')).rejects.toMatchObject<HttpException>({
      status: 402,
    });
  });
});
