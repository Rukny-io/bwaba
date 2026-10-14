import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { OrdersService } from '../../stores/orders.service';
import { QasehPaymentService } from '../../../integrations/qaseh-payment/qaseh-payment.service';
import { IdempotencyService } from '../../../shared/services/idempotency.service';
import { CheckoutIdentityRepository } from '../infrastructure/checkout-identity.repository';
import { CheckoutOrderRepository } from '../infrastructure/checkout-order.repository';
import type { CheckoutSessionContext } from '../checkout-session.types';

export interface CheckoutOrderInput {
  items: Array<{ productId: string; quantity: number; variantId?: string }>;
  shippingAddressId?: string;
  paymentMethod?: string;
  notes?: string;
}

@Injectable()
export class CheckoutOrderService {
  private readonly logger = new Logger(CheckoutOrderService.name);

  constructor(
    private readonly orders: OrdersService,
    private readonly qaseh: QasehPaymentService,
    private readonly idempotency: IdempotencyService,
    private readonly identityRepository: CheckoutIdentityRepository,
    private readonly orderRepository: CheckoutOrderRepository,
  ) {}

  async create(
    input: CheckoutOrderInput,
    session: CheckoutSessionContext,
    idempotencyKey?: string,
  ) {
    const phoneNumber = session.phoneNumber;
    const email = session.email;
    const paymentMethod = input.paymentMethod || 'CASH';
    let claimKey: string | undefined;
    let orderCreated = false;

    if (paymentMethod === 'QASEH_CARD') {
      if (!idempotencyKey) {
        throw new ForbiddenException('مطلوب Idempotency-Key لطلبات الدفع الإلكتروني');
      }
      claimKey = await this.idempotency.claim(
        `checkout-order:${session.sessionId || session.userId || phoneNumber || email || 'anonymous'}`,
        idempotencyKey,
      );
    }

    try {
      const userId = await this.resolveUser(session, phoneNumber, email);

      if (input.shippingAddressId) {
        await this.assertAndClaimAddress(
          input.shippingAddressId,
          userId,
          phoneNumber,
        );
      }

      const items = input.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        ...(item.variantId ? { variantId: item.variantId } : {}),
      }));

      if (paymentMethod === 'CASH') {
        await this.orders.assertCashOnDeliveryAllowed(items);
      }

      const order = await this.orders.createDirectMultiItem(userId, {
        addressId: input.shippingAddressId,
        customerNote: input.notes,
        phoneNumber,
        paymentMethod,
        items,
      });
      orderCreated = true;

      if (paymentMethod === 'QASEH_CARD' && this.qaseh.isConfigured()) {
        try {
          const description = `طلب ${order.orderNumber}: ${input.items
            .map((item, i) => `${i + 1}. x${item.quantity}`)
            .join(', ')}`.substring(0, 250);
          const payment = await this.qaseh.createPayment({
            orderId: order.orderNumber,
            amount: Number(order.total),
            currency: order.currency || 'IQD',
            description,
            customData: { rukny_order_id: order.id },
          });
          await this.orderRepository.attachPayment(order.id, {
            paymentId: payment.payment_id,
            paymentToken: payment.token,
          });
          return {
            success: true,
            message: 'تم إنشاء الطلب - يرجى إكمال الدفع',
            orders: [{ ...order, paymentId: payment.payment_id }],
            payment: {
              paymentId: payment.payment_id,
              paymentUrl: this.qaseh.getPaymentPageUrl(payment.token),
              token: payment.token,
            },
          };
        } catch (error) {
          this.logger.error(`Qaseh payment initiation failed for order ${order.id}`, error);
          return {
            success: true,
            message: 'تم إنشاء الطلب لكن فشل بدء الدفع. يمكنك إعادة المحاولة.',
            orders: [order],
            paymentError: true,
          };
        }
      }

      return { success: true, message: 'تم إنشاء الطلب بنجاح', orders: [order] };
    } catch (error) {
      if (claimKey && !orderCreated) await this.idempotency.release(claimKey);
      throw error;
    }
  }

  private async resolveUser(
    session: CheckoutSessionContext,
    phoneNumber?: string,
    email?: string,
  ): Promise<string> {
    if (session.userId) return session.userId;
    const user = phoneNumber
      ? await this.identityRepository.findByPhone(phoneNumber)
      : email
        ? await this.identityRepository.findByEmail(email)
        : null;
    if (user) return user.id;
    if (!phoneNumber && !email) {
      throw new ForbiddenException({
        message: 'يجب التحقق عبر رمز واتساب لإتمام الشراء',
        code: 'CHECKOUT_VERIFICATION_REQUIRED',
      });
    }
    const created = await this.identityRepository.createGuest(phoneNumber, email);
    return created.id;
  }

  private async assertAndClaimAddress(
    addressId: string,
    userId: string,
    phoneNumber?: string,
  ): Promise<void> {
    const address = await this.orderRepository.findAddress(addressId);
    if (!address) throw new ForbiddenException('العنوان غير موجود');
    const owns =
      (!!phoneNumber && address.phoneNumber === phoneNumber) || address.userId === userId;
    if (!owns) throw new ForbiddenException('غير مصرح باستخدام هذا العنوان');
    if (address.userId === null) {
      await this.orderRepository.claimAddress(
        addressId,
        phoneNumber || address.phoneNumber,
        userId,
      );
    }
  }
}
