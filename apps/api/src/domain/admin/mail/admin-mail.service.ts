import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  MailAppStatus,
  MailDomainStatus,
  MailMailboxStatus,
  MailMessageStatus,
  MailPlan,
  Prisma,
  SupportTicketStatus,
} from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { MAIL_PLAN_LIMITS } from '../../mail/mail-plan-limits.config';
import { MAIL_APP_ID_PATTERN } from '../../mail/mail-app-id.util';
import { MailSesService } from '../../mail/mail-ses.service';
import {
  MAIL_MESSAGE_ADMIN_LIST_SELECT,
  MAIL_MESSAGE_ADMIN_SELECT,
} from './mail-message-admin.select';

const GB = 1024 ** 3;
const ALERT_LIMIT = 50;
const STORAGE_ALERT_RATIO = 0.9;

const OWNER_SELECT = {
  id: true,
  email: true,
  verificationLevel: true,
  isRuknyVerified: true,
  profile: { select: { name: true, username: true, avatar: true } },
} as const;

const APP_LIST_SELECT = {
  id: true,
  appId: true,
  name: true,
  appType: true,
  status: true,
  contactEmail: true,
  primaryDomain: true,
  domainStatus: true,
  domainCheckedAt: true,
  createdAt: true,
  updatedAt: true,
  user: { select: OWNER_SELECT },
  subscription: {
    select: {
      plan: true,
      status: true,
      mailboxCount: true,
      billingCycle: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
    },
  },
  _count: {
    select: {
      mailboxes: { where: { status: { not: MailMailboxStatus.DELETED } } },
    },
  },
} as const;

type OwnerRow = {
  id: string;
  email: string;
  verificationLevel: number;
  isRuknyVerified: boolean;
  profile: { name: string | null; username: string | null; avatar: string | null } | null;
};

@Injectable()
export class AdminMailService {
  private readonly logger = new Logger(AdminMailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailSes: MailSesService,
  ) {}

  async getStats() {
    const now = new Date();
    const d7 = daysAgo(now, 7);
    const d30 = daysAgo(now, 30);
    const d24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      appsTotal,
      appsActive,
      appsArchived,
      mailboxesTotal,
      mailboxesActive,
      mailboxesDisabled,
      inbound7d,
      outbound7d,
      inbound30d,
      outbound30d,
      failed7d,
      failed24h,
      queued,
      planGroups,
      domainGroups,
      storageSum,
      subscriptions,
    ] = await Promise.all([
      this.prisma.mailApp.count(),
      this.prisma.mailApp.count({ where: { status: MailAppStatus.ACTIVE } }),
      this.prisma.mailApp.count({ where: { status: MailAppStatus.ARCHIVED } }),
      this.prisma.mailMailbox.count({
        where: { status: { not: MailMailboxStatus.DELETED } },
      }),
      this.prisma.mailMailbox.count({
        where: { status: MailMailboxStatus.ACTIVE },
      }),
      this.prisma.mailMailbox.count({
        where: { status: MailMailboxStatus.DISABLED },
      }),
      this.prisma.mailMessage.count({
        where: { direction: 'INBOUND', createdAt: { gte: d7 } },
      }),
      this.prisma.mailMessage.count({
        where: { direction: 'OUTBOUND', createdAt: { gte: d7 } },
      }),
      this.prisma.mailMessage.count({
        where: { direction: 'INBOUND', createdAt: { gte: d30 } },
      }),
      this.prisma.mailMessage.count({
        where: { direction: 'OUTBOUND', createdAt: { gte: d30 } },
      }),
      this.prisma.mailMessage.count({
        where: { status: MailMessageStatus.FAILED, createdAt: { gte: d7 } },
      }),
      this.prisma.mailMessage.count({
        where: { status: MailMessageStatus.FAILED, createdAt: { gte: d24h } },
      }),
      this.prisma.mailMessage.count({
        where: { status: MailMessageStatus.QUEUED },
      }),
      this.prisma.mailSubscription.groupBy({
        by: ['plan'],
        where: { status: 'ACTIVE' },
        _count: { _all: true },
      }),
      this.prisma.mailApp.groupBy({
        by: ['domainStatus'],
        _count: { _all: true },
      }),
      this.prisma.mailMailbox.aggregate({
        _sum: { storageUsedBytes: true },
        where: { status: { not: MailMailboxStatus.DELETED } },
      }),
      this.prisma.mailSubscription.findMany({
        where: { status: 'ACTIVE' },
        select: { plan: true, mailboxCount: true },
      }),
    ]);

