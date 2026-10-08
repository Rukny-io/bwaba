'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
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
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

function AnalyticsCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col gap-4 rounded-xl bg-[var(--surface)] p-4 sm:p-5',
        className,
      )}
    >
      {title || action ? (
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-[13px] font-semibold tracking-tight text-[var(--foreground)]">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm leading-relaxed text-[var(--muted-foreground)]">
                {description}
              </p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-20 animate-pulse rounded-xl bg-[var(--surface-secondary)]" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[7.25rem] animate-pulse rounded-xl bg-[var(--surface-secondary)] sm:h-28"
          />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-xl bg-[var(--surface-secondary)] sm:h-64" />
    </div>
  );
}

export function AnalyticsOverviewView() {
  const { t } = useTranslations();
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
      setError(
        e instanceof ApiException ? e.message : t('analytics.loadFailed'),
      );
    } finally {
      setLoading(false);
    }
  }, [days, t]);

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
        message={error ?? t('analytics.noData')}
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
  const insights = buildAppInsights({ analytics, commerce, links, t });
  const refreshing = loading && Boolean(data);
  const rangeLabel = `${formatShortDate(period.startDate)} — ${formatShortDate(period.endDate)}`;

  return (
    <div
      className={cn(
        'flex w-full min-w-0 flex-col gap-4',
        refreshing && 'pointer-events-none opacity-60',
      )}
    >
      <AnalyticsCard>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              {t('analytics.title')}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">
              {t('analytics.pageDescription', { range: rangeLabel })}
            </p>
          </div>
          <AnalyticsPeriodPicker value={days} onChange={setDays} className="shrink-0" />
        </div>
      </AnalyticsCard>

      <DashboardInsightsPanel insights={insights} />

      <AnalyticsCard
        title={t('analytics.pageSection')}
        description={t('analytics.pageSectionDesc')}
      >
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <DashboardMetricCard
            icon={MousePointerClick}
            label={t('analytics.linkClicks')}
            value={formatNumber(summary.totalClicks)}
            trend={formatTrendBadge(summary.changes.clicks)}
            trendPositive={summary.changes.clicks >= 0}
            comparisonPrimary={t('analytics.inPeriod')}
            comparisonSecondary={t('analytics.vsPrevious')}
          />
          <DashboardMetricCard
            icon={Eye}
            label={t('analytics.pageViews')}
            value={formatNumber(summary.totalLinkViews)}
            comparisonPrimary={t('analytics.totalViews')}
            comparisonSecondary={t('analytics.acrossLinks')}
          />
          <DashboardMetricCard
            icon={Link2}
            label={t('analytics.activeLinks')}
            value={formatNumber(links.filter((l) => l.status === 'active').length)}
            comparisonPrimary={t('analytics.visibleToVisitors')}
            comparisonSecondary={t('analytics.ofTotal', {
              n: formatNumber(summary.linksCount),
            })}
          />
          <DashboardMetricCard
            icon={AlertTriangle}
            iconClassName="text-[var(--warning)]"
            label={t('analytics.hiddenLinks')}
            value={formatNumber(hiddenLinks.length)}
            comparisonPrimary={t('analytics.notVisible')}
            comparisonSecondary={t('analytics.toVisitorsNow')}
          />
        </div>
      </AnalyticsCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <AnalyticsCard title={t('analytics.dailyTrend')} className="xl:col-span-2">
          <AnalyticsTrendChart data={toTrendPoints(analytics.chartData)} height={220} />
        </AnalyticsCard>
        <AnalyticsCard title={t('analytics.devices')}>
          <AnalyticsDeviceBreakdown items={toDeviceItems(analytics.deviceBreakdown)} />
        </AnalyticsCard>
      </div>

      <AnalyticsCard>
        <AnalyticsCountryBreakdown items={toCountryItems(analytics.countryBreakdown)} />
      </AnalyticsCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsCard title={t('analytics.topLinks')}>
          {analytics.topLinks.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              {t('analytics.noClicksInPeriod')}
            </p>
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
                        {t('analytics.clicksLabel', {
                          n: formatNumber(link.clicks),
                          platform: link.platform,
                        })}
                      </p>
                    </div>
                    <ArrowLeft className="size-4 shrink-0 text-[var(--muted-foreground)] rtl:rotate-180" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </AnalyticsCard>

        <AnalyticsCard title={t('analytics.needsAttention')}>
          {hiddenLinks.length === 0 &&
          referrers.length === 0 &&
          commerce.lowStockProducts.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              {t('analytics.allGoodPeriod')}
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
                      {t('analytics.lowStockLeft', {
                        n: formatNumber(product.quantity),
                      })}
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
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {t('analytics.linkHidden')}
                    </p>
                  </Link>
                </li>
              ))}
              {referrers.slice(0, 2).map((ref) => (
                <li key={ref.referrer}>
                  <div className="rounded-xl border border-[color-mix(in_oklab,var(--border)_50%,transparent)] bg-[var(--surface-secondary)] px-3 py-2.5">
                    <p className="text-sm font-medium">
                      {t('analytics.sourceLabel', { name: ref.referrer })}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {t('analytics.clicksPercent', {
                        n: formatNumber(ref.clicks),
                        pct: ref.percentage,
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AnalyticsCard>
      </div>

      <AnalyticsCard
        title={t('analytics.allLinks')}
        action={
          <Link
            href="/app/links"
            className="text-[12px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            {t('analytics.manageLinks')}
          </Link>
        }
      >
        <AnalyticsLinksTable links={links} isLoading={refreshing} />
      </AnalyticsCard>

      <AnalyticsCard
        title={t('analytics.storeSection')}
        description={t('analytics.storeSectionDesc')}
      >
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <DashboardMetricCard
            icon={ShoppingBag}
            label={t('analytics.totalOrders')}
            value={formatNumber(orderStats.totalOrders)}
            comparisonPrimary={t('analytics.pendingCount', {
              n: formatNumber(orderStats.pendingOrders),
            })}
            comparisonSecondary={formatCurrency(orderStats.totalRevenue)}
          />
          <DashboardMetricCard
            icon={Package}
            label={t('analytics.activeProducts')}
            value={formatNumber(productStats.activeProducts)}
            comparisonPrimary={t('analytics.totalCount', {
              n: formatNumber(productStats.totalProducts),
            })}
            comparisonSecondary={
              productStats.lowStock > 0
                ? t('analytics.lowStockCount', {
                    n: formatNumber(productStats.lowStock),
                  })
                : t('analytics.stockHealthy')
            }
          />
          <DashboardMetricCard
            icon={AlertTriangle}
            iconClassName="text-[var(--warning)]"
            label={t('analytics.outOfStock')}
            value={formatNumber(productStats.outOfStock)}
            comparisonPrimary={t('analytics.unavailableProducts')}
            comparisonSecondary={t('analytics.needRestock')}
          />
          <DashboardMetricCard
            icon={ShoppingBag}
            label={t('analytics.completedOrders')}
            value={formatNumber(orderStats.completedOrders)}
            comparisonPrimary={t('analytics.delivered')}
            comparisonSecondary={t('analytics.processingCount', {
              n: formatNumber(orderStats.processingOrders),
            })}
          />
        </div>
      </AnalyticsCard>

      <AnalyticsCommerceSection
        weeklySales={commerce.weeklySales}
        topProducts={commerce.topProducts}
        lowStockProducts={commerce.lowStockProducts}
        recentOrders={commerce.recentOrders}
        orderStats={orderStats}
        productStats={productStats}
        isLoading={refreshing}
      />
    </div>
  );
}
