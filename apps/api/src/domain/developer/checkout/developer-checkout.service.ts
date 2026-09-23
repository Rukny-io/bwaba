import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { RedisService } from '../../../core/cache/redis.service';
import { QasehPaymentService } from '../../../integrations/qaseh-payment/qaseh-payment.service';
import type { QasehPaymentContextResponse } from '../../../integrations/qaseh-payment/qaseh-payment.types';
import { DEVELOPER_PRO_PRICING } from '../subscriptions/dev-plan-limits.config';
import { DevSubscriptionsService } from '../subscriptions/dev-subscriptions.service';
import { WalletService } from '../wallet/wallet.service';
import { DeveloperCheckoutKind } from './dto/developer-checkout.dto';

const CHECKOUT_SESSION_TTL_SECONDS = 60 * 15;
const CHECKOUT_SESSION_PREFIX = 'developer:checkout:';

type DeveloperCheckoutSessionPayload = {
  sessionId: string;
  userId: string;
  kind: DeveloperCheckoutKind;
  amount: number;
  currency: 'IQD';
  title: string;
  billingCycle?: 'MONTHLY' | 'YEARLY';
  appId?: string | null;
  returnUrl: string;
  createdAt: number;
  expiresAt: number;
  /** WalletTransaction.id or DeveloperPayment.id */
  pendingRecordId?: string | null;
  qasehPaymentId?: string | null;
};

@Injectable()
export class DeveloperCheckoutService {
  private readonly logger = new Logger(DeveloperCheckoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly qaseh: QasehPaymentService,
    private readonly wallet: WalletService,
    private readonly subscriptions: DevSubscriptionsService,
  ) {}

