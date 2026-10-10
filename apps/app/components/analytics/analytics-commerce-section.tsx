'use client';

import Link from 'next/link';
import { AnalyticsCommerceTables } from '@/components/analytics/analytics-commerce-tables';
import { AnalyticsSalesChart } from '@/components/analytics/analytics-sales-chart';
import {
  DashboardNotice,
  DashboardSection,
} from '@/components/app/dashboard-section';
import { formatCurrency, formatNumber } from '@/lib/dashboard-format';
import { useTranslations } from '@/lib/i18n';
import type { WeeklySalesDay } from '@/lib/commerce/types';

interface AnalyticsCommerceSectionProps {
  weeklySales: WeeklySalesDay[];
  topProducts: {
    id: string;
    name: string;
    ordersCount: number;
    price: number;
  }[];
  lowStockProducts: { id: string; name: string; quantity: number }[];
  recentOrders: {
    id: string;
    orderNumber?: string | null;
    status: string;
    total: number;
    currency?: string;
    customerName?: string | null;
  }[];
  orderStats: {
    pendingOrders: number;
    processingOrders: number;
    completedOrders: number;
    totalRevenue: number;
  };
  productStats: {
    activeProducts: number;
    outOfStock: number;
    lowStock: number;
  };
  isLoading?: boolean;
}

function InventoryStatRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5 text-sm">
      <span className="text-[var(--muted-foreground)]">{label}</span>
      <span
        className={valueClassName ?? 'font-semibold tabular-nums text-[var(--foreground)]'}
        dir="ltr"
      >
        {value}
      </span>
    </li>
  );
}

export function AnalyticsCommerceSection({
  weeklySales,
  topProducts,
  lowStockProducts,
  recentOrders,
  orderStats,
  productStats,
  isLoading,
}: AnalyticsCommerceSectionProps) {
  const { t } = useTranslations();

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardSection title={t('analytics.weeklySales')} className="xl:col-span-2">
          <AnalyticsSalesChart days={weeklySales} height={220} />
        </DashboardSection>

        <DashboardSection title={t('analytics.inventoryStatus')}>
          <ul className="space-y-2">
            <InventoryStatRow
              label={t('analytics.lowStock')}
              value={formatNumber(productStats.lowStock)}
              valueClassName="font-semibold tabular-nums text-[var(--warning)]"
            />
            <InventoryStatRow
              label={t('analytics.outOfStock')}
              value={formatNumber(productStats.outOfStock)}
              valueClassName="font-semibold tabular-nums text-[var(--danger)]"
            />
            <InventoryStatRow
              label={t('analytics.pendingOrders')}
              value={formatNumber(orderStats.pendingOrders)}
            />
            <InventoryStatRow
              label={t('analytics.totalRevenue')}
              value={formatCurrency(orderStats.totalRevenue)}
            />
          </ul>
        </DashboardSection>
      </div>

      <AnalyticsCommerceTables
        topProducts={topProducts}
        recentOrders={recentOrders}
        isLoading={isLoading}
      />

      {lowStockProducts.length > 0 ? (
        <DashboardSection
          title={t('analytics.lowStockProducts')}
          action={
            <Link
              href="/app/products"
              className="text-[12px] font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
            >
              {t('analytics.manageProducts')}
            </Link>
          }
        >
          <DashboardNotice
            tone="warning"
            title={t('analytics.lowStockNoticeTitle')}
            description={t('analytics.lowStockNoticeDesc')}
          />
          <ul className="mt-1 flex flex-wrap gap-2">
            {lowStockProducts.map((product) => (
              <li
                key={product.id}
                className="rounded-lg border border-[color-mix(in_oklab,var(--warning)_30%,transparent)] bg-[color-mix(in_oklab,var(--warning)_8%,transparent)] px-3 py-1.5 text-xs"
              >
                <span className="font-medium text-[var(--foreground)]">{product.name}</span>
                <span className="ms-1.5 tabular-nums text-[var(--warning)]" dir="ltr">
                  {t('analytics.remaining', { n: formatNumber(product.quantity) })}
                </span>
              </li>
            ))}
          </ul>
        </DashboardSection>
      ) : null}
    </div>
  );
}
