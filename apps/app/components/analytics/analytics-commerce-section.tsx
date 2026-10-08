'use client';

import { AnalyticsCommerceTables } from '@/components/analytics/analytics-commerce-tables';
import { AnalyticsSalesChart } from '@/components/analytics/analytics-sales-chart';
import { formatCurrency, formatNumber } from '@/lib/dashboard-format';
import { useTranslations } from '@/lib/i18n';
import type { WeeklySalesDay } from '@/lib/commerce/types';
import { cn } from '@/lib/utils';

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

function Card({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-xl bg-[var(--surface)] p-4 sm:p-5',
        className,
      )}
    >
      <h3 className="text-[13px] font-semibold text-[var(--foreground)]">{title}</h3>
      {children}
    </section>
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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title={t('analytics.weeklySales')} className="xl:col-span-2">
          <AnalyticsSalesChart days={weeklySales} height={220} />
        </Card>

        <Card title={t('analytics.inventoryStatus')}>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5">
              <span className="text-[var(--muted-foreground)]">{t('analytics.lowStock')}</span>
              <span className="font-semibold tabular-nums text-[var(--warning)]" dir="ltr">
                {formatNumber(productStats.lowStock)}
              </span>
            </li>
            <li className="flex justify-between rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5">
              <span className="text-[var(--muted-foreground)]">{t('analytics.outOfStock')}</span>
              <span className="font-semibold tabular-nums text-[var(--danger)]" dir="ltr">
                {formatNumber(productStats.outOfStock)}
              </span>
            </li>
            <li className="flex justify-between rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5">
              <span className="text-[var(--muted-foreground)]">
                {t('analytics.pendingOrders')}
              </span>
              <span className="font-semibold tabular-nums" dir="ltr">
                {formatNumber(orderStats.pendingOrders)}
              </span>
            </li>
            <li className="flex justify-between rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5">
              <span className="text-[var(--muted-foreground)]">
                {t('analytics.totalRevenue')}
              </span>
              <span className="font-semibold tabular-nums" dir="ltr">
                {formatCurrency(orderStats.totalRevenue)}
              </span>
            </li>
          </ul>
        </Card>
      </div>

      <AnalyticsCommerceTables
        topProducts={topProducts}
        recentOrders={recentOrders}
        isLoading={isLoading}
      />

      {lowStockProducts.length > 0 ? (
        <Card
          title={t('analytics.lowStockProducts')}
          className="border border-[color-mix(in_oklab,var(--warning)_35%,transparent)]"
        >
          <ul className="flex flex-wrap gap-2">
            {lowStockProducts.map((product) => (
              <li
                key={product.id}
                className="rounded-full border border-[color-mix(in_oklab,var(--warning)_30%,transparent)] bg-[color-mix(in_oklab,var(--warning)_8%,transparent)] px-3 py-1.5 text-xs"
              >
                <span className="font-medium text-[var(--foreground)]">{product.name}</span>
                <span className="ms-1.5 tabular-nums text-[var(--warning)]" dir="ltr">
                  {t('analytics.remaining', { n: formatNumber(product.quantity) })}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
