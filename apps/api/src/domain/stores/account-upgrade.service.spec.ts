import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AccountUpgradeService } from './account-upgrade.service';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { AddressesService } from './addresses.service';
import { WhatsAppBusinessService } from '../../integrations/whatsapp-business/whatsapp-business.service';

describe('AccountUpgradeService', () => {
  const prismaAny = {
    orders: { count: jest.fn(), aggregate: jest.fn() },
    addresses: { count: jest.fn() },
    user: { findFirst: jest.fn(), findUnique: jest.fn() },
    whatsappOtp: {
      updateMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const prisma = prismaAny as unknown as PrismaService;
  const jwtService = {
    sign: jest.fn().mockReturnValue('upgrade-token'),
    verify: jest.fn(),
  } as unknown as JwtService;
  const whatsappBusiness = {
    sendOtp: jest.fn(),
  } as unknown as WhatsAppBusinessService;

  let service: AccountUpgradeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AccountUpgradeService(
      prisma,
      jwtService,
      {} as ConfigService,
      {} as AddressesService,
      whatsappBusiness,
    );
  });

  it('returns masked guest summary without upgrade token', () => {
    expect(service.getMaskedGuestSummary()).toEqual({
      ordersCount: 0,
      addressesCount: 0,
      totalSpent: 0,
      canUpgrade: true,
      requiresVerification: true,
    });
  });

  it('always returns success shape for request-otp', async () => {
    prismaAny.orders.count.mockResolvedValue(0);
    prismaAny.addresses.count.mockResolvedValue(0);
    prismaAny.whatsappOtp.updateMany.mockResolvedValue({ count: 0 });
    prismaAny.whatsappOtp.create.mockResolvedValue({ id: 'otp-1' });

    const result = await service.requestUpgradeOtp('+9647812345678');

    expect(result.success).toBe(true);
    expect(result.otpId).toBe('otp-1');
    expect(whatsappBusiness.sendOtp).not.toHaveBeenCalled();
  });

  it('rejects upgrade without valid upgrade token', async () => {
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid');
    });

    await expect(
      service.upgradeAccount({
        phoneNumber: '+9647812345678',
        email: 'user@example.com',
        password: 'password123',
        upgradeToken: 'bad-token',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects verify-otp when guest data is missing', async () => {
    prismaAny.whatsappOtp.findUnique.mockResolvedValue({
      id: 'otp-1',
      phoneNumber: '+9647812345678',
      type: 'APP_VERIFICATION',
      expiresAt: new Date(Date.now() + 60_000),
      verified: false,
      attempts: 0,
      codeHash: '$2a$12$abcdefghijklmnopqrstuv', // not used — bcrypt mocked below
    });
    prismaAny.whatsappOtp.update.mockResolvedValue({});
    prismaAny.orders.count.mockResolvedValue(0);
    prismaAny.addresses.count.mockResolvedValue(0);

    const bcrypt = require('bcryptjs');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    await expect(
      service.verifyUpgradeOtp({
        phoneNumber: '+9647812345678',
        otpId: 'otp-1',
        code: '123456',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
