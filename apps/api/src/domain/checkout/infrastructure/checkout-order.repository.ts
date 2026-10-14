import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';

@Injectable()
export class CheckoutOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAddress(id: string) {
    return this.prisma.addresses.findUnique({ where: { id } });
  }

  claimAddress(id: string, phoneNumber: string, userId: string) {
    return this.prisma.addresses.updateMany({
      where: { id, userId: null, phoneNumber },
      data: { userId },
    });
  }

  attachPayment(
    orderId: string,
    payment: { paymentId: string; paymentToken: string },
  ) {
    return this.prisma.orders.update({
      where: { id: orderId },
      data: {
        paymentId: payment.paymentId,
        paymentToken: payment.paymentToken,
        paymentStatus: 'PENDING',
      },
    });
  }
}
