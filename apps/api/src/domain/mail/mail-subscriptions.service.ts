import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  BillingCycle,
  MailAppStatus,
  MailDomainStatus,
  MailMailboxStatus,
  MailPlan,
  PaymentStatus,
  SecurityAction,
  SecurityStatus,
  SupportTicketCategory,
  SupportTicketStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { RedisService } from '../../core/cache/redis.service';
import { SupportTicketsService } from '../support-tickets/support-tickets.service';
import { SecurityLogService } from '../../infrastructure/security/log.service';
import { QasehPaymentService } from '../../integrations/qaseh-payment/qaseh-payment.service';
import type { QasehPaymentContextResponse } from '../../integrations/qaseh-payment/qaseh-payment.types';
import { ConfigService } from '@nestjs/config';
import { WhatsAppBusinessService } from '../../integrations/whatsapp-business/whatsapp-business.service';
import { MailAppAccessService } from './mail-app-access.service';
import { MailSesService } from './mail-ses.service';
import {
  MAIL_PLAN_DEFINITIONS,
  MAIL_PLAN_LIMITS,
  MAIL_PLAN_ORDER,
  addOneMonth,
  formatMailAliasLimit,
  mailMonthlyTotal,
  mailPlanHighlights,
} from './mail-plan-limits.config';
import { isMailAppPublicId } from './mail-app-id.util';
import { storageQuotaBytesForPlan } from './mail-storage.util';
import {
  maskEmail,
  maskPhone,
  signMailInvoiceToken,
  verifyMailInvoiceToken,
} from './mail-invoice-token.util';
import { renderMailInvoicePdf } from './mail-invoice-pdf.util';

const OPEN_TICKET_STATUSES: SupportTicketStatus[] = [
  SupportTicketStatus.OPEN,
  SupportTicketStatus.IN_PROGRESS,
  SupportTicketStatus.WAITING_ON_USER,
];

/** Max plan-request attempts per user+app within the window. */
const PLAN_REQUEST_LIMIT_PER_APP = 5;
/** Max plan-request attempts per user across all apps within the window. */
const PLAN_REQUEST_LIMIT_PER_USER = 10;
const PLAN_REQUEST_WINDOW_SECONDS = 60 * 60;
/** Max card-pay initiate attempts per user+app within the window. */
const PLAN_PAY_LIMIT_PER_APP = 8;
const PLAN_PAY_WINDOW_SECONDS = 60 * 60;

/** Redis TTL for mail → checkout bridge sessions (15 minutes). */
const CHECKOUT_SESSION_TTL_SECONDS = 60 * 15;
const CHECKOUT_SESSION_PREFIX = 'mail:checkout:';

type MailCheckoutSessionPayload = {
  sessionId: string;
  userId: string;
  initiatedBy: string;
  appId: string;
  appName: string;
  plan: MailPlan;
  seats: number;
  amount: number;
  planName: string;
  returnUrl: string;
  createdAt: number;
  expiresAt: number;
};

type MailAppRow = {
  id: string;
  appId: string;
  userId: string;
  name: string;
  primaryDomain: string | null;
};

type SubscriptionWithApp = {
  id: string;
  mailAppId: string;
  userId: string;
  plan: MailPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  mailboxCount: number;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  payments?: unknown[];
  mailApp?: {
    appId: string;
    name: string;
    primaryDomain: string | null;
  };
};

