'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/cnippet-table';
import {
  analyticsCellClass,
  analyticsHeadClass,
  analyticsTableChrome,
} from '@/components/analytics/analytics-table-config';
import { formatCurrency, formatNumber } from '@/lib/dashboard-format';
import { cn } from '@/lib/utils';

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'معلّق',
  CONFIRMED: 'مؤكد',
  PROCESSING: 'قيد التجهيز',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'مكتمل',
  CANCELLED: 'ملغي',
  REFUNDED: 'مسترد',
};

interface TopProductRow {
  id: string;
  name: string;
  ordersCount: number;
  price: number;
}

interface RecentOrderRow {
  id: string;
  orderNumber?: string | null;
  status: string;
  total: number;
  currency?: string;
  customerName?: string | null;
}

interface AnalyticsCommerceTablesProps {
  topProducts: TopProductRow[];
  recentOrders: RecentOrderRow[];
  isLoading?: boolean;
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <TableRow key={index} className={cn(analyticsTableChrome.bodyRow, 'pointer-events-none')}>
          {Array.from({ length: cols }).map((__, col) => (
            <TableCell key={col} className={analyticsCellClass('start')}>
              <div className="h-3.5 animate-pulse rounded-md bg-[var(--surface-secondary)]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function TableShell({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
        <Link
          href={href}
          className="text-[12px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          {linkLabel}
        </Link>
      </div>
      <div className={analyticsTableChrome.shell}>{children}</div>
    </div>
  );
}

export function AnalyticsCommerceTables({
  topProducts,
  recentOrders,
  isLoading,
}: AnalyticsCommerceTablesProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <TableShell title="أفضل المنتجات" href="/app/products" linkLabel="المنتجات">
        <div className={analyticsTableChrome.scroll}>
          <Table
            variant="default"
            className={cn(
              analyticsTableChrome.table,
              'min-w-[22rem]',
              '[&_[data-slot=table-container]]:overflow-visible',
              '[&_[data-slot=table-cell]]:p-0 [&_[data-slot=table-head]]:p-0',
              '[&_[data-slot=table-body]:before]:hidden',
            )}
            dir="rtl"
          >
            <TableHeader>
              <TableRow className={cn(analyticsTableChrome.headRow, 'hover:bg-transparent')}>
                <TableHead className={analyticsHeadClass('start')}>المنتج</TableHead>
                <TableHead className={analyticsHeadClass('center', 'w-[5rem]')}>طلبات</TableHead>
                <TableHead className={analyticsHeadClass('center', 'w-[6rem]')}>السعر</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonRows cols={3} />
              ) : topProducts.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="h-24 text-center text-sm text-[var(--muted-foreground)]">
                    لا توجد مبيعات بعد
                  </TableCell>
                </TableRow>
              ) : (
                topProducts.map((product) => (
                  <TableRow key={product.id} className={analyticsTableChrome.bodyRow}>
                    <TableCell className={analyticsCellClass('start', 'min-w-0 max-w-0')}>
                      <span className="block truncate text-[13px] font-medium">{product.name}</span>
                    </TableCell>
                    <TableCell
                      className={cn(analyticsCellClass('center', 'w-[5rem]'), analyticsTableChrome.numeric)}
                      dir="ltr"
                    >
                      {formatNumber(product.ordersCount)}
                    </TableCell>
                    <TableCell
                      className={cn(analyticsCellClass('center', 'w-[6rem]'), analyticsTableChrome.numeric, 'font-semibold')}
                      dir="ltr"
                    >
                      {formatCurrency(product.price)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TableShell>

      <TableShell title="آخر الطلبات" href="/app/orders" linkLabel="الطلبات">
        <div className={analyticsTableChrome.scroll}>
          <Table
            variant="default"
            className={cn(
              analyticsTableChrome.table,
              'min-w-[24rem]',
              '[&_[data-slot=table-container]]:overflow-visible',
              '[&_[data-slot=table-cell]]:p-0 [&_[data-slot=table-head]]:p-0',
              '[&_[data-slot=table-body]:before]:hidden',
            )}
            dir="rtl"
          >
            <TableHeader>
              <TableRow className={cn(analyticsTableChrome.headRow, 'hover:bg-transparent')}>
                <TableHead className={analyticsHeadClass('center', 'w-[6rem]')}>رقم الطلب</TableHead>
                <TableHead className={analyticsHeadClass('start')}>العميل</TableHead>
                <TableHead className={analyticsHeadClass('center', 'w-[5.5rem]')}>الحالة</TableHead>
                <TableHead className={analyticsHeadClass('center', 'w-[6rem]')}>المبلغ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonRows cols={4} />
              ) : recentOrders.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="h-24 text-center text-sm text-[var(--muted-foreground)]">
                    لا توجد طلبات بعد
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((order) => (
                  <TableRow key={order.id} className={analyticsTableChrome.bodyRow}>
                    <TableCell
                      className={cn(analyticsCellClass('center', 'w-[6rem]'), analyticsTableChrome.numeric, 'text-[12px] font-medium')}
                      dir="ltr"
                    >
                      <Link href={`/app/orders/${encodeURIComponent(order.id)}`} className="hover:text-[var(--primary)]">
                        #{order.orderNumber ?? order.id.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell className={analyticsCellClass('start', 'min-w-0 max-w-0')}>
                      <span className="block truncate text-[13px]">
                        {order.customerName ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell className={analyticsCellClass('center', 'w-[5.5rem]')}>
                      <span className="text-[12px] text-[var(--muted-foreground)]">
                        {ORDER_STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(analyticsCellClass('center', 'w-[6rem]'), analyticsTableChrome.numeric, 'font-semibold')}
                      dir="ltr"
                    >
                      {formatCurrency(order.total, order.currency)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TableShell>
    </div>
  );
}