  async createCheckoutSession(
    userId: string,
    input: {
      kind: DeveloperCheckoutKind;
      amount?: number;
      billingCycle?: 'MONTHLY' | 'YEARLY';
      appId?: string;
    },
  ) {
    const kind = input.kind;
    let amount = 0;
    let title = '';
    let billingCycle: 'MONTHLY' | 'YEARLY' | undefined;
    let returnUrl = this.developersReturnUrl('/settings/platform');

    if (kind === DeveloperCheckoutKind.WALLET_TOPUP) {
      amount = Math.trunc(Number(input.amount) || 0);
      if (!Number.isInteger(amount) || amount < 1_000) {
        throw new BadRequestException('Minimum top-up is 1,000 IQD.');
      }
      if (amount > 5_000_000) {
        throw new BadRequestException('Maximum top-up is 5,000,000 IQD.');
      }
      title = `Wallet top-up · ${amount.toLocaleString('en-US')} IQD`;
      returnUrl = input.appId
        ? this.developersReturnUrl(
            `/apps/${encodeURIComponent(input.appId)}/wallet`,
          )
        : this.developersReturnUrl('/settings/platform');
    } else if (kind === DeveloperCheckoutKind.PRO_UPGRADE) {
      billingCycle = input.billingCycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY';
      amount =
        billingCycle === 'YEARLY'
          ? DEVELOPER_PRO_PRICING.yearly
          : DEVELOPER_PRO_PRICING.monthly;
      title =
        billingCycle === 'YEARLY'
          ? 'Developer Pro · yearly'
          : 'Developer Pro · monthly';
      returnUrl = this.developersReturnUrl('/settings/platform');

      const sub = await this.subscriptions.getSubscription(userId);
      if (sub?.plan === 'PRO' || sub?.effectivePlan === 'PRO') {
        throw new ForbiddenException('You are already on the Pro plan.');
      }
    } else {
      throw new BadRequestException('Invalid checkout kind.');
    }

    const sessionId = randomBytes(24).toString('hex');
    const createdAt = Date.now();
    const expiresAt = createdAt + CHECKOUT_SESSION_TTL_SECONDS * 1000;
    const payload: DeveloperCheckoutSessionPayload = {
      sessionId,
      userId,
      kind,
      amount,
      currency: 'IQD',
      title,
      billingCycle,
      appId: input.appId ?? null,
      returnUrl,
      createdAt,
      expiresAt,
    };

    await this.redis.set(
      `${CHECKOUT_SESSION_PREFIX}${sessionId}`,
      payload,
      CHECKOUT_SESSION_TTL_SECONDS,
    );
    const stored = await this.redis.get(
      `${CHECKOUT_SESSION_PREFIX}${sessionId}`,
    );
    if (!stored) {
      throw new HttpException(
        {
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          code: 'DEVELOPER_CHECKOUT_STORE_UNAVAILABLE',
          message: 'Checkout session store is temporarily unavailable.',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const checkoutUrl = `${this.checkoutFrontendUrl()}/?product=developer&session=${encodeURIComponent(sessionId)}`;

    return {
      sessionId,
      checkoutUrl,
      kind,
      amount,
      currency: 'IQD',
      title,
      billingCycle: billingCycle ?? null,
      returnUrl,
      expiresIn: CHECKOUT_SESSION_TTL_SECONDS,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  async getCheckoutSessionPublic(sessionId: string) {
    const session = await this.readCheckoutSession(sessionId);
    return {
      sessionId: session.sessionId,
      product: 'developer' as const,
      kind: session.kind,
      title: session.title,
      amount: session.amount,
      currency: session.currency,
      billingCycle: session.billingCycle ?? null,
      appId: session.appId ?? null,
      returnUrl: session.returnUrl,
      digital: true,
      expiresAt: new Date(session.expiresAt).toISOString(),
      expiresIn: Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000)),
    };
  }

  async payCheckoutSession(
    sessionId: string,
    checkoutSession: {
      verified?: boolean;
      userId?: string;
      phoneNumber?: string;
      email?: string;
    },
  ) {
    if (!checkoutSession?.verified) {
      throw new ForbiddenException({
        code: 'CHECKOUT_NOT_VERIFIED',
        message: 'Verify your phone or email before paying.',
      });
    }
    if (!this.qaseh.isConfigured()) {
      throw new BadRequestException({
        code: 'DEVELOPER_CARD_UNAVAILABLE',
        message: 'Card payments are temporarily unavailable.',
      });
    }

    const session = await this.readCheckoutSession(sessionId);

    // Guest OTP userId ≠ developer account owner — intentional for Checkout.
    // Fulfillment always uses session.userId (the authenticated developer who
    // created the Redis session), never the guest JWT sub.

    let pendingRecordId = session.pendingRecordId ?? null;

    if (pendingRecordId && session.qasehPaymentId) {
      const retry = await this.qaseh.retryPayment(session.qasehPaymentId);
      return {
        success: true,
        paymentId: pendingRecordId,
        qasehPaymentId: session.qasehPaymentId,
        amount: session.amount,
        currency: 'IQD',
        kind: session.kind,
        paymentUrl: this.qaseh.getPaymentPageUrl(retry.token),
      };
    }

    if (pendingRecordId) {
      if (session.kind === DeveloperCheckoutKind.WALLET_TOPUP) {
        const existing = await this.prisma.walletTransaction.findFirst({
          where: { id: pendingRecordId, status: 'PENDING' },
        });
        if (!existing) pendingRecordId = null;
      } else {
        const existing = await this.prisma.developerPayment.findFirst({
          where: { id: pendingRecordId, status: PaymentStatus.PENDING },
        });
        if (!existing) pendingRecordId = null;
      }
    }

    if (!pendingRecordId && session.kind === DeveloperCheckoutKind.WALLET_TOPUP) {
      const wallet = await this.wallet.getWallet(session.userId);
      const tx = await this.prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'TOP_UP',
          amount: session.amount,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance + session.amount,
          status: 'PENDING',
          paymentMethod: 'card',
          description: session.title,
          referenceType: 'payment',
          metadata: {
            product: 'developer',
            kind: session.kind,
            checkoutSessionId: session.sessionId,
            source: 'qaseh_card',
          },
        },
      });
      pendingRecordId = tx.id;
    } else if (!pendingRecordId) {
      const sub = await this.subscriptions.ensureDeveloperSubscription(
        session.userId,
      );
      await this.prisma.developerPayment.updateMany({
        where: {
          subscriptionId: sub.id,
          status: PaymentStatus.PENDING,
          externalId: { not: null },
        },
        data: {
          status: PaymentStatus.FAILED,
          failedAt: new Date(),
          failureReason: 'superseded_by_new_payment',
        },
      });
      const payment = await this.prisma.developerPayment.create({
        data: {
          subscriptionId: sub.id,
          amount: session.amount,
          type: 'SUBSCRIPTION',
          status: PaymentStatus.PENDING,
          paymentMethod: 'card',
          description: session.title,
          metadata: {
            product: 'developer',
            kind: session.kind,
            billingCycle: session.billingCycle,
            checkoutSessionId: session.sessionId,
            source: 'qaseh_card',
          },
        },
      });
      pendingRecordId = payment.id;
    }

    const orderId = `dev_${pendingRecordId.replace(/-/g, '').slice(0, 24)}`;
    try {
      const qasehPayment = await this.qaseh.createPayment({
        orderId,
        amount: session.amount,
        currency: 'IQD',
        description: `Rukny Developers · ${session.title}`.substring(0, 250),
        customerEmail: checkoutSession.email || undefined,
        redirectUrl: this.qasehCallbackUrl(),
        customData: {
          product: 'developer',
          kind: session.kind,
          rukny_developer_session_id: session.sessionId,
          rukny_developer_record_id: pendingRecordId,
          rukny_developer_user_id: session.userId,
          amount_iqd: session.amount,
          billing_cycle: session.billingCycle ?? null,
        },
      });

      if (session.kind === DeveloperCheckoutKind.WALLET_TOPUP) {
        await this.prisma.walletTransaction.update({
          where: { id: pendingRecordId },
          data: {
            externalId: qasehPayment.payment_id,
            referenceId: qasehPayment.payment_id,
          },
        });
      } else {
        await this.prisma.developerPayment.update({
          where: { id: pendingRecordId },
          data: { externalId: qasehPayment.payment_id },
        });
      }

      const remainingSec = Math.max(
        30,
        Math.floor((session.expiresAt - Date.now()) / 1000),
      );
      await this.redis.set(
        `${CHECKOUT_SESSION_PREFIX}${sessionId}`,
        {
          ...session,
          pendingRecordId,
          qasehPaymentId: qasehPayment.payment_id,
          checkoutPhone: checkoutSession.phoneNumber ?? null,
          checkoutEmail: checkoutSession.email ?? null,
        },
        remainingSec,
      );

      return {
        success: true,
        paymentId: pendingRecordId,
        qasehPaymentId: qasehPayment.payment_id,
        amount: session.amount,
        currency: 'IQD',
        kind: session.kind,
        paymentUrl: this.qaseh.getPaymentPageUrl(qasehPayment.token),
      };
    } catch (error) {
      this.logger.error('Developer Qaseh payment initiate failed', error);
      if (session.kind === DeveloperCheckoutKind.WALLET_TOPUP && pendingRecordId) {
        await this.prisma.walletTransaction.update({
          where: { id: pendingRecordId },
          data: { status: 'FAILED' },
        });
      } else if (pendingRecordId) {
        await this.prisma.developerPayment.update({
          where: { id: pendingRecordId },
          data: {
            status: PaymentStatus.FAILED,
            failedAt: new Date(),
            failureReason: 'qaseh_initiate_failed',
          },
        });
      }
      throw new BadRequestException('Could not start card payment.');
    }
  }

