import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OrderTrackingService } from './order-tracking.service';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { WhatsAppBusinessService } from '../../integrations/whatsapp-business/whatsapp-business.service';
import S3Service from '../../services/s3.service';

describe('OrderTrackingService', () => {
  const prismaAny = {
    orders: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    whatsappOtp: {
      updateMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const prisma = prismaAny as unknown as PrismaService;

  const whatsappBusiness = {
    sendOtp: jest.fn(),
  } as unknown as WhatsAppBusinessService;

  let service: OrderTrackingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrderTrackingService(
      prisma,
      {} as JwtService,
      {} as ConfigService,
      whatsappBusiness,
      {} as S3Service,
    );
  });

  it('rejects OTP requests when no orders exist for the phone number', async () => {
    prismaAny.orders.count.mockResolvedValue(0);

    await expect(
      service.requestTrackingOtp({ phoneNumber: '+9647812345678' }),
    ).rejects.toThrow(NotFoundException);

    expect(prismaAny.orders.count).toHaveBeenCalledWith({
      where: { phoneNumber: '+9647812345678' },
    });
    expect(whatsappBusiness.sendOtp).not.toHaveBeenCalled();
  });

  it('rejects OTP requests when order number does not match phone', async () => {
    prismaAny.orders.count.mockResolvedValue(1);
    prismaAny.orders.findFirst.mockResolvedValue(null);

    await expect(
      service.requestTrackingOtp({
        phoneNumber: '+9647812345678',
        orderNumber: 'ORD-404',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
