'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AnalyticsSalesChart } from '@/components/analytics/analytics-sales-chart';
import { dashboardPagePanelClass } from '@/components/app/dashboard-page-frame';
import { formatCurrency, formatNumber } from '@/lib/dashboard-format';
import { useTranslations } from '@/lib/i18n';
import type { CommerceSnapshot } from '@/lib/commerce/types';
import { cn } from '@/lib/utils';

interface DashboardHomeStorePanelProps {
  commerce: CommerceSnapshot;
}

export function DashboardHomeStorePanel({ commerce }: DashboardHomeStorePanelProps) {
  const { t, locale } = useTranslations();
  const { orderStats, productStats, lowStockProducts, weeklySales } = commerce;

  return (
    <article className={cn(dashboardPagePanelClass, 'gap-4')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            {t('home.store')}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {t('home.storeHint')}
          </p>
        </div>
        <Link
          href="/app/analytics"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
        >
          {t('home.viewAnalytics')}
          <ArrowLeft className="size-3.5 rtl:rotate-180" />
        </Link>
      </div>

      <div className="mb-4 rounded-lg bg-[var(--surface-secondary)] p-3 sm:p-4">
        <AnalyticsSalesChart days={weeklySales} height={160} />
      </div>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <li className="rounded-lg border border-[var(--border)] px-3 py-2.5">
          <p className="text-xs text-[var(--muted-foreground)]">
            {t('home.pendingOrdersLabel')}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--foreground)]">
            {formatNumber(orderStats.pendingOrders, locale)}
          </p>
        </li>
        <li className="rounded-lg border border-[var(--border)] px-3 py-2.5">
          <p className="text-xs text-[var(--muted-foreground)]">
            {t('home.lowStockLabel')}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--foreground)]">
            {formatNumber(productStats.lowStock, locale)}
          </p>
        </li>
        <li className="rounded-lg border border-[var(--border)] px-3 py-2.5">
          <p className="text-xs text-[var(--muted-foreground)]">
            {t('home.totalRevenue')}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--foreground)]">
            {formatCurrency(orderStats.totalRevenue, 'IQD', locale)}
          </p>
        </li>
      </ul>

      {lowStockProducts.length > 0 ? (
        <p className="mt-3 rounded-lg bg-[color-mix(in_srgb,var(--warning)_10%,var(--surface))] px-3 py-2 text-xs text-[var(--foreground)]">
          {t('home.lowStockItem', {
            name: lowStockProducts[0].name,
            n: formatNumber(lowStockProducts[0].quantity, locale),
          })}
        </p>
      ) : null}
    </article>
  );
}
