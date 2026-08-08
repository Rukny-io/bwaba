'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Eye,
  Link2,
  MousePointerClick,
  Package,
  ShoppingBag,
} from 'lucide-react';
import { AnalyticsCommerceSection } from '@/components/analytics/analytics-commerce-section';
import { AnalyticsCountryBreakdown } from '@/components/analytics/analytics-country-breakdown';
import { AnalyticsDeviceBreakdown } from '@/components/analytics/analytics-device-breakdown';
import {
  AnalyticsPeriodPicker,
  type AnalyticsPeriodDays,
} from '@/components/analytics/analytics-period-picker';
import { AnalyticsTrendChart } from '@/components/analytics/analytics-trend-chart';
import { DashboardErrorState } from '@/components/app/dashboard-error-state';
import { DashboardInsightsPanel } from '@/components/app/dashboard-insights-panel';
import { DashboardMetricCard } from '@/components/app/dashboard-metric-card';
import { DashboardPageHeader } from '@/components/app/dashboard-page-header';
import { DashboardSectionHeader } from '@/components/app/dashboard-section-header';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import { getFullAppAnalytics, type FullAppAnalytics } from '@/lib/analytics/api';
import { buildAppInsights } from '@/lib/analytics/insights';
import {
  getPeriodLabel,
  toCountryItems,
  toDeviceItems,
  toReferrerItems,
  toTrendPoints,
} from '@/lib/analytics/types';
import { ApiException } from '@/lib/api-client';
import {
  formatCurrency,
  formatNumber,
  formatShortDate,
  formatTrendBadge,
} from '@/lib/dashboard-format';
import { Table } from '@heroui/react';
import { appDetailCardSurfaceClass } from '@/lib/app-detail-styles';
import { cn } from '@/lib/utils';

function AnalyticsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-64 animate-pulse rounded-full bg-[var(--surface-secondary)]" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[7.25rem] animate-pulse rounded-4xl bg-[var(--surface-secondary)] sm:h-28"
          />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-4xl bg-[var(--surface-secondary)] sm:h-64" />
    </div>
  );
}

