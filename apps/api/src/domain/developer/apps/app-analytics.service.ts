import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { ACTIVE_FORM_FILTER } from '../../forms/utils/forms-deletion.util';

type PeriodBounds = {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  days: number;
};

type DailyBucket = {
  date: string;
  messages: number;
  messagesDelivered: number;
  messagesFailed: number;
  apiRequests: number;
  formViews: number;
  formSubmissions: number;
  walletSpent: number;
};

function trendPercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function toDateKey(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function fillDailySeries(
  period: PeriodBounds,
  partial: Map<string, Partial<DailyBucket>>,
): DailyBucket[] {
  const rows: DailyBucket[] = [];
  const cursor = new Date(period.start);
  while (cursor <= period.end) {
    const key = cursor.toISOString().slice(0, 10);
    const hit = partial.get(key);
    rows.push({
      date: key,
      messages: hit?.messages ?? 0,
      messagesDelivered: hit?.messagesDelivered ?? 0,
      messagesFailed: hit?.messagesFailed ?? 0,
      apiRequests: hit?.apiRequests ?? 0,
      formViews: hit?.formViews ?? 0,
      formSubmissions: hit?.formSubmissions ?? 0,
      walletSpent: hit?.walletSpent ?? 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return rows;
}

@Injectable()
export class AppAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAppAnalytics(userId: string, publicAppId: string, days = 30) {
    const app = await this.prisma.developerApp.findFirst({
      where: { appId: publicAppId, userId, status: { not: 'DELETED' } },
      select: { id: true, appId: true, name: true },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    const period = this.resolvePeriod(days);
    const formIds = (
      await this.prisma.form.findMany({
        where: { developerAppId: app.id, ...ACTIVE_FORM_FILTER },
        select: { id: true },
      })
    ).map((f) => f.id);

    const [
      messageCurrent,
      messagePrevious,
      messageDaily,
      messagesByStatus,
      messagesByType,
      messagesByDirection,
      apiRequestCurrent,
      apiRequestPrevious,
      apiRequestDaily,
      apiKeys,
      apiKeyCounts,
      apiKeyLifetime,
      formDaily,
      formViewsCurrent,
      formSubsCurrent,
      formViewsPrevious,
      formSubsPrevious,
      topForms,
      wallet,
      walletSpendCurrent,
      walletSpendPrevious,
      walletSpendDaily,
      linkedFormsCount,
      whatsappAccountsCount,
    ] = await Promise.all([
      this.countMessages(app.id, period.start, period.end),
      this.countMessages(app.id, period.prevStart, period.prevEnd),
      this.dailyMessages(app.id, period.start, period.end),
      this.groupMessages(app.id, period.start, period.end, 'status'),
      this.groupMessages(app.id, period.start, period.end, 'messageType'),
      this.groupMessages(app.id, period.start, period.end, 'direction'),
      this.countApiRequests(app.id, period.start, period.end),
      this.countApiRequests(app.id, period.prevStart, period.prevEnd),
      this.dailyApiRequests(app.id, period.start, period.end),
      this.prisma.developerApiKey.findMany({
        where: { developerAppId: app.id },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          requestCount: true,
          lastUsedAt: true,
          environment: true,
        },
        orderBy: { requestCount: 'desc' },
        take: 8,
      }),
      this.prisma.developerApiKey.groupBy({
        by: ['status'],
        where: { developerAppId: app.id },
        _count: true,
      }),
      this.prisma.developerApiKey.aggregate({
        where: { developerAppId: app.id },
        _sum: { requestCount: true },
      }),
      formIds.length
        ? this.prisma.form_analytics.groupBy({
            by: ['date'],
            where: {
              formId: { in: formIds },
              date: { gte: period.start, lte: period.end },
            },
            _sum: { views: true, submissions: true },
            orderBy: { date: 'asc' },
          })
        : Promise.resolve([]),
      formIds.length
        ? this.sumFormMetric(formIds, period.start, period.end, 'views')
        : Promise.resolve(0),
      formIds.length
        ? this.sumFormMetric(formIds, period.start, period.end, 'submissions')
        : Promise.resolve(0),
      formIds.length
        ? this.sumFormMetric(formIds, period.prevStart, period.prevEnd, 'views')
        : Promise.resolve(0),
      formIds.length
        ? this.sumFormMetric(
            formIds,
            period.prevStart,
            period.prevEnd,
            'submissions',
          )
        : Promise.resolve(0),
      formIds.length
        ? this.prisma.form.findMany({
            where: { id: { in: formIds } },
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              viewCount: true,
              submissionCount: true,
            },
            orderBy: { submissionCount: 'desc' },
            take: 8,
          })
        : Promise.resolve([]),
      this.prisma.developerAppWallet.findUnique({
        where: { developerAppId: app.id },
        select: {
          balance: true,
          currency: true,
          totalAllocated: true,
          totalSpent: true,
        },
      }),
      this.sumWalletSpend(userId, app.id, period.start, period.end),
      this.sumWalletSpend(userId, app.id, period.prevStart, period.prevEnd),
      this.dailyWalletSpend(userId, app.id, period.start, period.end),
      this.prisma.form.count({
        where: { developerAppId: app.id, ...ACTIVE_FORM_FILTER },
      }),
      this.prisma.developerWhatsappAccount.count({
        where: { developerAppId: app.id },
      }),
    ]);

    const buckets = new Map<string, Partial<DailyBucket>>();

    for (const row of messageDaily) {
      const key = toDateKey(row.date);
      const cur = buckets.get(key) ?? {};
      buckets.set(key, {
        ...cur,
        messages: Number(row.total) || 0,
        messagesDelivered: Number(row.delivered) || 0,
        messagesFailed: Number(row.failed) || 0,
      });
    }

    for (const row of apiRequestDaily) {
      const key = toDateKey(row.date);
      const cur = buckets.get(key) ?? {};
      buckets.set(key, {
        ...cur,
        apiRequests: Number(row.total) || 0,
      });
    }

    for (const row of formDaily) {
      const key = toDateKey(row.date);
      const cur = buckets.get(key) ?? {};
      buckets.set(key, {
        ...cur,
        formViews: row._sum.views ?? 0,
        formSubmissions: row._sum.submissions ?? 0,
      });
    }

    for (const row of walletSpendDaily) {
      const key = toDateKey(row.date);
      const cur = buckets.get(key) ?? {};
      buckets.set(key, {
        ...cur,
        walletSpent: Number(row.total) || 0,
      });
    }

    const lifetimeApiRequests = Number(apiKeyLifetime._sum.requestCount ?? 0);

    const activeApiKeys =
      apiKeyCounts.find((row) => row.status === 'ACTIVE')?._count ?? 0;
    const totalApiKeys = apiKeyCounts.reduce((sum, row) => sum + row._count, 0);

    return {
      appId: app.appId,
      appName: app.name,
      period: {
        days: period.days,
        startDate: period.start.toISOString().slice(0, 10),
        endDate: period.end.toISOString().slice(0, 10),
      },
      summary: {
        apiRequests: apiRequestCurrent,
        apiRequestsLifetime: lifetimeApiRequests,
        apiRequestsTrend: trendPercent(apiRequestCurrent, apiRequestPrevious),
        messages: messageCurrent.total,
        messagesDelivered: messageCurrent.delivered,
        messagesFailed: messageCurrent.failed,
        messagesTrend: trendPercent(
          messageCurrent.total,
          messagePrevious.total,
        ),
        formViews: formViewsCurrent,
        formSubmissions: formSubsCurrent,
        formViewsTrend: trendPercent(formViewsCurrent, formViewsPrevious),
        formSubmissionsTrend: trendPercent(
          formSubsCurrent,
          formSubsPrevious,
        ),
        walletSpent: walletSpendCurrent,
        walletSpentTrend: trendPercent(
          walletSpendCurrent,
          walletSpendPrevious,
        ),
        walletBalance: wallet?.balance ?? 0,
        walletCurrency: wallet?.currency ?? 'IQD',
        walletTotalAllocated: wallet?.totalAllocated ?? 0,
        walletTotalSpent: wallet?.totalSpent ?? 0,
        activeApiKeys,
        totalApiKeys,
        linkedForms: linkedFormsCount,
        whatsappAccounts: whatsappAccountsCount,
      },
      dailyTrend: fillDailySeries(period, buckets),
      messagesByStatus,
      messagesByType,
      messagesByDirection,
      topApiKeys: apiKeys.map((key) => ({
        id: key.id,
        name: key.name,
        slug: key.slug,
        status: key.status,
        environment: key.environment,
        requestCount: Number(key.requestCount),
        lastUsedAt: key.lastUsedAt,
      })),
      topForms: topForms.map((form) => ({
        id: form.id,
        title: form.title,
        slug: form.slug,
        status: form.status,
        views: form.viewCount,
        submissions: form.submissionCount,
      })),
    };
  }

  private resolvePeriod(days: number): PeriodBounds {
    const safeDays = [7, 30, 90].includes(days) ? days : 30;
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (safeDays - 1));
    start.setUTCHours(0, 0, 0, 0);
    const prevEnd = new Date(start);
    prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
    prevEnd.setUTCHours(23, 59, 59, 999);
    const prevStart = new Date(prevEnd);
    prevStart.setUTCDate(prevStart.getUTCDate() - (safeDays - 1));
    prevStart.setUTCHours(0, 0, 0, 0);
    return { start, end, prevStart, prevEnd, days: safeDays };
  }

  private async countMessages(
    developerAppId: string,
    start: Date,
    end: Date,
  ): Promise<{ total: number; delivered: number; failed: number }> {
    const rows = await this.prisma.$queryRaw<
      { total: number; delivered: number; failed: number }[]
    >`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE m.status = 'DELIVERED')::int AS delivered,
        COUNT(*) FILTER (WHERE m.status = 'FAILED')::int AS failed
      FROM whatsapp_message_logs m
      INNER JOIN developer_whatsapp_accounts a ON a.id = m."accountId"
      WHERE a."developerAppId" = ${developerAppId}
        AND m."createdAt" >= ${start}
        AND m."createdAt" <= ${end}
    `;
    return rows[0] ?? { total: 0, delivered: 0, failed: 0 };
  }

  private async dailyMessages(developerAppId: string, start: Date, end: Date) {
    return this.prisma.$queryRaw<
      { date: Date; total: number; delivered: number; failed: number }[]
    >`
      SELECT
        DATE(m."createdAt") AS date,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE m.status = 'DELIVERED')::int AS delivered,
        COUNT(*) FILTER (WHERE m.status = 'FAILED')::int AS failed
      FROM whatsapp_message_logs m
      INNER JOIN developer_whatsapp_accounts a ON a.id = m."accountId"
      WHERE a."developerAppId" = ${developerAppId}
        AND m."createdAt" >= ${start}
        AND m."createdAt" <= ${end}
      GROUP BY DATE(m."createdAt")
      ORDER BY date ASC
    `;
  }

  private async groupMessages(
    developerAppId: string,
    start: Date,
    end: Date,
    field: 'status' | 'messageType' | 'direction',
  ): Promise<Record<string, number>> {
    const rows =
      field === 'status'
        ? await this.prisma.$queryRaw<{ key: string; count: number }[]>`
            SELECT m.status::text AS key, COUNT(*)::int AS count
            FROM whatsapp_message_logs m
            INNER JOIN developer_whatsapp_accounts a ON a.id = m."accountId"
            WHERE a."developerAppId" = ${developerAppId}
              AND m."createdAt" >= ${start}
              AND m."createdAt" <= ${end}
            GROUP BY m.status
          `
        : field === 'messageType'
          ? await this.prisma.$queryRaw<{ key: string; count: number }[]>`
              SELECT m."messageType"::text AS key, COUNT(*)::int AS count
              FROM whatsapp_message_logs m
              INNER JOIN developer_whatsapp_accounts a ON a.id = m."accountId"
              WHERE a."developerAppId" = ${developerAppId}
                AND m."createdAt" >= ${start}
                AND m."createdAt" <= ${end}
              GROUP BY m."messageType"
            `
          : await this.prisma.$queryRaw<{ key: string; count: number }[]>`
              SELECT m.direction::text AS key, COUNT(*)::int AS count
              FROM whatsapp_message_logs m
              INNER JOIN developer_whatsapp_accounts a ON a.id = m."accountId"
              WHERE a."developerAppId" = ${developerAppId}
                AND m."createdAt" >= ${start}
                AND m."createdAt" <= ${end}
              GROUP BY m.direction
            `;

    return Object.fromEntries(rows.map((r) => [r.key, Number(r.count) || 0]));
  }

  private async countApiRequests(
    developerAppId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ total: number }[]>`
      SELECT COUNT(*)::int AS total
      FROM api_request_logs r
      INNER JOIN developer_api_keys k ON k.id = r."apiKeyId"
      WHERE k."developerAppId" = ${developerAppId}
        AND r."createdAt" >= ${start}
        AND r."createdAt" <= ${end}
    `;
    return Number(rows[0]?.total) || 0;
  }

  private async dailyApiRequests(
    developerAppId: string,
    start: Date,
    end: Date,
  ) {
    return this.prisma.$queryRaw<{ date: Date; total: number }[]>`
      SELECT DATE(r."createdAt") AS date, COUNT(*)::int AS total
      FROM api_request_logs r
      INNER JOIN developer_api_keys k ON k.id = r."apiKeyId"
      WHERE k."developerAppId" = ${developerAppId}
        AND r."createdAt" >= ${start}
        AND r."createdAt" <= ${end}
      GROUP BY DATE(r."createdAt")
      ORDER BY date ASC
    `;
  }

  private async sumFormMetric(
    formIds: string[],
    start: Date,
    end: Date,
    metric: 'views' | 'submissions',
  ): Promise<number> {
    const agg = await this.prisma.form_analytics.aggregate({
      where: {
        formId: { in: formIds },
        date: { gte: start, lte: end },
      },
      _sum: {
        views: true,
        submissions: true,
      },
    });
    return metric === 'views'
      ? (agg._sum.views ?? 0)
      : (agg._sum.submissions ?? 0);
  }

  private async sumWalletSpend(
    userId: string,
    developerAppId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    const rows = await this.prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(t.amount), 0)::int AS total
      FROM wallet_transactions t
      INNER JOIN developer_wallets w ON w.id = t."walletId"
      WHERE w."userId" = ${userId}
        AND t.type = 'MESSAGE_CHARGE'
        AND t.status = 'COMPLETED'
        AND t."createdAt" >= ${start}
        AND t."createdAt" <= ${end}
        AND t.metadata->>'developerAppId' = ${developerAppId}
    `;
    return Number(rows[0]?.total) || 0;
  }

  private async dailyWalletSpend(
    userId: string,
    developerAppId: string,
    start: Date,
    end: Date,
  ) {
    return this.prisma.$queryRaw<{ date: Date; total: number }[]>`
      SELECT DATE(t."createdAt") AS date, COALESCE(SUM(t.amount), 0)::int AS total
      FROM wallet_transactions t
      INNER JOIN developer_wallets w ON w.id = t."walletId"
      WHERE w."userId" = ${userId}
        AND t.type = 'MESSAGE_CHARGE'
        AND t.status = 'COMPLETED'
        AND t."createdAt" >= ${start}
        AND t."createdAt" <= ${end}
        AND t.metadata->>'developerAppId' = ${developerAppId}
      GROUP BY DATE(t."createdAt")
      ORDER BY date ASC
    `;
  }
}
