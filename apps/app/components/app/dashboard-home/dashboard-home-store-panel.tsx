import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AnalyticsSalesChart } from '@/components/analytics/analytics-sales-chart';
import { dashboardPagePanelClass } from '@/components/app/dashboard-page-frame';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/lib/dashboard-format';
import type { CommerceSnapshot } from '@/lib/commerce/types';

interface DashboardHomeStorePanelProps {
  commerce: CommerceSnapshot;
}

export function DashboardHomeStorePanel({ commerce }: DashboardHomeStorePanelProps) {
  const { orderStats, productStats, lowStockProducts, weeklySales } = commerce;

  return (
    <article className={cn(dashboardPagePanelClass, 'gap-4')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-[var(--foreground)]">المتجر</h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            مبيعات الأسبوع والطلبات
          </p>
        </div>
        <Link
          href="/app/analytics"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
        >
          التحليلات
          <ArrowLeft className="size-3.5" />
        </Link>
      </div>

      <div className="mb-4 rounded-lg bg-[var(--surface-secondary)] p-3 sm:p-4">
        <AnalyticsSalesChart days={weeklySales} height={160} />
      </div>

      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <li className="rounded-lg border border-[var(--border)] px-3 py-2.5">
          <p className="text-xs text-[var(--muted-foreground)]">طلبات معلّقة</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--foreground)]">
            {formatNumber(orderStats.pendingOrders)}
          </p>
        </li>
        <li className="rounded-lg border border-[var(--border)] px-3 py-2.5">
          <p className="text-xs text-[var(--muted-foreground)]">مخزون منخفض</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--foreground)]">
            {formatNumber(productStats.lowStock)}
          </p>
        </li>
        <li className="rounded-lg border border-[var(--border)] px-3 py-2.5">
          <p className="text-xs text-[var(--muted-foreground)]">إجمالي الإيرادات</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--foreground)]">
            {formatCurrency(orderStats.totalRevenue)}
          </p>
        </li>
      </ul>

      {lowStockProducts.length > 0 ? (
        <p className="mt-3 rounded-lg bg-[color-mix(in_srgb,var(--warning)_10%,var(--surface))] px-3 py-2 text-xs text-[var(--foreground)]">
          {lowStockProducts[0].name} — متبقي{' '}
          <span className="tabular-nums">{formatNumber(lowStockProducts[0].quantity)}</span> قطعة
        </p>
      ) : null}
    </article>
  );
}