  async findDeveloperPaymentByQasehId(qasehPaymentId: string) {
    const walletTx = await this.prisma.walletTransaction.findFirst({
      where: {
        OR: [
          { externalId: qasehPaymentId },
          { referenceId: qasehPaymentId },
        ],
        type: 'TOP_UP',
      },
      include: { wallet: { select: { userId: true } } },
    });
    if (walletTx) {
      return { kind: DeveloperCheckoutKind.WALLET_TOPUP as const, walletTx };
    }

    const payment = await this.prisma.developerPayment.findFirst({
      where: { externalId: qasehPaymentId },
      include: {
        subscription: { select: { id: true, userId: true } },
      },
    });
    if (payment) {
      return { kind: DeveloperCheckoutKind.PRO_UPGRADE as const, payment };
    }
    return null;
  }

  async applyQasehPaymentResult(
    qasehPaymentId: string,
    context: QasehPaymentContextResponse,
  ): Promise<{
    handled: boolean;
    status: string;
    returnUrl?: string;
    kind?: DeveloperCheckoutKind;
  }> {
    const found = await this.findDeveloperPaymentByQasehId(qasehPaymentId);
    if (!found) {
      return { handled: false, status: 'not_found' };
    }

    const qasehAmount = Number(context.amount);
    const expected =
      found.kind === DeveloperCheckoutKind.WALLET_TOPUP
        ? found.walletTx.amount
        : found.payment.amount;

    if (
      Number.isFinite(qasehAmount) &&
      Math.trunc(qasehAmount) !== Math.trunc(expected)
    ) {
      this.logger.error(
        `Developer payment amount mismatch ${qasehPaymentId}: qaseh=${qasehAmount} expected=${expected}`,
      );
      if (found.kind === DeveloperCheckoutKind.WALLET_TOPUP) {
        await this.prisma.walletTransaction.update({
          where: { id: found.walletTx.id },
          data: { status: 'FAILED' },
        });
      } else {
        await this.prisma.developerPayment.update({
          where: { id: found.payment.id },
          data: {
            status: PaymentStatus.FAILED,
            failedAt: new Date(),
            failureReason: 'amount_mismatch',
          },
        });
      }
      return { handled: true, status: 'amount_mismatch', kind: found.kind };
    }

    if (context.payment_status === 'succeeded') {
      if (found.kind === DeveloperCheckoutKind.WALLET_TOPUP) {
        if (found.walletTx.status === 'COMPLETED') {
          return {
            handled: true,
            status: 'already_completed',
            kind: found.kind,
            returnUrl: this.developersReturnUrl('/settings/platform'),
          };
        }
        await this.wallet.verifyTopUp(
          found.walletTx.wallet.userId,
          found.walletTx.id,
        );
        return {
          handled: true,
          status: 'completed',
          kind: found.kind,
          returnUrl: this.developersReturnUrl('/settings/platform'),
        };
      }

      if (found.payment.status === PaymentStatus.COMPLETED) {
        return {
          handled: true,
          status: 'already_completed',
          kind: found.kind,
          returnUrl: this.developersReturnUrl('/settings/platform'),
        };
      }

      const meta = (found.payment.metadata || {}) as Record<string, unknown>;
      const cycle =
        meta.billingCycle === 'YEARLY' ? 'YEARLY' : 'MONTHLY';
      await this.subscriptions.activateProAfterPayment(
        found.payment.subscription.userId,
        found.payment.id,
        cycle,
      );
      return {
        handled: true,
        status: 'completed',
        kind: found.kind,
        returnUrl: this.developersReturnUrl('/settings/platform'),
      };
    }

    if (
      ['failed', 'declined', 'expired', 'revoked'].includes(
        context.payment_status,
      )
    ) {
      if (found.kind === DeveloperCheckoutKind.WALLET_TOPUP) {
        await this.prisma.walletTransaction.update({
          where: { id: found.walletTx.id },
          data: { status: 'FAILED' },
        });
      } else {
        await this.prisma.developerPayment.update({
          where: { id: found.payment.id },
          data: {
            status: PaymentStatus.FAILED,
            failedAt: new Date(),
            failureReason: context.payment_status || 'failed',
          },
        });
      }
      return { handled: true, status: 'failed', kind: found.kind };
    }

    // prepared / retried / duplicated / unknown — still in flight
    return { handled: true, status: 'pending', kind: found.kind };
  }

