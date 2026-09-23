/**
 * 💳 Al-Qaseh Payment Gateway - Controller
 *
 * Handles payment initiation, callback, and webhook endpoints.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  Res,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  RawBodyRequest,
  UseGuards,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { QasehPaymentService } from './qaseh-payment.service';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { CheckoutSessionGuard } from '../../core/common/guards/auth/checkout-session.guard';
import { Public } from '../../core/common/decorators/auth/public.decorator';
import { MailSubscriptionsService } from '../../domain/mail/mail-subscriptions.service';
import { DeveloperCheckoutService } from '../../domain/developer/checkout/developer-checkout.service';
import type { QasehPaymentContextResponse } from './qaseh-payment.types';

interface CheckoutSessionContext {
  phoneNumber?: string;
  email?: string;
  storeId?: string;
  sessionId?: string;
  userId?: string;
  type?: string;
  /** True only for OTP-verified checkout sessions or full access tokens. */
  verified?: boolean;
  scope?: string;
}

@ApiTags('Payments - Qaseh')
@Controller('payments/qaseh')
export class QasehPaymentController {
  private readonly logger = new Logger(QasehPaymentController.name);

  constructor(
    private readonly qasehService: QasehPaymentService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => MailSubscriptionsService))
    private readonly mailSubscriptions: MailSubscriptionsService,
    @Inject(forwardRef(() => DeveloperCheckoutService))
    private readonly developerCheckout: DeveloperCheckoutService,
  ) {}

  /**
   * 🔒 F2-01 — Verify that an order belongs to the current checkout session.
   *
   * Ownership is decided SOLELY by the server-issued `userId` (JWT `sub`);
   * client-supplied phone numbers are NEVER trusted for authorization.
   *
   * In addition, the session must be OTP-verified (or a full access token) —
   * a non-verified quick-login "cart" session cannot pay for or read orders.
   * Throws ForbiddenException otherwise to prevent order IDOR.
   */
  private assertOrderOwnership(
    order: { userId: string | null; phoneNumber?: string | null },
    session: CheckoutSessionContext | undefined,
  ): void {
    if (!session) {
      throw new ForbiddenException('غير مصرح بالوصول لهذا الطلب');
    }

    // Reject unverified (cart-only) sessions from touching orders/payments.
    if (!session.verified) {
      throw new ForbiddenException({
        message: 'يجب التحقق عبر رمز واتساب لإتمام الشراء',
        code: 'CHECKOUT_VERIFICATION_REQUIRED',
      });
    }

    const userMatches =
      !!session.userId && !!order.userId && session.userId === order.userId;

    if (!userMatches) {
      throw new ForbiddenException('غير مصرح بالوصول لهذا الطلب');
    }
  }

  /**
   * 💳 Initiate payment for an existing order
   * Called after order is created with paymentMethod = QASEH_CARD
   */
  @Public()
  @Post('initiate/:orderId')
  @UseGuards(CheckoutSessionGuard)
  @ApiOperation({ summary: 'بدء عملية الدفع لطلب موجود' })
  @ApiResponse({ status: 200, description: 'تم إنشاء جلسة الدفع' })
  async initiatePayment(@Param('orderId') orderId: string, @Req() req: any) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        stores: { select: { name: true } },
        order_items: { select: { productName: true, quantity: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    // 🔒 Ensure the order belongs to the caller's checkout session
    this.assertOrderOwnership(order, req.checkoutSession);

    if (order.paymentStatus !== 'UNPAID' && order.paymentStatus !== 'FAILED') {
      throw new BadRequestException('هذا الطلب تم دفعه بالفعل أو قيد المعالجة');
    }

    // Build description from order items
    const itemDescriptions = order.order_items
      .map((item) => `${item.productName} x${item.quantity}`)
      .join(', ');
    const description =
      `طلب ${order.orderNumber} - ${order.stores.name}: ${itemDescriptions}`.substring(
        0,
        250,
      );

    try {
      const payment = await this.qasehService.createPayment({
        orderId: order.orderNumber,
        amount: Number(order.total),
        currency: order.currency,
        description,
        customData: {
          rukny_order_id: order.id,
          store_name: order.stores.name,
        },
      });

      // Update order with payment info
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
        paymentUrl: this.qasehService.getPaymentPageUrl(payment.token),
        token: payment.token,
      };
    } catch (error) {
      this.logger.error(
        `Failed to initiate payment for order ${orderId}:`,
        error,
      );
      throw new BadRequestException('فشل في إنشاء جلسة الدفع. حاول مرة أخرى.');
    }
  }

  /**
   * 🔔 Webhook - Qaseh sends payment status updates here
   * This endpoint must be publicly accessible (no auth guard)
   */
  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Qaseh Webhook - استقبال تحديثات الدفع' })
  async handleWebhook(@Body() body: any, @Req() req: RawBodyRequest<Request>) {
    // 🔒 Verify webhook signature when a secret is configured (fail closed).
    if (!this.qasehService.verifyWebhookSignature(req)) {
      this.logger.warn('Qaseh webhook rejected: invalid signature');
      throw new ForbiddenException('Invalid webhook signature');
    }

    const paymentId = body?.payment_id;
    if (!paymentId) {
      this.logger.warn('Webhook received without payment_id');
      return { status: 'ignored' };
    }

    // 🔒 Avoid logging the full webhook body (may contain PII / payment data)
    this.logger.log(`Qaseh Webhook received for payment_id=${paymentId}`);

    try {
      // Verify payment status with Qaseh API (don't trust webhook body alone)
      const paymentContext =
        await this.qasehService.getPaymentContext(paymentId);

      const mailResult = await this.mailSubscriptions.applyQasehPaymentResult(
        paymentId,
        paymentContext,
      );
      if (mailResult.handled) {
        this.logger.log(
          `Mail payment webhook processed: ${paymentId} → ${mailResult.status}`,
        );
        return { status: 'processed', product: 'mail', result: mailResult.status };
      }

      const developerResult =
        await this.developerCheckout.applyQasehPaymentResult(
          paymentId,
          paymentContext,
        );
      if (developerResult.handled) {
        this.logger.log(
          `Developer payment webhook processed: ${paymentId} → ${developerResult.status}`,
        );
        return {
          status: 'processed',
          product: 'developer',
          result: developerResult.status,
        };
      }

      const storeResult = await this.applyStoreOrderPayment(
        paymentId,
        paymentContext,
      );
      if (storeResult.handled) {
        return { status: 'processed', product: 'store', result: storeResult.status };
      }

      this.logger.warn(`No payment target found for payment_id: ${paymentId}`);
      return { status: 'not_found' };
    } catch (error) {
      this.logger.error(
        `Webhook processing error for payment ${paymentId}:`,
        error,
      );
      throw new InternalServerErrorException('Webhook processing failed');
    }
  }

  /**
   * 🔄 Callback - User is redirected here after payment
   * Qaseh redirects with: ?payment_id=...&order_id=...&status=...
   */
  @Public()
  @Get('callback')
  @ApiOperation({ summary: 'Qaseh Callback - إعادة توجيه العميل بعد الدفع' })
  async handleCallback(
    @Query('payment_id') paymentId: string,
    @Query('order_id') orderId: string,
    @Query('status') status: string,
    @Res() res: Response,
  ) {
    const checkoutUrl =
      this.config.get<string>('CHECKOUT_FRONTEND_URL') ||
      this.config.get<string>('FRONTEND_URL') ||
      'http://localhost:3010';
    const mailUrl =
      this.config.get<string>('MAIL_FRONTEND_URL') ||
      'https://mail.rukny.io';
    const developersUrl = (
      this.config.get<string>('DEVELOPERS_FRONTEND_URL') ||
      'https://developers.rukny.io'
    ).replace(/\/$/, '');

    this.logger.log(
      `Qaseh callback: payment_id=${paymentId}, order_id=${orderId}, status=${status}`,
    );

    if (!paymentId) {
      return res.redirect(`${checkoutUrl}/failed?error=missing_params`);
    }

    try {
      const paymentContext =
        await this.qasehService.getPaymentContext(paymentId);

      const mailPayment =
        await this.mailSubscriptions.findMailPaymentByQasehId(paymentId);
      if (mailPayment) {
        const result = await this.mailSubscriptions.applyQasehPaymentResult(
          paymentId,
          paymentContext,
        );
        const appId =
          (mailPayment.subscription?.mailApp?.appId as string) ||
          String(
            (mailPayment.metadata as Record<string, unknown> | null)?.mailAppId ||
              '',
          );
        const returnTo = appId
          ? `${mailUrl.replace(/\/$/, '')}/apps/${encodeURIComponent(appId)}/open`
          : `${mailUrl.replace(/\/$/, '')}/billing`;
        const invoiceToken = this.mailSubscriptions.buildInvoiceDeliveryToken(
          mailPayment.id,
        );
        const qs = [
          'product=mail',
          `payment=${encodeURIComponent(mailPayment.id)}`,
          appId ? `app=${encodeURIComponent(appId)}` : '',
          `return=${encodeURIComponent(returnTo)}`,
          `invoiceToken=${encodeURIComponent(invoiceToken)}`,
        ]
          .filter(Boolean)
          .join('&');

        // All Mail payments land on checkout result pages (SF-50).
        if (result.status === 'completed' || result.status === 'already_completed') {
          return res.redirect(`${checkoutUrl}/success?${qs}&paid=1`);
        }
        if (result.status === 'pending') {
          return res.redirect(`${checkoutUrl}/pending?${qs}`);
        }
        return res.redirect(
          `${checkoutUrl}/failed?${qs}&status=${encodeURIComponent(result.status)}`,
        );
      }

      const developerPayment =
        await this.developerCheckout.findDeveloperPaymentByQasehId(paymentId);
      if (developerPayment) {
        const result = await this.developerCheckout.applyQasehPaymentResult(
          paymentId,
          paymentContext,
        );
        const returnTo =
          result.returnUrl || `${developersUrl}/settings/platform`;
        const qs = [
          'product=developer',
          `kind=${encodeURIComponent(developerPayment.kind)}`,
          `return=${encodeURIComponent(returnTo)}`,
        ].join('&');

        if (
          result.status === 'completed' ||
          result.status === 'already_completed'
        ) {
          return res.redirect(`${checkoutUrl}/success?${qs}&paid=1`);
        }
        if (result.status === 'pending') {
          return res.redirect(`${checkoutUrl}/pending?${qs}`);
        }
        return res.redirect(
          `${checkoutUrl}/failed?${qs}&status=${encodeURIComponent(result.status)}`,
        );
      }

      const storeResult = await this.applyStoreOrderPayment(
        paymentId,
        paymentContext,
      );
      if (!storeResult.handled || !storeResult.orderNumber) {
        return res.redirect(`${checkoutUrl}/failed?error=order_not_found`);
      }

      if (paymentContext.payment_status === 'succeeded') {
        return res.redirect(
          `${checkoutUrl}/success?orders=${encodeURIComponent(storeResult.orderNumber)}&store=${encodeURIComponent(storeResult.storeSlug || '')}&paid=1`,
        );
      }

      return res.redirect(
        `${checkoutUrl}/failed?order=${encodeURIComponent(storeResult.orderNumber)}&status=${encodeURIComponent(storeResult.status || 'FAILED')}`,
      );
    } catch (error) {
      this.logger.error('Callback processing error:', error);
      return res.redirect(`${checkoutUrl}/failed?error=processing_error`);
    }
  }

  /**
   * Apply Qaseh result to a store order (amount-checked).
   */
  private async applyStoreOrderPayment(
    paymentId: string,
    paymentContext: QasehPaymentContextResponse,
  ): Promise<{
    handled: boolean;
    status?: string;
    orderNumber?: string;
    storeSlug?: string;
  }> {
    const order = await this.prisma.orders.findFirst({
      where: { paymentId },
      include: { stores: { select: { slug: true } } },
    });

    if (!order) {
      return { handled: false };
    }

    if (
      order.paymentStatus === 'PAID' &&
      paymentContext.payment_status === 'succeeded'
    ) {
      return {
        handled: true,
        status: 'PAID',
        orderNumber: order.orderNumber,
        storeSlug: order.stores?.slug,
      };
    }

    const qasehAmount = Number(paymentContext.amount);
    const orderTotal = Number(order.total);
    if (
      Number.isFinite(qasehAmount) &&
      Number.isFinite(orderTotal) &&
      Math.trunc(qasehAmount) !== Math.trunc(orderTotal)
    ) {
      this.logger.error(
        `Store payment amount mismatch for ${order.orderNumber}: qaseh=${qasehAmount} order=${orderTotal}`,
      );
      await this.prisma.orders.update({
        where: { id: order.id },
        data: { paymentStatus: 'FAILED' },
      });
      return {
        handled: true,
        status: 'amount_mismatch',
        orderNumber: order.orderNumber,
        storeSlug: order.stores?.slug,
      };
    }

    const newPaymentStatus = this.mapPaymentStatus(
      paymentContext.payment_status,
    );
    const updateData: Record<string, string> = {
      paymentStatus: newPaymentStatus,
    };

    if (paymentContext.payment_status === 'succeeded') {
      updateData.status = 'CONFIRMED';
    }
    if (
      ['failed', 'declined', 'expired'].includes(paymentContext.payment_status)
    ) {
      updateData.paymentStatus = 'FAILED';
    }

    await this.prisma.orders.updateMany({
      where: {
        id: order.id,
        paymentStatus: { in: ['UNPAID', 'PENDING', 'FAILED'] },
      },
      data: updateData,
    });

    this.logger.log(
      `Order ${order.orderNumber} payment status updated: ${paymentContext.payment_status} → ${newPaymentStatus}`,
    );

    return {
      handled: true,
      status: newPaymentStatus,
      orderNumber: order.orderNumber,
      storeSlug: order.stores?.slug,
    };
  }

  /**
   * 📊 Check payment status for an order
   */
  @Public()
  @Get('status/:orderId')
  @UseGuards(CheckoutSessionGuard)
  @ApiOperation({ summary: 'التحقق من حالة الدفع' })
  async checkPaymentStatus(
    @Param('orderId') orderId: string,
    @Req() req: any,
  ) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        phoneNumber: true,
        orderNumber: true,
        paymentId: true,
        paymentStatus: true,
        paymentMethod: true,
        total: true,
        currency: true,
      },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    // 🔒 Ensure the order belongs to the caller's checkout session
    this.assertOrderOwnership(order, req.checkoutSession);

    // If we have a payment ID, check with Qaseh for latest status
    if (order.paymentId) {
      try {
        const paymentContext = await this.qasehService.getPaymentContext(
          order.paymentId,
        );
        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          qasehStatus: paymentContext.payment_status,
          amount: Number(order.total),
          currency: order.currency,
        };
      } catch {
        // Fall through to return local status
      }
    }

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus,
      amount: Number(order.total),
      currency: order.currency,
    };
  }

  /**
   * Map Qaseh payment status to our OrderPaymentStatus enum
   */
  private mapPaymentStatus(qasehStatus: string): string {
    switch (qasehStatus) {
      case 'succeeded':
        return 'PAID';
      case 'prepared':
      case 'retried':
        return 'PENDING';
      case 'failed':
      case 'declined':
      case 'expired':
      case 'unknown':
        return 'FAILED';
      case 'revoked':
        return 'UNPAID';
      default:
        return 'PENDING';
    }
  }
}
