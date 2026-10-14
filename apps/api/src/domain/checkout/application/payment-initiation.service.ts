import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { QasehPaymentService } from '../../../integrations/qaseh-payment/qaseh-payment.service';
import { IdempotencyService } from '../../../shared/services/idempotency.service';
import type { CheckoutSessionContext } from '../checkout-session.types';

@Injectable()
export class PaymentInitiationService {
  private readonly logger = new Logger(PaymentInitiationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly qaseh: QasehPaymentService,
    private readonly idempotency: IdempotencyService,
  ) {}

  async execute(
    orderId: string,
    session: CheckoutSessionContext | undefined,
    idempotencyKey: string,
  ) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        stores: { select: { name: true } },
        order_items: { select: { productName: true, quantity: true } },
      },
    });

    if (!order) throw new NotFoundException('الطلب غير موجود');
    this.assertOwnership(order, session);

    if (order.paymentStatus !== 'UNPAID' && order.paymentStatus !== 'FAILED') {
      throw new BadRequestException('هذا الطلب تم دفعه بالفعل أو قيد المعالجة');
    }

    const claimKey = await this.idempotency.claim(
      `qaseh-initiate:${orderId}`,
      idempotencyKey,
    );
    const description = `طلب ${order.orderNumber} - ${order.stores.name}: ${order.order_items
      .map((item) => `${item.productName} x${item.quantity}`)
      .join(', ')}`.substring(0, 250);

    let paymentCreated = false;
    try {
      const payment = await this.qaseh.createPayment({
        orderId: order.orderNumber,
        amount: Number(order.total),
        currency: order.currency,
        description,
        customData: { rukny_order_id: order.id, store_name: order.stores.name },
      });
      paymentCreated = true;

      await this.prisma.orders.update({
        where: { id: orderId },
        data: {
          paymentId: payment.payment_id,
          paymentToken: payment.token,
          paymentStatus: 'PENDING',
          paymentMethod: 'QASEH_CARD',
        },
      });

      this.logger.log(
        `Payment initiated for order ${order.orderNumber}: ${payment.payment_id}`,
      );
      return {
        success: true,
        paymentId: payment.payment_id,
        paymentUrl: this.qaseh.getPaymentPageUrl(payment.token),
        token: payment.token,
      };
    } catch (error) {
      if (!paymentCreated) await this.idempotency.release(claimKey);
      this.logger.error(`Failed to initiate payment for order ${orderId}`, error);
      throw new BadRequestException('فشل في إنشاء جلسة الدفع. حاول مرة أخرى.');
    }
  }

  private assertOwnership(
    order: { userId: string | null },
    session: CheckoutSessionContext | undefined,
  ): void {
    if (!session?.verified || !session.userId || session.userId !== order.userId) {
      throw new ForbiddenException('غير مصرح بالوصول لهذا الطلب');
    }
  }
}
