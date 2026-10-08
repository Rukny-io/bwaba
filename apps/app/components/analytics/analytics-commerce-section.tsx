'use client';

import { AnalyticsCommerceTables } from '@/components/analytics/analytics-commerce-tables';
import { AnalyticsSalesChart } from '@/components/analytics/analytics-sales-chart';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import type { WeeklySalesDay } from '@/lib/commerce/types';
import { formatCurrency, formatNumber } from '@/lib/dashboard-format';

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

export function AnalyticsCommerceSection({
  weeklySales,
  topProducts,
  lowStockProducts,
  recentOrders,
  orderStats,
  productStats,
  isLoading,
}: AnalyticsCommerceSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardSurface as="article" className="xl:col-span-2" padding="md">
          <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">مبيعات الأسبوع</h3>
          <AnalyticsSalesChart days={weeklySales} height={220} />
        </DashboardSurface>

        <DashboardSurface as="article" padding="md">
          <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">حالة المخزون</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5">
              <span className="text-[var(--muted-foreground)]">مخزون منخفض</span>
              <span className="font-semibold tabular-nums text-[var(--warning)]" dir="ltr">
                {formatNumber(productStats.lowStock)}
              </span>
            </li>
            <li className="flex justify-between rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5">
              <span className="text-[var(--muted-foreground)]">نفد المخزون</span>
              <span className="font-semibold tabular-nums text-[var(--danger)]" dir="ltr">
                {formatNumber(productStats.outOfStock)}
              </span>
            </li>
            <li className="flex justify-between rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5">
              <span className="text-[var(--muted-foreground)]">طلبات معلّقة</span>
              <span className="font-semibold tabular-nums" dir="ltr">
                {formatNumber(orderStats.pendingOrders)}
              </span>
            </li>
            <li className="flex justify-between rounded-xl bg-[var(--surface-secondary)] px-3 py-2.5">
              <span className="text-[var(--muted-foreground)]">إجمالي الإيرادات</span>
              <span className="font-semibold tabular-nums" dir="ltr">
                {formatCurrency(orderStats.totalRevenue)}
              </span>
            </li>
          </ul>
        </DashboardSurface>
      </div>

      <AnalyticsCommerceTables
        topProducts={topProducts}
        recentOrders={recentOrders}
        isLoading={isLoading}
      />

      {lowStockProducts.length > 0 ? (
        <DashboardSurface
          as="article"
          padding="md"
          className="border border-[color-mix(in_oklab,var(--warning)_35%,transparent)]"
        >
          <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
            منتجات بمخزون منخفض
          </h3>
          <ul className="flex flex-wrap gap-2">
            {lowStockProducts.map((product) => (
              <li
                key={product.id}
                className="rounded-full border border-[color-mix(in_oklab,var(--warning)_30%,transparent)] bg-[color-mix(in_oklab,var(--warning)_8%,transparent)] px-3 py-1.5 text-xs"
              >
                <span className="font-medium text-[var(--foreground)]">{product.name}</span>
                <span className="ms-1.5 tabular-nums text-[var(--warning)]" dir="ltr">
                  {formatNumber(product.quantity)} متبقي
                </span>
              </li>
            ))}
          </ul>
        </DashboardSurface>
      ) : null}
    </div>
  );
}