export function AnalyticsOverviewView() {
  const [days, setDays] = useState<AnalyticsPeriodDays>(30);
  const [data, setData] = useState<FullAppAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFullAppAnalytics(days);
      setData(res);
    } catch (e) {
      setError(e instanceof ApiException ? e.message : 'تعذّر تحميل التحليلات');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return <AnalyticsSkeleton />;
  }

  if (error || !data) {
    return (
      <DashboardErrorState
        variant="inline"
        message={error ?? 'لا توجد بيانات'}
        onRetry={() => void load()}
      />
    );
  }

  const { analytics, commerce, links } = data;
  const { summary } = analytics;
  const { orderStats, productStats } = commerce;
  const period = getPeriodLabel(days);
  const referrers = toReferrerItems(analytics.referrerBreakdown);
  const hiddenLinks = links.filter((l) => l.status === 'hidden');
  const insights = buildAppInsights({ analytics, commerce, links });

  return (
    <>
      <DashboardPageHeader
        title="تحليلات"
        description={
          <>
            تحليل ذكي لصفحتك ومتجرك — روابط، طلبات، منتجات ومخزون ·{' '}
            <span dir="ltr" lang="en" className="tabular-nums">
              {formatShortDate(period.startDate)} — {formatShortDate(period.endDate)}
            </span>
          </>
        }
        actions={<AnalyticsPeriodPicker value={days} onChange={setDays} />}
      />

      <DashboardInsightsPanel insights={insights} />

      <section className="flex flex-col gap-3 sm:gap-4">
        <DashboardSectionHeader
          title="الصفحة والروابط"
          description="أداء صفحتك الشخصية ونقرات الزوار"
          href="/app/links"
        />

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <DashboardMetricCard
            icon={MousePointerClick}
            label="نقرات الروابط"
            value={formatNumber(summary.totalClicks)}
            trend={formatTrendBadge(summary.changes.clicks)}
            trendPositive={summary.changes.clicks >= 0}
            comparisonPrimary="في الفترة"
            comparisonSecondary="مقابل السابقة"
          />
          <DashboardMetricCard
            icon={Eye}
            label="زيارات الصفحة"
            value={formatNumber(summary.totalLinkViews)}
            comparisonPrimary="إجمالي المشاهدات"
            comparisonSecondary="على جميع الروابط"
          />
          <DashboardMetricCard
            icon={Link2}
            label="روابط نشطة"
            value={formatNumber(links.filter((l) => l.status === 'active').length)}
            comparisonPrimary="ظاهرة للزوار"
            comparisonSecondary={`من ${summary.linksCount}`}
          />
          <DashboardMetricCard
            icon={AlertTriangle}
            label="روابط مخفية"
            value={formatNumber(hiddenLinks.length)}
            comparisonPrimary="غير ظاهرة"
            comparisonSecondary="للزوار حالياً"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-3">
          <DashboardSurface as="article" className="xl:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)] sm:mb-4">
              الاتجاه اليومي للنقرات
            </h3>
            <AnalyticsTrendChart data={toTrendPoints(analytics.chartData)} height={220} />
          </DashboardSurface>

          <DashboardSurface as="article">
            <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">الأجهزة</h3>
            <AnalyticsDeviceBreakdown items={toDeviceItems(analytics.deviceBreakdown)} />
          </DashboardSurface>
        </div>

        <DashboardSurface as="article">
          <AnalyticsCountryBreakdown items={toCountryItems(analytics.countryBreakdown)} />
        </DashboardSurface>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
          <DashboardSurface as="article">
            <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">أفضل الروابط</h3>
            {analytics.topLinks.length === 0 ? (
              <p className="text-sm italic text-[var(--muted-foreground)]">
                لا توجد نقرات في هذه الفترة
              </p>
            ) : (
              <ul className="space-y-2">
                {analytics.topLinks.map((link, i) => (
                  <li key={link.id}>
                    <Link
                      href="/app/links"
                      className="flex items-center gap-3 rounded-2xl bg-[var(--surface-secondary)] px-3.5 py-2.5 transition-colors hover:bg-[var(--surface-secondary)]/80"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">
                          {link.title}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          <span dir="ltr" lang="en" className="tabular-nums">
                            {formatNumber(link.clicks)}
                          </span>{' '}
                          نقرة · {link.platform}
                        </p>
                      </div>
                      <ArrowLeft className="size-4 shrink-0 text-[var(--muted-foreground)]" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </DashboardSurface>

          <DashboardSurface as="article">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
              <AlertTriangle className="size-4 text-[var(--warning)]" />
              يحتاج انتباهك
            </h3>
            {hiddenLinks.length === 0 &&
            referrers.length === 0 &&
            commerce.lowStockProducts.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">
                كل شيء يبدو جيداً في هذه الفترة.
              </p>
            ) : (
              <ul className="space-y-2">
                {commerce.lowStockProducts.slice(0, 2).map((product) => (
                  <li key={product.id}>
                    <Link
                      href="/app/products"
                      className="block rounded-2xl border border-[var(--warning)]/20 bg-[var(--warning)]/5 px-3.5 py-2.5"
                    >
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        متبقي {formatNumber(product.quantity)} قطعة فقط
                      </p>
                    </Link>
                  </li>
                ))}
                {hiddenLinks.slice(0, 2).map((link) => (
                  <li key={link.id}>
                    <Link
                      href="/app/links"
                      className="block rounded-2xl border border-[var(--warning)]/20 bg-[var(--warning)]/5 px-3.5 py-2.5"
                    >
                      <p className="text-sm font-medium">{link.title ?? link.platform}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        الرابط مخفي عن الزوار
                      </p>
                    </Link>
                  </li>
                ))}
                {referrers.slice(0, 2).map((ref) => (
                  <li key={ref.referrer}>
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]/50 px-3.5 py-2.5">
                      <p className="text-sm font-medium">مصدر: {ref.referrer}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {formatNumber(ref.clicks)} نقرة ({ref.percentage}%)
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </DashboardSurface>
        </div>

        <div className={appDetailCardSurfaceClass}>
          <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">كل الروابط</h3>
          {links.length === 0 ? (
            <p className="text-sm italic text-[var(--muted-foreground)]">لا توجد روابط بعد</p>
          ) : (
            <Table variant="secondary">
              <Table.ScrollContainer>
                <Table.Content
                  aria-label="أداء الروابط"
                  className="min-w-[36rem]"
                >
                  <Table.Header>
                    <Table.Column isRowHeader id="title">
                      الرابط
                    </Table.Column>
                    <Table.Column id="status">الحالة</Table.Column>
                    <Table.Column id="platform">المنصة</Table.Column>
                    <Table.Column id="views" className="text-end">
                      مشاهدات
                    </Table.Column>
                    <Table.Column id="clicks" className="text-end">
                      نقرات
                    </Table.Column>
                  </Table.Header>
                  <Table.Body items={links}>
                    {(link) => (
                      <Table.Row id={link.id}>
                        <Table.Cell>
                          <Link
                            href="/app/links"
                            className="font-medium text-[var(--foreground)] hover:text-[var(--primary)]"
                          >
                            {link.title ?? link.platform}
                          </Link>
                        </Table.Cell>
                        <Table.Cell>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-medium',
                              link.status === 'active'
                                ? 'bg-[var(--success)]/15 text-[var(--success)]'
                                : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
                            )}
                          >
                            {link.status === 'active' ? 'نشط' : 'مخفي'}
                          </span>
                        </Table.Cell>
                        <Table.Cell className="text-[var(--muted-foreground)]">
                          {link.platform}
                        </Table.Cell>
                        <Table.Cell className="text-end tabular-nums">
                          {formatNumber(link.views)}
                        </Table.Cell>
                        <Table.Cell className="text-end font-medium tabular-nums">
                          {formatNumber(link.totalClicks)}
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3 sm:gap-4">
        <DashboardSectionHeader
          title="المتجر والمبيعات"
          description="الطلبات، المنتجات، المخزون والإيرادات"
          href="/app/orders"
        />

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <DashboardMetricCard
            icon={ShoppingBag}
            label="إجمالي الطلبات"
            value={formatNumber(orderStats.totalOrders)}
            comparisonPrimary={`${formatNumber(orderStats.pendingOrders)} معلّقة`}
            comparisonSecondary={formatCurrency(orderStats.totalRevenue)}
          />
          <DashboardMetricCard
            icon={Package}
            label="منتجات نشطة"
            value={formatNumber(productStats.activeProducts)}
            comparisonPrimary={`${formatNumber(productStats.totalProducts)} إجمالي`}
            comparisonSecondary={
              productStats.lowStock > 0
                ? `${formatNumber(productStats.lowStock)} مخزون منخفض`
                : 'مخزون جيد'
            }
          />
          <DashboardMetricCard
            icon={AlertTriangle}
            label="نفد المخزون"
            value={formatNumber(productStats.outOfStock)}
            comparisonPrimary="منتجات غير متاحة"
            comparisonSecondary="تحتاج إعادة تخزين"
          />
          <DashboardMetricCard
            icon={ShoppingBag}
            label="طلبات مكتملة"
            value={formatNumber(orderStats.completedOrders)}
            comparisonPrimary="تم تسليمها"
            comparisonSecondary={`${formatNumber(orderStats.processingOrders)} قيد المعالجة`}
          />
        </div>

        <AnalyticsCommerceSection
          weeklySales={commerce.weeklySales}
          topProducts={commerce.topProducts}
          lowStockProducts={commerce.lowStockProducts}
          recentOrders={commerce.recentOrders}
          orderStats={orderStats}
          productStats={productStats}
        />
      </section>
    </>
  );
}
