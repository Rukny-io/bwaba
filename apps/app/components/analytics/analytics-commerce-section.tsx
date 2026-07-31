'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AnalyticsSalesChart } from '@/components/analytics/analytics-sales-chart';
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
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'معلّق',
  CONFIRMED: 'مؤكد',
  PROCESSING: 'قيد التجهيز',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'مكتمل',
  CANCELLED: 'ملغي',
  REFUNDED: 'مسترد',
};

export function AnalyticsCommerceSection({
  weeklySales,
  topProducts,
  lowStockProducts,
  recentOrders,
  orderStats,
  productStats,
}: AnalyticsCommerceSectionProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="dashboard-card rounded-4xl p-3 sm:p-4">
          <p className="text-xs text-[var(--muted-foreground)]">طلبات معلّقة</p>
          <p className="mt-1 text-xl font-bold tabular-nums" dir="ltr">
            {formatNumber(orderStats.pendingOrders)}
          </p>
        </div>
        <div className="dashboard-card rounded-4xl p-3 sm:p-4">
          <p className="text-xs text-[var(--muted-foreground)]">قيد المعالجة</p>
          <p className="mt-1 text-xl font-bold tabular-nums" dir="ltr">
            {formatNumber(orderStats.processingOrders)}
          </p>
        </div>
        <div className="dashboard-card rounded-4xl p-3 sm:p-4">
          <p className="text-xs text-[var(--muted-foreground)]">منتجات نشطة</p>
          <p className="mt-1 text-xl font-bold tabular-nums" dir="ltr">
            {formatNumber(productStats.activeProducts)}
          </p>
        </div>
        <div className="dashboard-card rounded-4xl p-3 sm:p-4">
          <p className="text-xs text-[var(--muted-foreground)]">إجمالي الإيرادات</p>
          <p className="mt-1 text-lg font-bold tabular-nums sm:text-xl" dir="ltr">
            {formatCurrency(orderStats.totalRevenue)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-3">
        <article className="dashboard-card rounded-4xl p-4 sm:p-5 xl:col-span-2">
          <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">مبيعات الأسبوع</h3>
          <AnalyticsSalesChart days={weeklySales} height={220} />
        </article>

        <article className="dashboard-card rounded-4xl p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">حالة المخزون</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between rounded-2xl bg-[var(--surface-secondary)] px-3 py-2">
              <span className="text-[var(--muted-foreground)]">مخزون منخفض</span>
              <span className="font-semibold tabular-nums text-[var(--warning)]" dir="ltr">
                {formatNumber(productStats.lowStock)}
              </span>
            </li>
            <li className="flex justify-between rounded-2xl bg-[var(--surface-secondary)] px-3 py-2">
              <span className="text-[var(--muted-foreground)]">نفد المخزون</span>
              <span className="font-semibold tabular-nums text-[var(--danger)]" dir="ltr">
                {formatNumber(productStats.outOfStock)}
              </span>
            </li>
            <li className="flex justify-between rounded-2xl bg-[var(--surface-secondary)] px-3 py-2">
              <span className="text-[var(--muted-foreground)]">طلبات مكتملة</span>
              <span className="font-semibold tabular-nums text-[var(--success)]" dir="ltr">
                {formatNumber(orderStats.completedOrders)}
              </span>
            </li>
          </ul>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        <article className="dashboard-card rounded-4xl p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">أفضل المنتجات</h3>
            <Link href="/app/products" className="text-xs text-[var(--primary)] hover:underline">
              المنتجات
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm italic text-[var(--muted-foreground)]">لا توجد مبيعات بعد</p>
          ) : (
            <ul className="space-y-2">
              {topProducts.map((product, i) => (
                <li
                  key={product.id}
                  className="flex items-center gap-3 rounded-2xl bg-[var(--surface-secondary)] px-3 py-2.5"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/15 text-xs font-bold text-[var(--primary)]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {formatNumber(product.ordersCount)} طلب ·{' '}
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="dashboard-card rounded-4xl p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">آخر الطلبات</h3>
            <Link href="/app/orders" className="text-xs text-[var(--primary)] hover:underline">
              الطلبات
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm italic text-[var(--muted-foreground)]">لا توجد طلبات بعد</p>
          ) : (
            <ul className="space-y-2">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href="/app/orders"
                    className="flex items-center gap-3 rounded-2xl bg-[var(--surface-secondary)] px-3 py-2.5 transition-colors hover:bg-[var(--surface-secondary)]/80"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        #{order.orderNumber ?? order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                        {order.customerName ? ` · ${order.customerName}` : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums" dir="ltr">
                      {formatCurrency(order.total, order.currency)}
                    </span>
                    <ArrowLeft className="size-4 shrink-0 text-[var(--muted-foreground)]" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      {lowStockProducts.length > 0 ? (
        <article className="dashboard-card rounded-4xl border-[var(--warning)]/30 p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
            منتجات بمخزون منخفض
          </h3>
          <ul className="flex flex-wrap gap-2">
            {lowStockProducts.map((product) => (
              <li
                key={product.id}
                className="rounded-full border border-[var(--warning)]/30 bg-[var(--warning)]/8 px-3 py-1.5 text-xs"
              >
                <span className="font-medium text-[var(--foreground)]">{product.name}</span>
                <span className="ms-1.5 tabular-nums text-[var(--warning)]" dir="ltr">
                  {formatNumber(product.quantity)} متبقي
                </span>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </div>
  );
}