@Injectable()
export class MailSubscriptionsService {
  private readonly logger = new Logger(MailSubscriptionsService.name);
  private readonly CACHE_PREFIX = 'mail-sub:app:';
  private readonly CACHE_TTL = 300;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly supportTickets: SupportTicketsService,
    private readonly access: MailAppAccessService,
    private readonly securityLogs: SecurityLogService,
    private readonly qaseh: QasehPaymentService,
    private readonly config: ConfigService,
    private readonly mailSes: MailSesService,
    private readonly whatsappBusiness: WhatsAppBusinessService,
  ) {}

  getPlansOverview() {
    const cardReady = this.qaseh.isConfigured();
    return {
      currency: 'IQD',
      cardPayments: {
        available: cardReady,
        status: cardReady ? ('available' as const) : ('unavailable' as const),
        provider: 'al_qaseh' as const,
      },
      plans: MAIL_PLAN_ORDER.map((id) => {
        const plan = MAIL_PLAN_DEFINITIONS[id];
        return {
          id: plan.id,
          planId: plan.id.toLowerCase(),
          name: plan.name,
          bestFor: plan.bestFor,
          priceMonthly: plan.priceMonthly,
          priceExtraMailbox: plan.priceExtraMailbox,
          priceLabel: `${plan.priceMonthly.toLocaleString('en-IQ')} IQD/mo`,
          priceNote: 'Monthly plan price for included mailboxes. 1-month term.',
          popular: plan.popular,
          limits: plan.limits,
          benefits: plan.benefits,
          highlights: mailPlanHighlights(plan),
        };
      }),
    };
  }

  async getOwnedAppSubscription(userId: string, publicAppId: string) {
    const access = await this.access.requireAccess(userId, publicAppId);
    const app = {
      id: access.app.id,
      appId: access.app.appId,
      userId: access.app.userId,
      name: access.app.name,
      primaryDomain: access.app.primaryDomain,
    } satisfies MailAppRow;
    const { subscription } = await this.getSubscriptionForApp(app.id);
    const pendingRequest = await this.findPendingRequest(app.appId);
    return {
      app: this.toAppView(app),
      subscription,
      pendingRequest,
      canManageBilling: this.access.canManageBilling(access),
      isOwner: access.isOwner,
      role: access.role,
      cardPayments: { available: false, status: 'coming_soon' as const },
    };
  }

  async getActiveLimitsForApp(mailAppUuid: string) {
    const cached = await this.redis
      .get(`${this.CACHE_PREFIX}${mailAppUuid}`)
      .catch(() => null);
    if (cached) {
      try {
        return JSON.parse(cached) as ReturnType<
          MailSubscriptionsService['limitsPayload']
        >;
      } catch {
        /* fall through */
      }
    }

    const { subscription } = await this.getSubscriptionForApp(mailAppUuid);
    if (!subscription || subscription.status !== 'ACTIVE') {
      return null;
    }

    const payload = this.limitsPayload(subscription);
    await this.redis
      .set(
        `${this.CACHE_PREFIX}${mailAppUuid}`,
        JSON.stringify(payload),
        this.CACHE_TTL,
      )
      .catch(() => {});
    return payload;
  }

  async requestPlan(
    userId: string,
    publicAppId: string,
    plan: MailPlan,
    mailboxCount: number,
  ) {
    const { app, access } = await this.requireBillingApp(userId, publicAppId);
    await this.assertPlanRequestRateLimit(userId, app.appId);

    const seats = this.normalizeSeats(mailboxCount);
    const existing = await this.findPendingRequest(app.appId);
    if (existing) {
      await this.auditPlanRequest(userId, app, {
        outcome: 'already_pending',
        plan,
        mailboxCount: seats,
        ticketNumber: existing.ticketNumber,
        role: String(access.role),
      });
      return {
        alreadyPending: true,
        ticket: existing,
      };
    }

    const monthlyTotal = mailMonthlyTotal(plan, seats);
    const planName = MAIL_PLAN_DEFINITIONS[plan].name;
    const subject = `طلب اشتراك Mail: ${planName} · ${seats} مقاعد`;
    const description = [
      'طلب تفعيل اشتراك لتطبيق البريد هذا فقط (ليس لكل التطبيقات).',
      '',
      `التطبيق: ${app.name}`,
      `معرّف التطبيق: ${app.appId}`,
      `الباقة: ${planName}`,
      `عدد المقاعد: ${seats}`,
      `المجموع الشهري: ${monthlyTotal.toLocaleString('en-IQ')} IQD`,
      '',
      'يمكنك الدفع بالبطاقة من صفحة الفوترة، أو الانتظار حتى يفعّل المسؤول الطلب.',
      '',
      'Mail plan request for this app only (not shared across the user’s other apps).',
      `App: ${app.name} (${app.appId})`,
      `Plan: ${planName} · seats: ${seats} · ${monthlyTotal.toLocaleString('en-IQ')} IQD/mo`,
      'Card payment is available from Billing, or an admin can activate this ticket.',
    ].join('\n');

    const ticket = await this.supportTickets.createTicket(userId, {
      subject,
      description,
      category: SupportTicketCategory.BILLING,
      context: {
        kind: 'mail_subscription',
        product: 'mail',
        locale: 'ar',
        mailAppId: app.appId,
        mailAppName: app.name,
        mailPlan: plan,
        mailboxCount: seats,
        monthlyTotal,
      },
    });

    await this.auditPlanRequest(userId, app, {
      outcome: 'created',
      plan,
      mailboxCount: seats,
      ticketNumber: ticket.number,
      ticketId: ticket.id,
      monthlyTotal,
      role: String(access.role),
    });

    return {
      alreadyPending: false,
      ticket: {
        ticketId: ticket.id,
        ticketNumber: ticket.number,
        plan,
        mailboxCount: seats,
        monthlyTotal,
        createdAt: new Date().toISOString(),
      },
    };
  }

  /**
   * After DNS is verified: do NOT auto-activate Starter for free.
   * Returns a checkout URL so the owner pays via apps/checkout first.
   */
  async provisionStarterAfterDomainVerified(userId: string, publicAppId: string) {
    const app = await this.prisma.mailApp.findFirst({
      where: { userId, appId: publicAppId, status: MailAppStatus.ACTIVE },
      include: { subscription: true },
    });
    if (!app) {
      throw new NotFoundException('Mail app not found.');
    }
    if (app.domainStatus !== MailDomainStatus.ACTIVE) {
      throw new BadRequestException(
        'Verify domain DNS before Starter can start.',
      );
    }
    if (app.subscription?.status === SubscriptionStatus.ACTIVE) {
      return { alreadyActive: true as const, needsCheckout: false as const };
    }

    const seats = MAIL_PLAN_LIMITS.STARTER.mailboxesIncluded;
    const session = await this.createCheckoutSession(
      userId,
      publicAppId,
      MailPlan.STARTER,
      seats,
    );
    return {
      alreadyActive: false as const,
      needsCheckout: true as const,
      checkoutUrl: session.checkoutUrl,
      sessionId: session.sessionId,
    };
  }

  /**
   * Create a short-lived Mail checkout session (Redis) and return the
   * apps/checkout URL. Used for Starter + paid upgrades — no free passage.
   */
  async createCheckoutSession(
    userId: string,
    publicAppId: string,
    plan: MailPlan,
    mailboxCount: number,
  ) {
    const { app } = await this.requireBillingApp(userId, publicAppId);
    const seats = this.normalizeSeats(mailboxCount);
    const amount = mailMonthlyTotal(plan, seats);
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('Invalid plan amount.');
    }

    const sessionId = randomBytes(24).toString('hex');
    const planName = MAIL_PLAN_DEFINITIONS[plan].name;
    const returnUrl = this.mailReturnUrl(app.appId);
    const createdAt = Date.now();
    const expiresAt = createdAt + CHECKOUT_SESSION_TTL_SECONDS * 1000;
    const payload: MailCheckoutSessionPayload = {
      sessionId,
      userId: app.userId,
      initiatedBy: userId,
      appId: app.appId,
      appName: app.name,
      plan,
      seats,
      amount,
      planName,
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
          code: 'MAIL_CHECKOUT_STORE_UNAVAILABLE',
          message: 'Checkout session store is temporarily unavailable.',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const checkoutBase = this.checkoutFrontendUrl();
    // Only session id in the URL — never trust client-supplied price/plan/seats.
    const checkoutUrl = `${checkoutBase}/?product=mail&session=${encodeURIComponent(sessionId)}`;

    return {
      sessionId,
      checkoutUrl,
      amount,
      currency: 'IQD',
      plan,
      planName,
      mailboxCount: seats,
      appId: app.appId,
      appName: app.name,
      returnUrl,
      expiresIn: CHECKOUT_SESSION_TTL_SECONDS,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  /** Public preview for checkout UI (no secrets). */
  async getCheckoutSessionPublic(sessionId: string) {
    const session = await this.readCheckoutSession(sessionId);
    const expiresAt =
      session.expiresAt ||
      session.createdAt + CHECKOUT_SESSION_TTL_SECONDS * 1000;
    return {
      sessionId: session.sessionId,
      product: 'mail' as const,
      plan: session.plan,
      planName: session.planName,
      mailboxCount: session.seats,
      amount: session.amount,
      currency: 'IQD',
      appId: session.appId,
      appName: session.appName,
      returnUrl: session.returnUrl,
      digital: true,
      expiresAt: new Date(expiresAt).toISOString(),
      expiresIn: Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)),
    };
  }

  /**
   * Pay a Mail checkout session after checkout OTP verification.
   * Uses the session owner (mail billing user), not the guest checkout userId.
   */
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

    const session = await this.readCheckoutSession(sessionId);

    // Guest OTP on checkout.rukny.io creates a different user than the Mail
    // billing owner who started the session — that is intentional. Always bill
    // / activate using the session owner (initiatedBy), never the guest sub.
    const result = await this.initiateCardPayment(
      session.initiatedBy || session.userId,
      session.appId,
      session.plan,
      session.seats,
      {
        checkoutPhone: checkoutSession.phoneNumber ?? null,
        checkoutEmail: checkoutSession.email ?? null,
      },
    );

    const remainingSec = Math.max(
      30,
      Math.floor(((session.expiresAt || Date.now()) - Date.now()) / 1000),
    );
    // Keep session until payment settles — do not extend past original expiry.
    await this.redis.set(
      `${CHECKOUT_SESSION_PREFIX}${sessionId}`,
      {
        ...session,
        paymentId: result.paymentId,
        qasehPaymentId: result.qasehPaymentId,
        paidViaCheckout: true,
        checkoutUserId: checkoutSession.userId ?? null,
        checkoutPhone: checkoutSession.phoneNumber ?? null,
        checkoutEmail: checkoutSession.email ?? null,
      },
      remainingSec,
    );

    return result;
  }

  private async readCheckoutSession(
    sessionId: string,
  ): Promise<MailCheckoutSessionPayload> {
    if (!sessionId || !/^[a-f0-9]{32,64}$/i.test(sessionId)) {
      throw new BadRequestException({
        code: 'MAIL_CHECKOUT_INVALID',
        message: 'Invalid checkout session.',
      });
    }
    const key = `${CHECKOUT_SESSION_PREFIX}${sessionId}`;
    const raw = await this.redis.get<MailCheckoutSessionPayload | string>(key);
    if (!raw) {
      throw new HttpException(
        {
          statusCode: HttpStatus.GONE,
          code: 'MAIL_CHECKOUT_EXPIRED',
          message:
            'This checkout link has expired. Start again from Mail billing.',
        },
        HttpStatus.GONE,
      );
    }
    const session =
      typeof raw === 'string'
        ? (JSON.parse(raw) as MailCheckoutSessionPayload)
        : raw;
    if (!session?.appId || !session?.plan || !session?.userId) {
      await this.redis.del(key).catch(() => {});
      throw new HttpException(
        {
          statusCode: HttpStatus.GONE,
          code: 'MAIL_CHECKOUT_EXPIRED',
          message:
            'This checkout link has expired. Start again from Mail billing.',
        },
        HttpStatus.GONE,
      );
    }

    const expiresAt =
      session.expiresAt ||
      (session.createdAt
        ? session.createdAt + CHECKOUT_SESSION_TTL_SECONDS * 1000
        : 0);
    if (!expiresAt || Date.now() >= expiresAt) {
      await this.redis.del(key).catch(() => {});
      throw new HttpException(
        {
          statusCode: HttpStatus.GONE,
          code: 'MAIL_CHECKOUT_EXPIRED',
          message:
            'This checkout link has expired. Start again from Mail billing.',
        },
        HttpStatus.GONE,
      );
    }

    return {
      ...session,
      expiresAt,
    };
  }

  private checkoutFrontendUrl(): string {
    return (
      this.config.get<string>('CHECKOUT_FRONTEND_URL') ||
      'http://localhost:3010'
    ).replace(/\/$/, '');
  }

  private mailReturnUrl(publicAppId: string): string {
    const mailBase = (
      this.config.get<string>('MAIL_FRONTEND_URL') || 'https://mail.rukny.io'
    ).replace(/\/$/, '');
    return `${mailBase}/apps/${encodeURIComponent(publicAppId)}/open`;
  }

  async adminActivateForApp(
    adminId: string,
    publicAppId: string,
    plan: MailPlan,
    mailboxCount: number,
    billingCycle: BillingCycle = BillingCycle.MONTHLY,
    ticketId?: string,
  ) {
    const app = await this.requireAppByPublicId(publicAppId);
    const seats = this.normalizeSeats(mailboxCount);

    const usedSeats = await this.prisma.mailMailbox.count({
      where: {
        mailAppId: app.id,
        status: MailMailboxStatus.ACTIVE,
      },
    });
    if (seats < usedSeats) {
      throw new BadRequestException(
        `This Mail app already has ${usedSeats} active mailbox${usedSeats === 1 ? '' : 'es'}. Seats cannot be lower.`,
      );
    }

    if (ticketId) {
      await this.assertMailPlanTicket(ticketId, app);
    }

    const result = await this.upsertForApp(app, plan, seats, billingCycle, {
      source: 'admin_activation',
      adminId,
      ticketId: ticketId ?? null,
    });

    await this.securityLogs
      .createLog({
        userId: adminId,
        action: SecurityAction.SECURITY_SETTINGS_CHANGED,
        status: SecurityStatus.SUCCESS,
        description: `Mail plan activated for ${app.name}`,
        metadata: {
          event: 'MAIL_SUBSCRIPTION_ACTIVATED',
          mailAppId: app.appId,
          mailAppName: app.name,
          plan,
          mailboxCount: seats,
          billingCycle,
          ticketId: ticketId ?? null,
        },
      })
      .catch(() => {});

    if (ticketId) {
      const ticket = await this.prisma.supportTicket.findUnique({
        where: { id: ticketId },
        select: { status: true },
      });
      if (
        ticket &&
        ticket.status !== SupportTicketStatus.RESOLVED &&
        ticket.status !== SupportTicketStatus.CLOSED
      ) {
        const planName = MAIL_PLAN_DEFINITIONS[plan].name;
        const limits = MAIL_PLAN_LIMITS[plan];
        await this.supportTickets.resolveWithStaffReply(
          adminId,
          ticketId,
          [
            `تم تفعيل اشتراك البريد لتطبيق «${app.name}» فقط.`,
            '',
            `الباقة: ${planName}`,
            `المقاعد: ${seats}`,
            `التخزين: ${limits.storageGbPerMailbox} غيغابايت للبريد`,
            `التحويل: ${limits.forwardingRules} · الأسماء المستعارة: ${formatMailAliasLimit(limits.emailAliases, 'ar')} لكل صندوق`,
            `المجموع الشهري: ${mailMonthlyTotal(plan, seats).toLocaleString('en-IQ')} IQD`,
            '',
            `Mail plan activated for app “${app.name}” only (not shared with other apps).`,
            `${planName} · ${seats} seat${seats === 1 ? '' : 's'} · ${limits.storageGbPerMailbox} GB for emails.`,
          ].join('\n'),
        );
      }
    }

    return result;
  }

  async adminListUserApps(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('User not found.');

    const apps = await this.prisma.mailApp.findMany({
      where: { userId, status: MailAppStatus.ACTIVE },
      include: { subscription: true },
      orderBy: { slotIndex: 'asc' },
    });

    return {
      apps: apps.map((app) => ({
        ...this.toAppView(app),
        subscription: app.subscription
          ? this.toView({
              ...app.subscription,
              mailApp: {
                appId: app.appId,
                name: app.name,
                primaryDomain: app.primaryDomain,
              },
            })
          : null,
      })),
    };
  }

  private async getSubscriptionForApp(mailAppUuid: string) {
    const subscription = await this.prisma.mailSubscription.findUnique({
      where: { mailAppId: mailAppUuid },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        mailApp: {
          select: { appId: true, name: true, primaryDomain: true },
        },
      },
    });

    if (!subscription) {
      return { subscription: null };
    }

    if (
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.currentPeriodEnd &&
      subscription.currentPeriodEnd.getTime() < Date.now()
    ) {
      const expired = await this.prisma.mailSubscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.EXPIRED },
        include: {
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          mailApp: {
            select: { appId: true, name: true, primaryDomain: true },
          },
        },
      });
      await this.invalidateCache(mailAppUuid);
      return { subscription: this.toView(expired) };
    }

    return { subscription: this.toView(subscription) };
  }

  /**
   * Initiate Al-Qaseh card payment for a Mail plan (JWT + billing role).
   * Amount is computed server-side only; never trust client totals.
   */
  async initiateCardPayment(
    userId: string,
    publicAppId: string,
    plan: MailPlan,
    mailboxCount: number,
    checkoutContact?: {
      checkoutPhone?: string | null;
      checkoutEmail?: string | null;
    },
  ) {
    if (!this.qaseh.isConfigured()) {
      throw new BadRequestException({
        code: 'MAIL_CARD_UNAVAILABLE',
        message: 'Card payments are temporarily unavailable.',
      });
    }

    const { app, access } = await this.requireBillingApp(userId, publicAppId);
    const seats = this.normalizeSeats(mailboxCount);
    await this.assertPayRateLimit(userId, app.appId);

    const usedSeats = await this.prisma.mailMailbox.count({
      where: {
        mailAppId: app.id,
        status: MailMailboxStatus.ACTIVE,
      },
    });
    if (seats < usedSeats) {
      throw new BadRequestException(
        `This Mail app already has ${usedSeats} active mailbox${usedSeats === 1 ? '' : 'es'}. Seats cannot be lower.`,
      );
    }

    const amount = mailMonthlyTotal(plan, seats);
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('Invalid plan amount.');
    }

    const planName = MAIL_PLAN_DEFINITIONS[plan].name;
    const billingCycle = BillingCycle.MONTHLY;

    // Ensure a subscription row exists to attach the PENDING payment.
    let subscription = await this.prisma.mailSubscription.findUnique({
      where: { mailAppId: app.id },
    });
    if (!subscription) {
      subscription = await this.prisma.mailSubscription.create({
        data: {
          mailAppId: app.id,
          userId: app.userId,
          plan,
          status: SubscriptionStatus.EXPIRED,
          billingCycle,
          mailboxCount: seats,
        },
      });
    }

    // Expire stale pending card attempts for this subscription.
    await this.prisma.mailSubscriptionPayment.updateMany({
      where: {
        subscriptionId: subscription.id,
        status: PaymentStatus.PENDING,
        paymentId: { not: null },
      },
      data: {
        status: PaymentStatus.FAILED,
        failedAt: new Date(),
        failureReason: 'superseded_by_new_payment',
      },
    });

    const checkoutPhone =
      typeof checkoutContact?.checkoutPhone === 'string' &&
      checkoutContact.checkoutPhone.trim()
        ? checkoutContact.checkoutPhone.trim()
        : null;
    const rawCheckoutEmail =
      typeof checkoutContact?.checkoutEmail === 'string' &&
      checkoutContact.checkoutEmail.trim()
        ? checkoutContact.checkoutEmail.trim().toLowerCase()
        : null;
    const checkoutEmail =
      rawCheckoutEmail && !rawCheckoutEmail.endsWith('@guest.rukny.io')
        ? rawCheckoutEmail
        : null;

    const payment = await this.prisma.mailSubscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        amount,
        billingCycle,
        mailboxCount: seats,
        status: PaymentStatus.PENDING,
        metadata: {
          product: 'mail',
          plan,
          mailAppId: app.appId,
          mailAppUuid: app.id,
          initiatedBy: userId,
          role: String(access.role),
          source: 'qaseh_card',
          ...(checkoutPhone ? { checkoutPhone } : {}),
          ...(checkoutEmail ? { checkoutEmail } : {}),
        },
      },
    });

    const orderId = `mail_${payment.id.replace(/-/g, '').slice(0, 24)}`;
    const description =
      `Rukny Mail · ${planName} · ${seats} seats · ${app.name}`.substring(
        0,
        250,
      );

    try {
      const qasehPayment = await this.qaseh.createPayment({
        orderId,
        amount,
        currency: 'IQD',
        description,
        redirectUrl: this.qasehCallbackUrl(),
        customData: {
          product: 'mail',
          rukny_mail_payment_id: payment.id,
          rukny_mail_app_id: app.appId,
          plan,
          mailbox_count: seats,
          amount_iqd: amount,
        },
      });

      await this.prisma.mailSubscriptionPayment.update({
        where: { id: payment.id },
        data: {
          paymentId: qasehPayment.payment_id,
          paymentToken: qasehPayment.token,
          metadata: {
            product: 'mail',
            plan,
            mailAppId: app.appId,
            mailAppUuid: app.id,
            initiatedBy: userId,
            role: String(access.role),
            source: 'qaseh_card',
            qasehOrderId: orderId,
            ...(checkoutPhone ? { checkoutPhone } : {}),
            ...(checkoutEmail ? { checkoutEmail } : {}),
          },
        },
      });

      await this.securityLogs
        .createLog({
          userId,
          action: SecurityAction.SECURITY_SETTINGS_CHANGED,
          status: SecurityStatus.SUCCESS,
          description: `Mail card payment initiated for ${app.name}`,
          metadata: {
            event: 'MAIL_CARD_PAYMENT_INITIATED',
            mailAppId: app.appId,
            plan,
            mailboxCount: seats,
            amount,
            paymentRowId: payment.id,
            paymentId: qasehPayment.payment_id,
          },
        })
        .catch(() => {});

      return {
        success: true,
        paymentId: payment.id,
        qasehPaymentId: qasehPayment.payment_id,
        amount,
        currency: 'IQD',
        plan,
        mailboxCount: seats,
        paymentUrl: this.qaseh.getPaymentPageUrl(qasehPayment.token),
      };
    } catch {
      await this.prisma.mailSubscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failedAt: new Date(),
          failureReason: 'qaseh_create_failed',
        },
      });
      throw new BadRequestException({
        code: 'MAIL_CARD_CREATE_FAILED',
        message: 'Could not start card payment. Please try again.',
      });
    }
  }

  async getCardPaymentStatus(userId: string, publicAppId: string, paymentRowId: string) {
    const { app } = await this.requireBillingApp(userId, publicAppId);
    const payment = await this.prisma.mailSubscriptionPayment.findFirst({
      where: {
        id: paymentRowId,
        subscription: { mailAppId: app.id },
      },
      include: {
        subscription: {
          select: { plan: true, mailboxCount: true, status: true },
        },
      },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }

    let qasehStatus: string | undefined;
    if (payment.paymentId) {
      try {
        const ctx = await this.qaseh.getPaymentContext(payment.paymentId);
        qasehStatus = ctx.payment_status;
        // Opportunistically sync if webhook lagged
        if (
          payment.status === PaymentStatus.PENDING &&
          (ctx.payment_status === 'succeeded' ||
            ['failed', 'declined', 'expired'].includes(ctx.payment_status))
        ) {
          await this.applyQasehPaymentResult(payment.paymentId, ctx);
          const refreshed = await this.prisma.mailSubscriptionPayment.findUnique({
            where: { id: payment.id },
          });
          return {
            paymentId: payment.id,
            status: refreshed?.status ?? payment.status,
            amount: payment.amount,
            currency: 'IQD',
            qasehStatus,
            plan: this.asRecord(payment.metadata).plan ?? null,
            mailboxCount: payment.mailboxCount,
          };
        }
      } catch {
        // keep local status
      }
    }

    return {
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: 'IQD',
      qasehStatus,
      plan: this.asRecord(payment.metadata).plan ?? null,
      mailboxCount: payment.mailboxCount,
    };
  }

  /**
   * Issue (or re-download) a PDF invoice for a completed Mail subscription payment.
   */
  async issuePaymentInvoice(
    userId: string,
    publicAppId: string,
    paymentRowId: string,
  ): Promise<{ buffer: Buffer; filename: string; invoiceNumber: string }> {
    const access = await this.access.requireAccess(userId, publicAppId);
    const payment = await this.prisma.mailSubscriptionPayment.findFirst({
      where: {
        id: paymentRowId,
        subscription: { mailAppId: access.app.id },
      },
      select: { id: true },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }
    return this.buildCompletedPaymentInvoice(payment.id, { issuedBy: userId });
  }

  /**
   * Issue a PDF invoice for the current ACTIVE subscription period
   * (useful when admin-activated and no card payment row exists yet).
   */
  async issueCurrentPeriodInvoice(
    userId: string,
    publicAppId: string,
  ): Promise<{ buffer: Buffer; filename: string; invoiceNumber: string }> {
    const access = await this.access.requireAccess(userId, publicAppId);
    const subscription = await this.prisma.mailSubscription.findUnique({
      where: { mailAppId: access.app.id },
      include: {
        payments: {
          where: { status: PaymentStatus.COMPLETED },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        mailApp: {
          select: {
            appId: true,
            name: true,
            primaryDomain: true,
            contactEmail: true,
          },
        },
      },
    });
    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(
        'No active subscription to invoice for this workspace.',
      );
    }

    const latest = subscription.payments[0];
    if (latest) {
      return this.issuePaymentInvoice(userId, publicAppId, latest.id);
    }

    const planDef = MAIL_PLAN_DEFINITIONS[subscription.plan];
    const amount = mailMonthlyTotal(
      subscription.plan,
      subscription.mailboxCount,
    );
    const periodStart = subscription.currentPeriodStart || subscription.createdAt;
    const periodEnd =
      subscription.currentPeriodEnd || addOneMonth(periodStart);
    const invoiceNumber = this.buildInvoiceNumber(
      subscription.id,
      periodStart,
    );

    const buffer = await renderMailInvoicePdf({
      invoiceNumber,
      issuedAt: new Date(),
      workspaceName: subscription.mailApp.name,
      workspaceDomain: subscription.mailApp.primaryDomain,
      contactEmail: subscription.mailApp.contactEmail,
      planName: planDef.name,
      billingCycle: subscription.billingCycle,
      mailboxCount: subscription.mailboxCount,
      amountIqd: amount,
      periodStart,
      periodEnd,
      paidAt: null,
      qasehPaymentId: null,
      paymentRowId: null,
      status: 'ACTIVE',
      note: 'Issued from active subscription (no card payment on file).',
    });

    return {
      buffer,
      filename: `rukny-mail-invoice-${invoiceNumber}.pdf`,
      invoiceNumber,
    };
  }

  private buildInvoiceNumber(seedId: string, when: Date): string {
    const y = when.getUTCFullYear();
    const m = String(when.getUTCMonth() + 1).padStart(2, '0');
    const short = seedId.replace(/-/g, '').slice(0, 8).toUpperCase();
    return `RM-${y}${m}-${short}`;
  }

  private formatIqd(amount: number): string {
    return `${new Intl.NumberFormat('en-IQ').format(Math.max(0, Math.floor(amount)))} IQD`;
  }

  private invoiceLinkSecret(): string {
    const secret =
      this.config.get<string>('MAIL_INVOICE_LINK_SECRET') ||
      this.config.get<string>('INTERNAL_API_SECRET') ||
      this.config.get<string>('JWT_SECRET');

    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'MAIL_INVOICE_LINK_SECRET (or INTERNAL_API_SECRET / JWT_SECRET) must be set in production',
        );
      }
      return 'mail-invoice-dev-secret';
    }

    return secret;
  }

  private apiPublicBase(): string {
    return (
      this.config.get<string>('API_PUBLIC_URL') ||
      'https://api.rukny.io'
    ).replace(/\/$/, '');
  }

  buildInvoiceDownloadUrl(paymentRowId: string): string {
    const token = signMailInvoiceToken(paymentRowId, this.invoiceLinkSecret());
    return `${this.apiPublicBase()}/api/v1/mail/invoices/download?token=${encodeURIComponent(token)}`;
  }

  buildInvoiceDeliveryToken(paymentRowId: string): string {
    return signMailInvoiceToken(paymentRowId, this.invoiceLinkSecret());
  }

  async downloadInvoiceByToken(token: string): Promise<{
    buffer: Buffer;
    filename: string;
    invoiceNumber: string;
  }> {
    const payload = verifyMailInvoiceToken(token, this.invoiceLinkSecret());
    if (!payload) {
      throw new BadRequestException('Invalid or expired invoice link.');
    }
    return this.buildCompletedPaymentInvoice(payload.paymentId, {
      issuedBy: 'token',
    });
  }

  async getInvoiceDeliveryStatusByToken(paymentRowId: string, token: string) {
    const payload = verifyMailInvoiceToken(token, this.invoiceLinkSecret());
    if (!payload || payload.paymentId !== paymentRowId) {
      throw new BadRequestException('Invalid or expired invoice link.');
    }
    const payment = await this.prisma.mailSubscriptionPayment.findUnique({
      where: { id: paymentRowId },
      select: {
        id: true,
        status: true,
        amount: true,
        mailboxCount: true,
        metadata: true,
        subscription: {
          select: {
            mailApp: { select: { name: true, contactEmail: true } },
          },
        },
      },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }
    const meta = this.asRecord(payment.metadata);
    const emailTo =
      (typeof meta.checkoutEmail === 'string' && meta.checkoutEmail) ||
      payment.subscription.mailApp.contactEmail ||
      null;
    const phone =
      typeof meta.checkoutPhone === 'string' ? meta.checkoutPhone : null;
    const invoiceNumber =
      typeof meta.invoiceNumber === 'string' ? meta.invoiceNumber : null;

    return {
      paymentId: payment.id,
      paymentStatus: payment.status,
      status: payment.status,
      amount: payment.amount,
      mailboxCount: payment.mailboxCount,
      appName: payment.subscription.mailApp.name,
      invoiceNumber,
      deliveredAt:
        typeof meta.invoiceDeliveredAt === 'string'
          ? meta.invoiceDeliveredAt
          : null,
      emailStatus:
        typeof meta.invoiceEmailStatus === 'string'
          ? meta.invoiceEmailStatus
          : payment.status === PaymentStatus.COMPLETED
            ? 'pending'
            : 'waiting',
      whatsappStatus:
        typeof meta.invoiceWhatsappStatus === 'string'
          ? meta.invoiceWhatsappStatus
          : payment.status === PaymentStatus.COMPLETED
            ? 'pending'
            : 'waiting',
      emailMasked: emailTo ? maskEmail(emailTo) : null,
      phoneMasked: phone ? maskPhone(phone) : null,
      downloadUrl:
        payment.status === PaymentStatus.COMPLETED
          ? this.buildInvoiceDownloadUrl(payment.id)
          : null,
    };
  }

  async getPublicPaymentStatusByToken(paymentRowId: string, token: string) {
    const payload = verifyMailInvoiceToken(token, this.invoiceLinkSecret());
    if (!payload || payload.paymentId !== paymentRowId) {
      throw new BadRequestException('Invalid or expired invoice link.');
    }
    const payment = await this.prisma.mailSubscriptionPayment.findUnique({
      where: { id: paymentRowId },
      select: {
        id: true,
        status: true,
        amount: true,
        mailboxCount: true,
        paymentId: true,
        metadata: true,
        subscription: {
          select: { mailApp: { select: { appId: true, name: true } } },
        },
      },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }
    return {
      paymentId: payment.id,
      paymentStatus: payment.status,
      amount: payment.amount,
      mailboxCount: payment.mailboxCount,
      appId: payment.subscription.mailApp.appId,
      appName: payment.subscription.mailApp.name,
      qasehPaymentId: payment.paymentId,
    };
  }

  /**
   * Deliver invoice by email + WhatsApp after payment (idempotent unless force).
   */
  async deliverPaymentInvoice(
    paymentRowId: string,
    options?: {
      force?: boolean;
      channels?: Array<'email' | 'whatsapp'>;
      triggeredBy?: string;
    },
  ): Promise<{
    invoiceNumber: string;
    emailStatus: string;
    whatsappStatus: string;
    downloadUrl: string;
  }> {
    const channels = options?.channels?.length
      ? options.channels
      : (['email', 'whatsapp'] as const);
    const force = Boolean(options?.force);

    const payment = await this.prisma.mailSubscriptionPayment.findUnique({
      where: { id: paymentRowId },
      include: {
        subscription: {
          select: {
            plan: true,
            mailboxCount: true,
            billingCycle: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            mailApp: {
              select: {
                id: true,
                appId: true,
                userId: true,
                name: true,
                primaryDomain: true,
                contactEmail: true,
                user: { select: { email: true } },
              },
            },
          },
        },
      },
    });
    if (!payment || payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        'Invoice delivery requires a completed payment.',
      );
    }

    const meta = this.asRecord(payment.metadata);
    if (!force && typeof meta.invoiceDeliveredAt === 'string') {
      return {
        invoiceNumber: String(meta.invoiceNumber || ''),
        emailStatus: String(meta.invoiceEmailStatus || 'skipped'),
        whatsappStatus: String(meta.invoiceWhatsappStatus || 'skipped'),
        downloadUrl: this.buildInvoiceDownloadUrl(payment.id),
      };
    }

    const built = await this.buildCompletedPaymentInvoice(payment.id, {
      issuedBy: options?.triggeredBy || 'system',
    });
    const downloadUrl = this.buildInvoiceDownloadUrl(payment.id);
    const app = payment.subscription.mailApp;
    const planFromMeta =
      typeof meta.plan === 'string' ? meta.plan.toUpperCase() : null;
    const plan =
      (planFromMeta && planFromMeta in MAIL_PLAN_DEFINITIONS
        ? (planFromMeta as MailPlan)
        : null) || payment.subscription.plan;
    const planDef = MAIL_PLAN_DEFINITIONS[plan];

    const emailToRaw =
      (typeof meta.checkoutEmail === 'string' && meta.checkoutEmail.trim()) ||
      app.contactEmail ||
      app.user?.email ||
      null;
    const emailTo =
      emailToRaw && !String(emailToRaw).toLowerCase().endsWith('@guest.rukny.io')
        ? String(emailToRaw).trim()
        : null;
    const phone =
      typeof meta.checkoutPhone === 'string' && meta.checkoutPhone.trim()
        ? meta.checkoutPhone.trim()
        : null;

    let emailStatus = 'skipped';
    let whatsappStatus = 'skipped';

    if (channels.includes('email')) {
      if (!emailTo) {
        emailStatus = 'no_recipient';
      } else if (!this.mailSes.isConfigured()) {
        emailStatus = 'disabled';
      } else {
        try {
          await this.sendInvoiceEmailViaSes({
            to: emailTo,
            invoiceNumber: built.invoiceNumber,
            appName: app.name,
            planName: planDef.name,
            mailboxCount: payment.mailboxCount,
            amountIqd: payment.amount,
            pdfBuffer: built.buffer,
            filename: built.filename,
            downloadUrl,
          });
          emailStatus = 'sent';
        } catch (err) {
          emailStatus = `failed:${err instanceof Error ? err.message : 'error'}`;
          this.logger.warn(`Mail invoice email failed: ${emailStatus}`);
        }
      }
    }

    if (channels.includes('whatsapp')) {
      if (!phone) {
        whatsappStatus = 'no_recipient';
      } else if (!this.whatsappBusiness.isEnabled()) {
        whatsappStatus = 'disabled';
      } else {
        try {
          const caption = `Rukny Mail invoice ${built.invoiceNumber}\n${app.name} · ${this.formatIqd(payment.amount)}`;
          const result = await this.whatsappBusiness.sendInvoiceDocument(phone, {
            pdfBuffer: built.buffer,
            filename: built.filename,
            caption,
            fallbackLink: downloadUrl,
          });
          whatsappStatus = result.via === 'document' ? 'sent' : 'sent_link';
        } catch (err) {
          whatsappStatus = `failed:${err instanceof Error ? err.message : 'error'}`;
          this.logger.warn(`Mail invoice WhatsApp failed: ${whatsappStatus}`);
        }
      }
    }

    const latestMeta = this.asRecord(
      (
        await this.prisma.mailSubscriptionPayment.findUnique({
          where: { id: payment.id },
          select: { metadata: true },
        })
      )?.metadata,
    );

    await this.prisma.mailSubscriptionPayment.update({
      where: { id: payment.id },
      data: {
        metadata: {
          ...latestMeta,
          invoiceNumber: built.invoiceNumber,
          invoiceDeliveredAt: new Date().toISOString(),
          invoiceEmailStatus: emailStatus,
          invoiceWhatsappStatus: whatsappStatus,
          ...(force
            ? { invoiceResentAt: new Date().toISOString() }
            : {}),
        },
      },
    });

    return {
      invoiceNumber: built.invoiceNumber,
      emailStatus,
      whatsappStatus,
      downloadUrl,
    };
  }

  private billingFromAddress(): { email: string; name: string } {
    const raw =
      this.config.get<string>('MAIL_BILLING_FROM')?.trim() ||
      this.config.get<string>('MAIL_SYSTEM_FROM')?.trim() ||
      'billing@rukny.io';
    const match = raw.match(/^(.*?)\s*<([^>]+)>$/);
    if (match) {
      return {
        name: match[1].replace(/"/g, '').trim() || 'Rukny Mail',
        email: match[2].trim(),
      };
    }
    return { email: raw, name: 'Rukny Mail' };
  }

  private async sendInvoiceEmailViaSes(options: {
    to: string;
    invoiceNumber: string;
    appName: string;
    planName: string;
    mailboxCount: number;
    amountIqd: number;
    pdfBuffer: Buffer;
    filename: string;
    downloadUrl?: string;
  }): Promise<void> {
    const from = this.billingFromAddress();
    const amountLabel = this.formatIqd(options.amountIqd);
    const seatsLabel =
      options.mailboxCount === 1
        ? '1 mailbox seat'
        : `${options.mailboxCount} mailbox seats`;
    const downloadBlock = options.downloadUrl
      ? `<p style="margin:24px 0 0;"><a href="${options.downloadUrl}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#1D1D1D;color:#fff;text-decoration:none;font-size:14px;font-weight:500;">Download invoice</a></p>`
      : '';

    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;color:#1D1D1D;line-height:1.5;max-width:560px;margin:0 auto;padding:24px;">
        <p style="margin:0 0 8px;font-size:13px;color:#6B6F76;">Rukny Mail</p>
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:500;">Your invoice</h1>
        <p style="margin:0 0 20px;font-size:15px;color:#6B6F76;">
          Invoice <strong style="color:#1D1D1D;">${options.invoiceNumber}</strong>
          for workspace “${options.appName}” is attached as a PDF.
        </p>
        <div style="border:1px solid #E8E8E8;border-radius:16px;padding:16px;background:#FAFAFA;">
          <p style="margin:0 0 8px;font-size:14px;"><strong>Plan:</strong> ${options.planName}</p>
          <p style="margin:0 0 8px;font-size:14px;"><strong>Seats:</strong> ${seatsLabel}</p>
          <p style="margin:0;font-size:14px;"><strong>Amount:</strong> ${amountLabel}</p>
        </div>
        ${downloadBlock}
        <p style="margin:28px 0 0;font-size:12px;color:#9CA3AF;">Sent by Rukny Mail billing.</p>
      </div>
    `;

    const domain = from.email.split('@')[1] || 'rukny.io';
    const messageIdHeader = `<mail-invoice-${options.invoiceNumber.toLowerCase().replace(/[^a-z0-9-]/g, '')}@${domain}>`;

    await this.mailSes.sendEmail({
      from: from.email,
      fromName: from.name,
      to: [options.to],
      subject: `Rukny Mail invoice ${options.invoiceNumber}`,
      bodyHtml: html,
      bodyText: `Rukny Mail invoice ${options.invoiceNumber} for ${options.appName}. Plan: ${options.planName}. Seats: ${seatsLabel}. Amount: ${amountLabel}.${options.downloadUrl ? ` Download: ${options.downloadUrl}` : ''}`,
      messageIdHeader,
      configurationSetName:
        this.config.get<string>('EMAIL_SES_CONFIGURATION_SET')?.trim() ||
        undefined,
      attachments: [
        {
          filename: options.filename || `${options.invoiceNumber}.pdf`,
          contentType: 'application/pdf',
          content: options.pdfBuffer,
        },
      ],
    });
  }

  async sendPaymentInvoiceForUser(
    userId: string,
    publicAppId: string,
    paymentRowId: string,
    channels?: Array<'email' | 'whatsapp'>,
  ) {
    const { app } = await this.requireBillingApp(userId, publicAppId);
    const payment = await this.prisma.mailSubscriptionPayment.findFirst({
      where: {
        id: paymentRowId,
        subscription: { mailAppId: app.id },
        status: PaymentStatus.COMPLETED,
      },
      select: { id: true },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }
    return this.deliverPaymentInvoice(payment.id, {
      force: true,
      channels,
      triggeredBy: userId,
    });
  }

  private async buildCompletedPaymentInvoice(
    paymentRowId: string,
    opts: { issuedBy: string },
  ): Promise<{ buffer: Buffer; filename: string; invoiceNumber: string }> {
    const payment = await this.prisma.mailSubscriptionPayment.findUnique({
      where: { id: paymentRowId },
      include: {
        subscription: {
          select: {
            plan: true,
            mailboxCount: true,
            billingCycle: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            mailApp: {
              select: {
                appId: true,
                name: true,
                primaryDomain: true,
                contactEmail: true,
              },
            },
          },
        },
      },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        'Invoices can only be issued for completed payments.',
      );
    }

    const meta = this.asRecord(payment.metadata);
    const planFromMeta =
      typeof meta.plan === 'string' ? meta.plan.toUpperCase() : null;
    const plan =
      (planFromMeta && planFromMeta in MAIL_PLAN_DEFINITIONS
        ? (planFromMeta as MailPlan)
        : null) || payment.subscription.plan;
    const planDef = MAIL_PLAN_DEFINITIONS[plan];
    const invoiceNumber =
      (typeof meta.invoiceNumber === 'string' && meta.invoiceNumber) ||
      this.buildInvoiceNumber(payment.id, payment.paidAt || payment.createdAt);

    if (!meta.invoiceNumber) {
      await this.prisma.mailSubscriptionPayment.update({
        where: { id: payment.id },
        data: {
          metadata: {
            ...meta,
            invoiceNumber,
            invoiceIssuedAt: new Date().toISOString(),
            invoiceIssuedBy: opts.issuedBy,
          },
        },
      });
    }

    const app = payment.subscription.mailApp;
    const periodStart =
      payment.subscription.currentPeriodStart ||
      payment.paidAt ||
      payment.createdAt;
    const periodEnd =
      payment.subscription.currentPeriodEnd ||
      addOneMonth(
        periodStart instanceof Date ? periodStart : new Date(periodStart),
      );

    const buffer = await renderMailInvoicePdf({
      invoiceNumber,
      issuedAt: new Date(),
      workspaceName: app.name,
      workspaceDomain: app.primaryDomain,
      contactEmail: app.contactEmail,
      planName: planDef.name,
      billingCycle: payment.billingCycle,
      mailboxCount: payment.mailboxCount,
      amountIqd: payment.amount,
      periodStart:
        periodStart instanceof Date ? periodStart : new Date(periodStart),
      periodEnd: periodEnd instanceof Date ? periodEnd : new Date(periodEnd),
      paidAt: payment.paidAt,
      qasehPaymentId: payment.paymentId,
      paymentRowId: payment.id,
      status: payment.status,
    });

    return {
      buffer,
      filename: `rukny-mail-invoice-${invoiceNumber}.pdf`,
      invoiceNumber,
    };
  }

  /**
   * Authoritative webhook/callback handler for Mail Qaseh payments.
   * Verifies amount + status via Qaseh context; never trusts redirect query alone.
   */
  async applyQasehPaymentResult(
    paymentId: string,
    context: QasehPaymentContextResponse,
  ): Promise<{ handled: boolean; status: string }> {
    const payment = await this.prisma.mailSubscriptionPayment.findFirst({
      where: { paymentId },
      include: {
        subscription: {
          include: {
            mailApp: {
              select: {
                id: true,
                appId: true,
                userId: true,
                name: true,
                primaryDomain: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return { handled: false, status: 'not_found' };
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      void this.deliverPaymentInvoice(payment.id).catch((err) => {
        this.logger.warn(
          `Invoice delivery (already_completed) failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      });
      return { handled: true, status: 'already_completed' };
    }

    const meta = this.asRecord(payment.metadata);
    const planRaw = String(meta.plan || '');
    const plan = (Object.values(MailPlan) as string[]).includes(planRaw)
      ? (planRaw as MailPlan)
      : null;

    const qasehAmount = Number(context.amount);
    if (
      !Number.isFinite(qasehAmount) ||
      Math.trunc(qasehAmount) !== payment.amount
    ) {
      await this.prisma.mailSubscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failedAt: new Date(),
          failureReason: 'amount_mismatch',
          metadata: {
            ...meta,
            qasehAmount,
            expectedAmount: payment.amount,
          },
        },
      });
      return { handled: true, status: 'amount_mismatch' };
    }

    const currency = String(context.currency || '').toUpperCase();
    if (currency && currency !== 'IQD') {
      await this.prisma.mailSubscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failedAt: new Date(),
          failureReason: 'currency_mismatch',
        },
      });
      return { handled: true, status: 'currency_mismatch' };
    }

    if (['failed', 'declined', 'expired', 'revoked'].includes(context.payment_status)) {
      await this.prisma.mailSubscriptionPayment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.FAILED,
          failedAt: new Date(),
          failureReason: context.payment_status,
        },
      });
      return { handled: true, status: 'failed' };
    }

    if (context.payment_status !== 'succeeded') {
      return { handled: true, status: 'pending' };
    }

    if (!plan) {
      await this.prisma.mailSubscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failedAt: new Date(),
          failureReason: 'missing_plan_metadata',
        },
      });
      return { handled: true, status: 'invalid_metadata' };
    }

    const seats = payment.mailboxCount;
    const app = payment.subscription.mailApp;
    const now = new Date();
    const periodEnd = addOneMonth(now);

    await this.prisma.$transaction(async (tx) => {
      const current = await tx.mailSubscriptionPayment.findUnique({
        where: { id: payment.id },
      });
      if (!current || current.status === PaymentStatus.COMPLETED) {
        return;
      }

      await tx.mailSubscription.update({
        where: { id: payment.subscriptionId },
        data: {
          userId: app.userId,
          plan,
          status: SubscriptionStatus.ACTIVE,
          billingCycle: payment.billingCycle,
          mailboxCount: seats,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelledAt: null,
        },
      });

      await tx.mailSubscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          paidAt: now,
          failedAt: null,
          failureReason: null,
          metadata: {
            ...meta,
            plan,
            activatedAt: now.toISOString(),
            qasehPaymentStatus: context.payment_status,
            source: 'qaseh_card',
          },
        },
      });
    });

    await this.invalidateCache(app.id);

    await this.securityLogs
      .createLog({
        userId: app.userId,
        action: SecurityAction.SECURITY_SETTINGS_CHANGED,
        status: SecurityStatus.SUCCESS,
        description: `Mail card payment completed for ${app.name}`,
        metadata: {
          event: 'MAIL_CARD_PAYMENT_COMPLETED',
          mailAppId: app.appId,
          plan,
          mailboxCount: seats,
          amount: payment.amount,
          paymentId,
          paymentRowId: payment.id,
        },
      })
      .catch(() => {});

    void this.deliverPaymentInvoice(payment.id).catch((err) => {
      this.logger.warn(
        `Invoice delivery failed after payment ${payment.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    });

    return { handled: true, status: 'completed' };
  }

  findMailPaymentByQasehId(paymentId: string) {
    return this.prisma.mailSubscriptionPayment.findFirst({
      where: { paymentId },
      select: {
        id: true,
        status: true,
        amount: true,
        mailboxCount: true,
        metadata: true,
        subscription: {
          select: {
            mailApp: { select: { appId: true } },
          },
        },
      },
    });
  }

  private qasehCallbackUrl(): string {
    return (
      this.config.get<string>('QASEH_REDIRECT_URL') ||
      `${this.config.get<string>('API_PUBLIC_URL') || 'https://api.rukny.io'}/api/v1/payments/qaseh/callback`
    );
  }

  private async assertPayRateLimit(userId: string, publicAppId: string) {
    const key = `mail:pay:${userId}:${publicAppId}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, PLAN_PAY_WINDOW_SECONDS);
    }
    if (count > PLAN_PAY_LIMIT_PER_APP) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: 'MAIL_PAY_RATE_LIMIT',
          message: 'Too many payment attempts. Please wait and try again.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async upsertForApp(
    app: MailAppRow,
    plan: MailPlan,
    seats: number,
    billingCycle: BillingCycle,
    paymentMeta: Record<string, unknown>,
  ) {
    const now = new Date();
    const periodEnd = addOneMonth(now);
    const amount = mailMonthlyTotal(plan, seats);

    const subscription = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.mailSubscription.findUnique({
        where: { mailAppId: app.id },
      });

      const saved = existing
        ? await tx.mailSubscription.update({
            where: { mailAppId: app.id },
            data: {
              userId: app.userId,
              plan,
              status: SubscriptionStatus.ACTIVE,
              billingCycle,
              mailboxCount: seats,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              cancelledAt: null,
            },
          })
        : await tx.mailSubscription.create({
            data: {
              mailAppId: app.id,
              userId: app.userId,
              plan,
              status: SubscriptionStatus.ACTIVE,
              billingCycle,
              mailboxCount: seats,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
            },
          });

      await tx.mailSubscriptionPayment.create({
        data: {
          subscriptionId: saved.id,
          amount,
          billingCycle,
          mailboxCount: seats,
          status: PaymentStatus.COMPLETED,
          paidAt: now,
          metadata: {
            ...paymentMeta,
            plan,
          },
        },
      });

      return tx.mailSubscription.findUniqueOrThrow({
        where: { id: saved.id },
        include: {
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          mailApp: {
            select: { appId: true, name: true, primaryDomain: true },
          },
        },
      });
    });

    await this.invalidateCache(app.id);
    return { subscription: this.toView(subscription) };
  }

  private async assertMailPlanTicket(ticketId: string, app: MailAppRow) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found.');
    }
    if (ticket.category !== SupportTicketCategory.BILLING) {
      throw new BadRequestException('Ticket is not a billing request.');
    }
    const context = this.asRecord(ticket.context);
    if (context.kind !== 'mail_subscription') {
      throw new BadRequestException('Ticket is not a Mail plan request.');
    }
    if (context.mailAppId !== app.appId) {
      throw new BadRequestException(
        'Ticket is for a different Mail app.',
      );
    }
  }

  private async findPendingRequest(publicAppId: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: {
        category: SupportTicketCategory.BILLING,
        status: { in: OPEN_TICKET_STATUSES },
        AND: [
          { context: { path: ['kind'], equals: 'mail_subscription' } },
          { context: { path: ['mailAppId'], equals: publicAppId } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!ticket) return null;

    const context = this.asRecord(ticket.context);
    const plan = typeof context.mailPlan === 'string' ? context.mailPlan : null;
    const mailboxCount =
      typeof context.mailboxCount === 'number' ? context.mailboxCount : 1;
    return {
      ticketId: ticket.id,
      ticketNumber: ticket.number,
      plan,
      mailboxCount,
      monthlyTotal:
        typeof context.monthlyTotal === 'number' ? context.monthlyTotal : null,
      createdAt: ticket.createdAt.toISOString(),
    };
  }

  private async assertPlanRequestRateLimit(userId: string, publicAppId: string) {
    const appKey = `mail:sub-request:app:${userId}:${publicAppId}`;
    const userKey = `mail:sub-request:user:${userId}`;

    const [appCount, userCount] = await Promise.all([
      this.redis.incr(appKey),
      this.redis.incr(userKey),
    ]);

    if (appCount === 1) {
      await this.redis.expire(appKey, PLAN_REQUEST_WINDOW_SECONDS).catch(() => {});
    }
    if (userCount === 1) {
      await this.redis.expire(userKey, PLAN_REQUEST_WINDOW_SECONDS).catch(() => {});
    }

    if (
      appCount > PLAN_REQUEST_LIMIT_PER_APP ||
      userCount > PLAN_REQUEST_LIMIT_PER_USER
    ) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          code: 'MAIL_PLAN_REQUEST_RATE_LIMITED',
          message:
            'Too many plan requests. Please wait before submitting another request.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async auditPlanRequest(
    userId: string,
    app: MailAppRow,
    meta: {
      outcome: 'created' | 'already_pending';
      plan: MailPlan;
      mailboxCount: number;
      ticketNumber: string;
      ticketId?: string;
      monthlyTotal?: number;
      role: string;
    },
  ) {
    await this.securityLogs
      .createLog({
        userId,
        action: SecurityAction.SECURITY_SETTINGS_CHANGED,
        status: SecurityStatus.SUCCESS,
        description:
          meta.outcome === 'created'
            ? `Mail plan request created for ${app.name}`
            : `Mail plan request already pending for ${app.name}`,
        metadata: {
          event: 'MAIL_SUBSCRIPTION_REQUEST',
          outcome: meta.outcome,
          mailAppId: app.appId,
          mailAppName: app.name,
          plan: meta.plan,
          mailboxCount: meta.mailboxCount,
          ticketNumber: meta.ticketNumber,
          ticketId: meta.ticketId ?? null,
          monthlyTotal: meta.monthlyTotal ?? null,
          role: meta.role,
        },
      })
      .catch(() => {});
  }

  private async requireBillingApp(userId: string, publicAppId: string) {
    const access = await this.access.requireAccess(userId, publicAppId);
    if (!this.access.canManageBilling(access)) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAIL_BILLING_REQUIRED',
        message: 'Only the owner, admin, or billing role can manage this plan.',
      });
    }
    return {
      access,
      app: {
        id: access.app.id,
        appId: access.app.appId,
        userId: access.app.userId,
        name: access.app.name,
        primaryDomain: access.app.primaryDomain,
      } satisfies MailAppRow,
    };
  }

  private async requireAppByPublicId(publicAppId: string): Promise<MailAppRow> {
    if (!isMailAppPublicId(publicAppId)) {
      throw new BadRequestException('Invalid Mail app id.');
    }
    const app = await this.prisma.mailApp.findFirst({
      where: { appId: publicAppId, status: MailAppStatus.ACTIVE },
      select: {
        id: true,
        appId: true,
        userId: true,
        name: true,
        primaryDomain: true,
      },
    });
    if (!app) {
      throw new NotFoundException('Mail app not found.');
    }
    return app;
  }

  private normalizeSeats(mailboxCount: number) {
    const seats = Math.max(1, Math.floor(mailboxCount));
    if (seats > 500) {
      throw new BadRequestException('Mailbox count must be between 1 and 500.');
    }
    return seats;
  }

  private limitsPayload(subscription: {
    plan: MailPlan;
    planId: string;
    mailboxCount: number;
    limits: (typeof MAIL_PLAN_LIMITS)[MailPlan];
    storageQuotaBytesPerMailbox: number;
  }) {
    return {
      planId: subscription.planId,
      plan: subscription.plan,
      mailboxCount: subscription.mailboxCount,
      limits: subscription.limits,
      storageQuotaBytesPerMailbox: subscription.storageQuotaBytesPerMailbox,
    };
  }

  private toAppView(app: MailAppRow) {
    return {
      appId: app.appId,
      name: app.name,
      primaryDomain: app.primaryDomain,
    };
  }

  private toView(subscription: SubscriptionWithApp) {
    const def = MAIL_PLAN_DEFINITIONS[subscription.plan];
    const limits = MAIL_PLAN_LIMITS[subscription.plan];
    const storageQuotaBytesPerMailbox = storageQuotaBytesForPlan(
      subscription.plan,
    );
    return {
      id: subscription.id,
      mailAppId: subscription.mailApp?.appId ?? null,
      userId: subscription.userId,
      app: subscription.mailApp
        ? {
            appId: subscription.mailApp.appId,
            name: subscription.mailApp.name,
            primaryDomain: subscription.mailApp.primaryDomain,
          }
        : null,
      plan: subscription.plan,
      planId: subscription.plan.toLowerCase() as
        | 'starter'
        | 'standard'
        | 'premium',
      planName: def.name,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      mailboxCount: subscription.mailboxCount,
      priceMonthlyPerMailbox: def.priceMonthly,
      monthlyTotal: mailMonthlyTotal(
        subscription.plan,
        subscription.mailboxCount,
      ),
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      renewsAt: subscription.currentPeriodEnd,
      cancelledAt: subscription.cancelledAt,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
      limits,
      storageQuotaBytesPerMailbox,
      features: {
        agenticMail: limits.agenticMail,
        aiToolsUnlimited: limits.aiToolsUnlimited,
        openTracking: limits.openTracking,
        smartAiReplies: limits.smartAiReplies,
        automaticReplies: limits.automaticReplies,
        linkAndFileTracking: limits.linkAndFileTracking,
        premiumDelivery: limits.premiumDelivery,
      },
      payments: subscription.payments ?? [],
    };
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return value as Record<string, unknown>;
  }

  private async invalidateCache(mailAppUuid: string) {
    await this.redis.del(`${this.CACHE_PREFIX}${mailAppUuid}`).catch(() => {});
  }
}
