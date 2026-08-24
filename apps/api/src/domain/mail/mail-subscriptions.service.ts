import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BillingCycle,
  MailAppStatus,
  MailDomainStatus,
  MailMailboxStatus,
  MailPlan,
  PaymentStatus,
  SupportTicketCategory,
  SupportTicketStatus,
  SubscriptionStatus,
} from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { RedisService } from '../../core/cache/redis.service';
import { SupportTicketsService } from '../support-tickets/support-tickets.service';
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

const OPEN_TICKET_STATUSES: SupportTicketStatus[] = [
  SupportTicketStatus.OPEN,
  SupportTicketStatus.IN_PROGRESS,
  SupportTicketStatus.WAITING_ON_USER,
];

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
  private readonly CACHE_PREFIX = 'mail-sub:app:';
  private readonly CACHE_TTL = 300;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly supportTickets: SupportTicketsService,
  ) {}

  getPlansOverview() {
    return {
      currency: 'IQD',
      cardPayments: { available: false, status: 'coming_soon' as const },
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
    const app = await this.requireOwnedApp(userId, publicAppId);
    const { subscription } = await this.getSubscriptionForApp(app.id);
    const pendingRequest = await this.findPendingRequest(userId, app.appId);
    return {
      app: this.toAppView(app),
      subscription,
      pendingRequest,
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
    const app = await this.requireOwnedApp(userId, publicAppId);
    const seats = this.normalizeSeats(mailboxCount);
    const existing = await this.findPendingRequest(userId, app.appId);
    if (existing) {
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
      'الدفع بالبطاقة قيد التطوير. يرجى التفعيل من المسؤول.',
      '',
      'Mail plan request for this app only (not shared across the user’s other apps).',
      `App: ${app.name} (${app.appId})`,
      `Plan: ${planName} · seats: ${seats} · ${monthlyTotal.toLocaleString('en-IQ')} IQD/mo`,
      'Card payment is coming soon. Please activate from HQ.',
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

  /** Activates Starter after DNS is verified. Does not replace an active paid plan. */
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
      return { alreadyActive: true as const };
    }

    const seats = MAIL_PLAN_LIMITS.STARTER.mailboxesIncluded;
    await this.upsertForApp(
      {
        id: app.id,
        appId: app.appId,
        userId: app.userId,
        name: app.name,
        primaryDomain: app.primaryDomain,
      },
      MailPlan.STARTER,
      seats,
      BillingCycle.MONTHLY,
      { source: 'auto_starter_after_dns' },
    );
    return { alreadyActive: false as const };
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
            note: 'Card payment gateway not wired yet',
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
    if (ticket.userId !== app.userId) {
      throw new ForbiddenException(
        'This ticket does not belong to the Mail app owner.',
      );
    }
    if (ticket.category !== SupportTicketCategory.BILLING) {
      throw new BadRequestException('Ticket is not a billing request.');
    }
    const context = this.asRecord(ticket.context);
    if (context.kind !== 'mail_subscription') {
      throw new BadRequestException('Ticket is not a Mail plan request.');
    }
    if (context.mailAppId && context.mailAppId !== app.appId) {
      throw new BadRequestException(
        'Ticket is for a different Mail app.',
      );
    }
  }

  private async findPendingRequest(userId: string, publicAppId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: {
        userId,
        category: SupportTicketCategory.BILLING,
        status: { in: OPEN_TICKET_STATUSES },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    for (const ticket of tickets) {
      const context = this.asRecord(ticket.context);
      if (
        context.kind === 'mail_subscription' &&
        context.mailAppId === publicAppId
      ) {
        const plan =
          typeof context.mailPlan === 'string' ? context.mailPlan : null;
        const mailboxCount =
          typeof context.mailboxCount === 'number' ? context.mailboxCount : 1;
        return {
          ticketId: ticket.id,
          ticketNumber: ticket.number,
          plan,
          mailboxCount,
          monthlyTotal:
            typeof context.monthlyTotal === 'number'
              ? context.monthlyTotal
              : null,
          createdAt: ticket.createdAt.toISOString(),
        };
      }
    }
    return null;
  }

  private async requireOwnedApp(userId: string, publicAppId: string) {
    const app = await this.requireAppByPublicId(publicAppId);
    if (app.userId !== userId) {
      throw new NotFoundException('Mail app not found.');
    }
    return app;
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