  private async readCheckoutSession(
    sessionId: string,
  ): Promise<DeveloperCheckoutSessionPayload> {
    if (!sessionId || !/^[a-f0-9]{32,64}$/i.test(sessionId)) {
      throw new BadRequestException({
        code: 'DEVELOPER_CHECKOUT_INVALID',
        message: 'Invalid checkout session.',
      });
    }
    const key = `${CHECKOUT_SESSION_PREFIX}${sessionId}`;
    const raw = await this.redis.get<DeveloperCheckoutSessionPayload | string>(
      key,
    );
    if (!raw) {
      throw new HttpException(
        {
          statusCode: HttpStatus.GONE,
          code: 'DEVELOPER_CHECKOUT_EXPIRED',
          message:
            'This checkout link has expired. Start again from Developers.',
        },
        HttpStatus.GONE,
      );
    }
    const session =
      typeof raw === 'string'
        ? (JSON.parse(raw) as DeveloperCheckoutSessionPayload)
        : raw;
    if (!session?.userId || !session?.kind || !session?.amount) {
      await this.redis.del(key).catch(() => {});
      throw new HttpException(
        {
          statusCode: HttpStatus.GONE,
          code: 'DEVELOPER_CHECKOUT_EXPIRED',
          message:
            'This checkout link has expired. Start again from Developers.',
        },
        HttpStatus.GONE,
      );
    }
    const expiresAt =
      session.expiresAt ||
      session.createdAt + CHECKOUT_SESSION_TTL_SECONDS * 1000;
    if (Date.now() >= expiresAt) {
      await this.redis.del(key).catch(() => {});
      throw new HttpException(
        {
          statusCode: HttpStatus.GONE,
          code: 'DEVELOPER_CHECKOUT_EXPIRED',
          message:
            'This checkout link has expired. Start again from Developers.',
        },
        HttpStatus.GONE,
      );
    }
    return { ...session, expiresAt };
  }

  private checkoutFrontendUrl(): string {
    return (
      this.config.get<string>('CHECKOUT_FRONTEND_URL') ||
      'http://localhost:3010'
    ).replace(/\/$/, '');
  }

  private developersReturnUrl(path: string): string {
    const base = (
      this.config.get<string>('DEVELOPERS_FRONTEND_URL') ||
      this.config.get<string>('NEXT_PUBLIC_DEVELOPERS_URL') ||
      'https://developers.rukny.io'
    ).replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private qasehCallbackUrl(): string {
    return (
      this.config.get<string>('QASEH_REDIRECT_URL') ||
      `${this.config.get<string>('API_PUBLIC_URL') || 'https://api.rukny.io'}/api/v1/payments/qaseh/callback`
    );
  }
}
