import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { CacheManager } from '../../../core/cache/cache.manager';

export type CommerceRange = '7d' | '30d' | '90d';

interface RevenueRow {
  day: Date;
  orders: number;
  revenue: number;
}

interface TopStoreRow {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  orders: number;
  revenue: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheManager,
  ) {}

  private parseRange(range: string): { key: CommerceRange; days: number; start: Date } {
    const key: CommerceRange =
      range === '7d' ? '7d' : range === '90d' ? '90d' : '30d';
    const days = key === '7d' ? 7 : key === '90d' ? 90 : 30;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));
    return { key, days, start };
  }

  private buildDateSeries(days: number): string[] {
    const dates: string[] = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    cursor.setDate(cursor.getDate() - (days - 1));

    for (let i = 0; i < days; i++) {
      dates.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }

  async getCommerceAnalytics(range = '30d', storeLimit = 5) {
    const { key, days, start } = this.parseRange(range);
    const limit = Math.min(Math.max(storeLimit, 1), 20);

    return this.cache.wrap(
      `admin:commerce-analytics:${key}:${limit}`,
      300,
      async () => {
        const [revenueRows, topStoreRows] = await Promise.all([
          this.prisma.$queryRawUnsafe<RevenueRow[]>(
            `
            SELECT
              date_trunc('day', o."createdAt")::date AS day,
              COUNT(*)::int AS orders,
              COALESCE(SUM(o.total), 0)::float AS revenue
            FROM orders o
            WHERE o."createdAt" >= $1
              AND o.status NOT IN ('CANCELLED', 'REFUNDED')
            GROUP BY day
            ORDER BY day ASC
          `,
            start,
          ),
          this.prisma.$queryRawUnsafe<TopStoreRow[]>(
            `
            SELECT
              s.id,
              s.name,
              s.slug,
              s.logo,
              COUNT(o.id)::int AS orders,
              COALESCE(SUM(o.total), 0)::float AS revenue
            FROM orders o
            INNER JOIN stores s ON s.id = o."storeId"
            WHERE o."createdAt" >= $1
              AND o.status NOT IN ('CANCELLED', 'REFUNDED')
            GROUP BY s.id, s.name, s.slug, s.logo
            ORDER BY revenue DESC
            LIMIT $2
          `,
            start,
            limit,
          ),
        ]);

        const byDate = new Map(
          revenueRows.map((row) => [
            new Date(row.day).toISOString().slice(0, 10),
            {
              orders: row.orders,
              revenue: row.revenue,
            },
          ]),
        );

        const revenueTrend = this.buildDateSeries(days).map((date) => {
          const point = byDate.get(date);
          return {
            date,
            orders: point?.orders ?? 0,
            revenue: point?.revenue ?? 0,
          };
        });

        const topStores = topStoreRows.map((row) => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          logo: row.logo ?? undefined,
          orders: row.orders,
          revenue: row.revenue,
        }));

        const totals = revenueTrend.reduce(
          (acc, point) => ({
            orders: acc.orders + point.orders,
            revenue: acc.revenue + point.revenue,
          }),
          { orders: 0, revenue: 0 },
        );

        return {
          range: key,
          revenueTrend,
          topStores,
          totals,
        };
      },
    );
  }
}
