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
import { AnalyticsLinksTable } from '@/components/analytics/analytics-links-table';
import {
  AnalyticsPeriodPicker,
  type AnalyticsPeriodDays,
} from '@/components/analytics/analytics-period-picker';
import { AnalyticsTrendChart } from '@/components/analytics/analytics-trend-chart';
import { DashboardErrorState } from '@/components/app/dashboard-error-state';
import { DashboardInsightsPanel } from '@/components/app/dashboard-insights-panel';
import { DashboardMetricCard } from '@/components/app/dashboard-metric-card';
import {
  DashboardPanel,
  DashboardSection,
} from '@/components/app/dashboard-section';
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
import { cn } from '@/lib/utils';

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div className="h-16 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[7.25rem] animate-pulse rounded-2xl bg-[var(--surface-secondary)] sm:h-28"
          />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-2xl bg-[var(--surface-secondary)] sm:h-64" />
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
  const refreshing = loading && Boolean(data);

  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col gap-5 sm:gap-6',
        refreshing && 'pointer-events-none opacity-60',
      )}
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            التحليلات
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
            تحليل صفحتك ومتجرك — روابط، زيارات، طلبات ومبيعات ·{' '}
            <span dir="ltr" lang="en" className="tabular-nums">
              {formatShortDate(period.startDate)} — {formatShortDate(period.endDate)}
            </span>
          </p>
        </div>
        <AnalyticsPeriodPicker value={days} onChange={setDays} className="shrink-0" />
      </header>

      <DashboardInsightsPanel insights={insights} />

      <DashboardSection
        title="الصفحة والروابط"
        description="أداء صفحتك الشخصية ونقرات الزوار"
      >
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
            iconClassName="text-[var(--warning)]"
            label="روابط مخفية"
            value={formatNumber(hiddenLinks.length)}
            comparisonPrimary="غير ظاهرة"
            comparisonSecondary="للزوار حالياً"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <DashboardSurface as="article" className="xl:col-span-2" padding="md">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
              الاتجاه اليومي للنقرات
            </h3>
            <AnalyticsTrendChart data={toTrendPoints(analytics.chartData)} height={220} />
          </DashboardSurface>

          <DashboardSurface as="article" padding="md">
            <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">الأجهزة</h3>
            <AnalyticsDeviceBreakdown items={toDeviceItems(analytics.deviceBreakdown)} />
          </DashboardSurface>
        </div>

        <DashboardSurface as="article" padding="md">
          <AnalyticsCountryBreakdown items={toCountryItems(analytics.countryBreakdown)} />
        </DashboardSurface>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DashboardSurface as="article" padding="md">
            <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">أفضل الروابط</h3>
            {analytics.topLinks.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">لا توجد نقرات في هذه الفترة</p>
            ) : (
              <ul className="space-y-2">
                {analytics.topLinks.map((link, i) => (
                  <li key={link.id}>
                    <Link
                      href="/app/links"
                      className="flex items-center gap-3 rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5 hover:bg-[color-mix(in_oklab,var(--surface-secondary)_80%,var(--surface))]"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--primary)_14%,transparent)] text-xs font-bold text-[var(--primary)]">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">
                          {link.title}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          <span dir="ltr" className="tabular-nums">
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

          <DashboardSurface as="article" padding="md">
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
                      className="block rounded-xl border border-[color-mix(in_oklab,var(--warning)_25%,transparent)] bg-[color-mix(in_oklab,var(--warning)_6%,transparent)] px-3 py-2.5"
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
                      className="block rounded-xl border border-[color-mix(in_oklab,var(--warning)_25%,transparent)] bg-[color-mix(in_oklab,var(--warning)_6%,transparent)] px-3 py-2.5"
                    >
                      <p className="text-sm font-medium">{link.title ?? link.platform}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">الرابط مخفي عن الزوار</p>
                    </Link>
                  </li>
                ))}
                {referrers.slice(0, 2).map((ref) => (
                  <li key={ref.referrer}>
                    <div className="rounded-xl border border-[color-mix(in_oklab,var(--border)_50%,transparent)] bg-[var(--surface-secondary)] px-3 py-2.5">
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

        <DashboardPanel className="flex flex-col gap-3 border-t-0 pt-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">كل الروابط</h3>
            <Link
              href="/app/links"
              className="text-[12px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              إدارة الروابط
            </Link>
          </div>
          <AnalyticsLinksTable links={links} isLoading={refreshing} />
        </DashboardPanel>
      </DashboardSection>

      <DashboardSection
        title="المتجر والمبيعات"
        description="الطلبات، المنتجات، المخزون والإيرادات"
      >
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
            iconClassName="text-[var(--warning)]"
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
          isLoading={refreshing}
        />
      </DashboardSection>
    </div>
  );
}