    const plans = {
      STARTER: 0,
      STANDARD: 0,
      PREMIUM: 0,
      none: Math.max(0, appsActive - planGroups.reduce((sum, row) => sum + row._count._all, 0)),
    };
    for (const row of planGroups) {
      plans[row.plan] = row._count._all;
    }

    const domains: Record<MailDomainStatus, number> = {
      NONE: 0,
      PENDING_DNS: 0,
      VERIFYING: 0,
      ACTIVE: 0,
      FAILED: 0,
    };
    for (const row of domainGroups) {
      domains[row.domainStatus] = row._count._all;
    }

    const quotaBytes = subscriptions.reduce(
      (sum, sub) => sum + storageQuotaBytes(sub.plan, sub.mailboxCount),
      0,
    );

    return {
      apps: { total: appsTotal, active: appsActive, archived: appsArchived },
      mailboxes: {
        total: mailboxesTotal,
        active: mailboxesActive,
        disabled: mailboxesDisabled,
      },
      messages: {
        inbound7d,
        outbound7d,
        inbound30d,
        outbound30d,
        failed7d,
        failed24h,
        queued,
      },
      plans,
      domains,
      storage: {
        usedBytes: toNumber(storageSum._sum.storageUsedBytes),
        quotaBytes,
      },
    };
  }

  async getAnalytics(days: number, appId?: string) {
    const periodDays = Math.min(Math.max(days, 1), 90);
    const since = startOfUtcDay(daysAgo(new Date(), periodDays - 1));

    if (appId) {
      if (!MAIL_APP_ID_PATTERN.test(appId)) {
        throw new BadRequestException('Invalid Mail app id.');
      }
      const app = await this.prisma.mailApp.findUnique({
        where: { appId },
        select: { id: true },
      });
      if (!app) {
        throw new NotFoundException('Mail app not found.');
      }
    }

    const rows = appId
      ? await this.prisma.$queryRaw<
          Array<{ day: Date; inbound: bigint; outbound: bigint; failed: bigint }>
        >(Prisma.sql`
          SELECT
            date_trunc('day', m."createdAt") AS day,
            COUNT(*) FILTER (WHERE m.direction = 'INBOUND') AS inbound,
            COUNT(*) FILTER (WHERE m.direction = 'OUTBOUND') AS outbound,
            COUNT(*) FILTER (WHERE m.status = 'FAILED') AS failed
          FROM mail_messages m
          INNER JOIN mail_mailboxes b ON b.id = m."mailboxId"
          INNER JOIN mail_apps a ON a.id = b."mailAppId"
          WHERE m."createdAt" >= ${since}
            AND a."appId" = ${appId}
          GROUP BY 1
          ORDER BY 1
        `)
      : await this.prisma.$queryRaw<
          Array<{ day: Date; inbound: bigint; outbound: bigint; failed: bigint }>
        >(Prisma.sql`
          SELECT
            date_trunc('day', "createdAt") AS day,
            COUNT(*) FILTER (WHERE direction = 'INBOUND') AS inbound,
            COUNT(*) FILTER (WHERE direction = 'OUTBOUND') AS outbound,
            COUNT(*) FILTER (WHERE status = 'FAILED') AS failed
          FROM mail_messages
          WHERE "createdAt" >= ${since}
          GROUP BY 1
          ORDER BY 1
        `);

    const byDay = new Map(
      rows.map((row) => [
        utcDayKey(row.day),
        {
          inbound: toNumber(row.inbound),
          outbound: toNumber(row.outbound),
          failed: toNumber(row.failed),
        },
      ]),
    );

    const dailyTrend: Array<{
      date: string;
      inbound: number;
      outbound: number;
      failed: number;
    }> = [];
    for (let i = 0; i < periodDays; i += 1) {
      const date = new Date(since);
      date.setUTCDate(since.getUTCDate() + i);
      const key = utcDayKey(date);
      const counts = byDay.get(key) ?? { inbound: 0, outbound: 0, failed: 0 };
      dailyTrend.push({ date: key, ...counts });
    }

    if (appId) {
      const mailboxRows = await this.prisma.$queryRaw<
        Array<{ address: string; inbound: bigint; outbound: bigint; failed: bigint }>
      >(Prisma.sql`
        SELECT
          (b."localPart" || '@' || b.domain) AS address,
          COUNT(*) FILTER (WHERE m.direction = 'INBOUND') AS inbound,
          COUNT(*) FILTER (WHERE m.direction = 'OUTBOUND') AS outbound,
          COUNT(*) FILTER (WHERE m.status = 'FAILED') AS failed
        FROM mail_messages m
        INNER JOIN mail_mailboxes b ON b.id = m."mailboxId"
        INNER JOIN mail_apps a ON a.id = b."mailAppId"
        WHERE m."createdAt" >= ${since}
          AND a."appId" = ${appId}
        GROUP BY b.id, b."localPart", b.domain
        ORDER BY COUNT(*) FILTER (WHERE m.status = 'FAILED') DESC,
          (COUNT(*) FILTER (WHERE m.direction = 'INBOUND')
            + COUNT(*) FILTER (WHERE m.direction = 'OUTBOUND')) DESC
        LIMIT 20
      `);

      return {
        days: periodDays,
        appId,
        dailyTrend,
        plans: [],
        domains: [],
        mailboxes: mailboxRows.map((row) => ({
          address: row.address,
          inbound: toNumber(row.inbound),
          outbound: toNumber(row.outbound),
          failed: toNumber(row.failed),
        })),
      };
    }

    const [planGroups, domainGroups] = await Promise.all([
      this.prisma.mailSubscription.groupBy({
        by: ['plan'],
        where: { status: 'ACTIVE' },
        _count: { _all: true },
      }),
      this.prisma.mailApp.groupBy({
        by: ['domainStatus'],
        _count: { _all: true },
      }),
    ]);

    return {
      days: periodDays,
      dailyTrend,
      plans: planGroups.map((row) => ({ plan: row.plan, count: row._count._all })),
      domains: domainGroups.map((row) => ({
        status: row.domainStatus,
        count: row._count._all,
      })),
      mailboxes: [],
    };
  }

  async getAlerts() {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [activeApps, failed24h, openTickets] = await Promise.all([
      this.prisma.mailApp.findMany({
        where: { status: MailAppStatus.ACTIVE },
        select: {
          appId: true,
          name: true,
          domainStatus: true,
          primaryDomain: true,
          contactEmail: true,
          user: { select: OWNER_SELECT },
          subscription: {
            select: { plan: true, status: true, mailboxCount: true },
          },
          mailboxes: {
            where: { status: { not: MailMailboxStatus.DELETED } },
            select: { storageUsedBytes: true },
          },
        },
      }),
      this.prisma.mailMessage.findMany({
        where: {
          status: MailMessageStatus.FAILED,
          createdAt: { gte: since24h },
        },
        select: {
          ...MAIL_MESSAGE_ADMIN_SELECT,
          mailbox: {
            select: {
              mailApp: {
                select: { appId: true, name: true, primaryDomain: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.prisma.supportTicket.findMany({
        where: {
          status: {
            in: [
              SupportTicketStatus.OPEN,
              SupportTicketStatus.IN_PROGRESS,
              SupportTicketStatus.WAITING_ON_USER,
            ],
          },
          context: { path: ['kind'], equals: 'mail_subscription' },
        },
        select: {
          id: true,
          number: true,
          subject: true,
          status: true,
          createdAt: true,
          context: true,
        },
        orderBy: { createdAt: 'desc' },
        take: ALERT_LIMIT,
      }),
    ]);

    const noSubscription = activeApps
      .filter((app) => !app.subscription || app.subscription.status !== 'ACTIVE')
      .slice(0, ALERT_LIMIT)
      .map((app) => ({
        type: 'no_subscription' as const,
        ...mapAlertApp(app),
      }));

    const storageHigh = activeApps
      .map((app) => {
        const usedBytes = app.mailboxes.reduce(
          (sum, box) => sum + toNumber(box.storageUsedBytes),
          0,
        );
        const quotaBytes =
          app.subscription?.status === 'ACTIVE'
            ? storageQuotaBytes(app.subscription.plan, app.subscription.mailboxCount)
            : 0;
        const ratio = quotaBytes > 0 ? usedBytes / quotaBytes : 0;
        return { app, usedBytes, quotaBytes, ratio };
      })
      .filter((row) => row.quotaBytes > 0 && row.ratio >= STORAGE_ALERT_RATIO)
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, ALERT_LIMIT)
      .map((row) => ({
        type: 'storage_high' as const,
        ...mapAlertApp(row.app),
        usedBytes: row.usedBytes,
        quotaBytes: row.quotaBytes,
        percent: Math.round(row.ratio * 1000) / 10,
      }));

    const failedByApp = new Map<
      string,
      { appId: string; name: string; primaryDomain: string | null; count: number }
    >();
    for (const message of failed24h) {
      const appId = message.mailbox.mailApp.appId;
      const existing = failedByApp.get(appId);
      if (existing) {
        existing.count += 1;
      } else {
        failedByApp.set(appId, {
          appId,
          name: message.mailbox.mailApp.name,
          primaryDomain: message.mailbox.mailApp.primaryDomain,
          count: 1,
        });
      }
    }
    const deliveryFailed24h = [...failedByApp.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, ALERT_LIMIT)
      .map((row) => ({ type: 'delivery_failed_24h' as const, ...row }));

    const domainUnverified = activeApps
      .filter((app) => app.domainStatus !== MailDomainStatus.ACTIVE)
      .slice(0, ALERT_LIMIT)
      .map((app) => ({
        type: 'domain_unverified' as const,
        ...mapAlertApp(app),
      }));

    const planTickets = openTickets.map((ticket) => {
      const context =
        ticket.context && typeof ticket.context === 'object'
          ? (ticket.context as Record<string, unknown>)
          : {};
      return {
        type: 'plan_ticket' as const,
        ticketId: ticket.id,
        number: ticket.number,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
        mailAppId: typeof context.mailAppId === 'string' ? context.mailAppId : null,
        mailAppName:
          typeof context.mailAppName === 'string' ? context.mailAppName : null,
      };
    });

    return {
      noSubscription,
      storageHigh,
      deliveryFailed24h,
      domainUnverified,
      planTickets,
    };
  }

  async listApps(options: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    plan?: string;
    domainStatus?: string;
  }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;
    const where = this.buildAppsWhere(options);

    const [rows, total] = await Promise.all([
      this.prisma.mailApp.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: APP_LIST_SELECT,
      }),
      this.prisma.mailApp.count({ where }),
    ]);

    const storageByApp = await this.storageByAppIds(rows.map((row) => row.id));

    return {
      data: rows.map((row) => this.mapAppListItem(row, storageByApp.get(row.id) ?? 0)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async exportApps(filters: {
    search?: string;
    status?: string;
    plan?: string;
    domainStatus?: string;
  }) {
    const where = this.buildAppsWhere(filters);
    const rows = await this.prisma.mailApp.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10_000,
      select: APP_LIST_SELECT,
    });
    const storageByApp = await this.storageByAppIds(rows.map((row) => row.id));

    return {
      data: rows.map((row) => {
        const item = this.mapAppListItem(row, storageByApp.get(row.id) ?? 0);
        return {
          appId: item.appId,
          name: item.name,
          status: item.status,
          appType: item.appType,
          primaryDomain: item.primaryDomain ?? '',
          domainStatus: item.domainStatus,
          plan: item.subscription?.plan ?? '',
          mailboxCount: item.mailboxCount,
          storageUsedBytes: item.storageUsedBytes,
          storageQuotaBytes: item.storageQuotaBytes,
          ownerEmail: item.owner.email,
          ownerName: item.owner.name ?? '',
          createdAt: item.createdAt,
        };
      }),
      total: rows.length,
    };
  }

  async getApp(publicAppId: string) {
    const app = await this.requireApp(publicAppId);
    const [storageUsed, mailboxCount, failed24h, recentFailures] =
      await Promise.all([
        this.prisma.mailMailbox.aggregate({
          where: {
            mailAppId: app.id,
            status: { not: MailMailboxStatus.DELETED },
          },
          _sum: { storageUsedBytes: true },
        }),
        this.prisma.mailMailbox.count({
          where: {
            mailAppId: app.id,
            status: { not: MailMailboxStatus.DELETED },
          },
        }),
        this.prisma.mailMessage.count({
          where: {
            status: MailMessageStatus.FAILED,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            mailbox: { mailAppId: app.id },
          },
        }),
        this.prisma.mailMessage.findMany({
          where: {
            status: { in: [MailMessageStatus.FAILED, MailMessageStatus.QUEUED] },
            mailbox: { mailAppId: app.id },
          },
          select: MAIL_MESSAGE_ADMIN_SELECT,
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
      ]);

    const usedBytes = toNumber(storageUsed._sum.storageUsedBytes);
    const quotaBytes =
      app.subscription?.status === 'ACTIVE'
        ? storageQuotaBytes(app.subscription.plan, app.subscription.mailboxCount)
        : 0;

    return {
      ...this.mapAppListItem(app, usedBytes),
      contactEmail: app.contactEmail,
      description: app.description,
      slotIndex: app.slotIndex,
      userId: app.userId,
      updatedAt: app.updatedAt.toISOString(),
      subscription: app.subscription
        ? {
            plan: app.subscription.plan,
            status: app.subscription.status,
            mailboxCount: app.subscription.mailboxCount,
            billingCycle: app.subscription.billingCycle,
            currentPeriodStart:
              app.subscription.currentPeriodStart?.toISOString() ?? null,
            currentPeriodEnd:
              app.subscription.currentPeriodEnd?.toISOString() ?? null,
          }
        : null,
      storage: { usedBytes, quotaBytes, mailboxCount },
      counts: { mailboxes: mailboxCount, failed24h },
      sesRefreshAvailable: this.mailSes.isConfigured(),
      recentFailures: recentFailures.map((row) => this.mapDeliveryRow(row)),
    };
  }

  async listMailboxes(publicAppId: string) {
    const app = await this.requireApp(publicAppId);
    const rows = await this.prisma.mailMailbox.findMany({
      where: {
        mailAppId: app.id,
        status: { not: MailMailboxStatus.DELETED },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        localPart: true,
        domain: true,
        displayName: true,
        status: true,
        totpEnabled: true,
        passwordHash: true,
        storageUsedBytes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      mailboxes: rows.map((row) => ({
        id: row.id,
        localPart: row.localPart,
        domain: row.domain,
        address: `${row.localPart}@${row.domain}`,
        displayName: row.displayName,
        status: row.status,
        totpEnabled: row.totpEnabled,
        hasPassword: Boolean(row.passwordHash),
        storageUsedBytes: toNumber(row.storageUsedBytes),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
    };
  }

  async updateMailboxStatus(mailboxId: string, status: 'ACTIVE' | 'DISABLED') {
    const mailbox = await this.prisma.mailMailbox.findUnique({
      where: { id: mailboxId },
      select: {
        id: true,
        status: true,
        localPart: true,
        domain: true,
        displayName: true,
        totpEnabled: true,
        storageUsedBytes: true,
        createdAt: true,
        updatedAt: true,
        mailApp: { select: { appId: true } },
      },
    });
    if (!mailbox || mailbox.status === MailMailboxStatus.DELETED) {
      throw new NotFoundException('Mailbox not found.');
    }

    const updated = await this.prisma.mailMailbox.update({
      where: { id: mailbox.id },
      data: {
        status:
          status === 'DISABLED'
            ? MailMailboxStatus.DISABLED
            : MailMailboxStatus.ACTIVE,
      },
      select: {
        id: true,
        localPart: true,
        domain: true,
        displayName: true,
        status: true,
        totpEnabled: true,
        storageUsedBytes: true,
        createdAt: true,
        updatedAt: true,
        mailApp: { select: { appId: true } },
      },
    });

    return {
      mailbox: {
        id: updated.id,
        appId: updated.mailApp.appId,
        address: `${updated.localPart}@${updated.domain}`,
        localPart: updated.localPart,
        domain: updated.domain,
        displayName: updated.displayName,
        status: updated.status,
        totpEnabled: updated.totpEnabled,
        storageUsedBytes: toNumber(updated.storageUsedBytes),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  }

  async listDelivery(options: {
    page: number;
    limit: number;
    appId?: string;
    days?: number;
  }) {
    const { page, limit } = options;
    const periodDays = Math.min(Math.max(options.days ?? 30, 1), 90);
    const since = daysAgo(new Date(), periodDays);
    const skip = (page - 1) * limit;

    const where: Prisma.MailMessageWhereInput = {
      status: { in: [MailMessageStatus.FAILED, MailMessageStatus.QUEUED] },
      createdAt: { gte: since },
    };
    if (options.appId) {
      if (!MAIL_APP_ID_PATTERN.test(options.appId)) {
        throw new BadRequestException('Invalid Mail app id.');
      }
      where.mailbox = { mailApp: { appId: options.appId } };
    }

    const [rows, total] = await Promise.all([
      this.prisma.mailMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: MAIL_MESSAGE_ADMIN_LIST_SELECT,
      }),
      this.prisma.mailMessage.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.mapDeliveryRow(row)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      days: periodDays,
    };
  }

  async listDomains() {
    const groups = await this.prisma.mailApp.groupBy({
      by: ['domainStatus'],
      _count: { _all: true },
    });
    const counts: Record<MailDomainStatus, number> = {
      NONE: 0,
      PENDING_DNS: 0,
      VERIFYING: 0,
      ACTIVE: 0,
      FAILED: 0,
    };
    for (const row of groups) {
      counts[row.domainStatus] = row._count._all;
    }

    const apps = await this.prisma.mailApp.findMany({
      where: { domainStatus: { not: MailDomainStatus.ACTIVE } },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      select: {
        appId: true,
        name: true,
        status: true,
        primaryDomain: true,
        domainStatus: true,
        domainCheckedAt: true,
        user: { select: OWNER_SELECT },
      },
    });

    return {
      counts,
      apps: apps.map((app) => ({
        appId: app.appId,
        name: app.name,
        status: app.status,
        primaryDomain: app.primaryDomain,
        domainStatus: app.domainStatus,
        domainCheckedAt: app.domainCheckedAt?.toISOString() ?? null,
        owner: mapOwner(app.user),
      })),
    };
  }

  async refreshDomain(publicAppId: string) {
    const app = await this.requireApp(publicAppId);
    if (!app.primaryDomain) {
      throw new BadRequestException('This Mail app has no primary domain.');
    }
    if (!this.mailSes.isConfigured()) {
      return {
        refreshed: false,
        sesAvailable: false,
        primaryDomain: app.primaryDomain,
        domainStatus: app.domainStatus,
        domainCheckedAt: app.domainCheckedAt?.toISOString() ?? null,
      };
    }

    try {
      const identity = await this.mailSes.getEmailIdentity(app.primaryDomain);
      const domainStatus = mapSesToDomainStatus(identity);
      const updated = await this.prisma.mailApp.update({
        where: { id: app.id },
        data: { domainStatus, domainCheckedAt: new Date() },
        select: {
          primaryDomain: true,
          domainStatus: true,
          domainCheckedAt: true,
        },
      });
      return {
        refreshed: true,
        sesAvailable: true,
        primaryDomain: updated.primaryDomain,
        domainStatus: updated.domainStatus,
        domainCheckedAt: updated.domainCheckedAt?.toISOString() ?? null,
        ses: {
          found: identity.found,
          sending: identity.sending,
          dkim: identity.dkim,
        },
      };
    } catch (error) {
      this.logger.warn(
        `SES domain refresh failed for ${app.appId}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof ServiceUnavailableException) {
        return {
          refreshed: false,
          sesAvailable: false,
          primaryDomain: app.primaryDomain,
          domainStatus: app.domainStatus,
          domainCheckedAt: app.domainCheckedAt?.toISOString() ?? null,
        };
      }
      throw error;
    }
  }

  private async requireApp(publicAppId: string) {
    if (!MAIL_APP_ID_PATTERN.test(publicAppId)) {
      throw new BadRequestException('Invalid Mail app id.');
    }
    const app = await this.prisma.mailApp.findUnique({
      where: { appId: publicAppId },
      select: {
        ...APP_LIST_SELECT,
        description: true,
        slotIndex: true,
        userId: true,
      },
    });
    if (!app) {
      throw new NotFoundException('Mail app not found.');
    }
    return app;
  }

  private buildAppsWhere(filters: {
    search?: string;
    status?: string;
    plan?: string;
    domainStatus?: string;
  }): Prisma.MailAppWhereInput {
    const where: Prisma.MailAppWhereInput = {};
    const search = filters.search?.trim();
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { appId: { contains: search } },
        { primaryDomain: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        {
          user: {
            profile: { name: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }
    if (filters.status === MailAppStatus.ACTIVE || filters.status === MailAppStatus.ARCHIVED) {
      where.status = filters.status;
    }
    if (
      filters.domainStatus &&
      Object.values(MailDomainStatus).includes(
        filters.domainStatus as MailDomainStatus,
      )
    ) {
      where.domainStatus = filters.domainStatus as MailDomainStatus;
    }
    if (filters.plan === 'none') {
      where.subscription = { is: null };
    } else if (
      filters.plan &&
      Object.values(MailPlan).includes(filters.plan as MailPlan)
    ) {
      where.subscription = { plan: filters.plan as MailPlan, status: 'ACTIVE' };
    }
    return where;
  }

  private async storageByAppIds(ids: string[]) {
    const map = new Map<string, number>();
    if (ids.length === 0) return map;
    const groups = await this.prisma.mailMailbox.groupBy({
      by: ['mailAppId'],
      where: {
        mailAppId: { in: ids },
        status: { not: MailMailboxStatus.DELETED },
      },
      _sum: { storageUsedBytes: true },
    });
    for (const group of groups) {
      map.set(group.mailAppId, toNumber(group._sum.storageUsedBytes));
    }
    return map;
  }

  private mapAppListItem(
    app: {
      appId: string;
      name: string;
      appType: string;
      status: MailAppStatus;
      primaryDomain: string | null;
      domainStatus: MailDomainStatus;
      domainCheckedAt: Date | null;
      createdAt: Date;
      user: OwnerRow;
      subscription: {
        plan: MailPlan;
        status: string;
        mailboxCount: number;
      } | null;
      _count: { mailboxes: number };
    },
    usedBytes: number,
  ) {
    const quotaBytes =
      app.subscription?.status === 'ACTIVE'
        ? storageQuotaBytes(app.subscription.plan, app.subscription.mailboxCount)
        : 0;
    return {
      id: app.appId,
      appId: app.appId,
      name: app.name,
      appType: app.appType,
      status: app.status,
      primaryDomain: app.primaryDomain,
      domainStatus: app.domainStatus,
      domainCheckedAt: app.domainCheckedAt?.toISOString() ?? null,
      createdAt: app.createdAt.toISOString(),
      mailboxCount: app._count.mailboxes,
      storageUsedBytes: usedBytes,
      storageQuotaBytes: quotaBytes,
      owner: mapOwner(app.user),
      subscription: app.subscription
        ? {
            plan: app.subscription.plan,
            status: app.subscription.status,
            mailboxCount: app.subscription.mailboxCount,
          }
        : null,
    };
  }

  private mapDeliveryRow(row: {
    id: string;
    mailboxId: string;
    direction: string;
    folder: string;
    status: string;
    fromAddress: string;
    toAddresses: string[];
    subject: string;
    sesMessageId: string | null;
    errorMessage: string | null;
    sentAt: Date | null;
    receivedAt: Date | null;
    createdAt: Date;
    mailbox?: {
      id?: string;
      localPart?: string;
      domain?: string;
      mailApp?: { appId: string; name: string };
    };
  }) {
    return {
      id: row.id,
      mailboxId: row.mailboxId,
      direction: row.direction,
      folder: row.folder,
      status: row.status,
      fromAddress: row.fromAddress,
      toAddresses: row.toAddresses,
      subject: row.subject,
      sesMessageId: row.sesMessageId,
      errorMessage: row.errorMessage,
      sentAt: row.sentAt?.toISOString() ?? null,
      receivedAt: row.receivedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      mailboxAddress:
        row.mailbox?.localPart && row.mailbox?.domain
          ? `${row.mailbox.localPart}@${row.mailbox.domain}`
          : null,
      appId: row.mailbox?.mailApp?.appId ?? null,
      appName: row.mailbox?.mailApp?.name ?? null,
    };
  }
}

function mapAlertApp(app: {
  appId: string;
  name: string;
  primaryDomain: string | null;
  domainStatus: MailDomainStatus;
  contactEmail: string | null;
  user: OwnerRow;
}) {
  return {
    appId: app.appId,
    name: app.name,
    primaryDomain: app.primaryDomain,
    domainStatus: app.domainStatus,
    contactEmail: app.contactEmail,
    owner: mapOwner(app.user),
  };
}

function mapOwner(user: OwnerRow) {
  return {
    id: user.id,
    email: user.email,
    name: user.profile?.name ?? null,
    username: user.profile?.username ?? null,
    avatar: user.profile?.avatar ?? null,
    verificationLevel: user.verificationLevel,
    isRuknyVerified: user.isRuknyVerified,
  };
}

function storageQuotaBytes(plan: MailPlan, mailboxCount: number) {
  const seats = Math.max(1, mailboxCount);
  return seats * MAIL_PLAN_LIMITS[plan].storageGbPerMailbox * GB;
}

function toNumber(value: bigint | number | null | undefined) {
  if (value == null) return 0;
  const n = typeof value === 'bigint' ? Number(value) : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function daysAgo(from: Date, days: number) {
  return new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
}

function startOfUtcDay(date: Date) {
  const next = new Date(date);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function utcDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function mapSesToDomainStatus(ses: {
  found: boolean;
  sending: boolean;
  dkim: string;
}): MailDomainStatus {
  if (!ses.found) return MailDomainStatus.FAILED;
  if (ses.sending && ses.dkim === 'SUCCESS') return MailDomainStatus.ACTIVE;
  if (ses.dkim === 'FAILED') return MailDomainStatus.FAILED;
  if (ses.dkim === 'PENDING' || ses.dkim === 'NOT_STARTED') {
    return MailDomainStatus.PENDING_DNS;
  }
  return MailDomainStatus.VERIFYING;
}
