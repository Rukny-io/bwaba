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
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

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
    <section className="flex min-w-0 flex-col gap-3 rounded-xl bg-[var(--surface)] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-[var(--foreground)]">{title}</h3>
        <Link
          href={href}
          className="text-[12px] font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          {linkLabel}
        </Link>
      </div>
      <div className={analyticsTableChrome.shell}>{children}</div>
    </section>
  );
}

export function AnalyticsCommerceTables({
  topProducts,
  recentOrders,
  isLoading,
}: AnalyticsCommerceTablesProps) {
  const { t } = useTranslations();

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <TableShell
        title={t('analytics.topProducts')}
        href="/app/products"
        linkLabel={t('analytics.products')}
      >
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
          >
            <TableHeader>
              <TableRow className={cn(analyticsTableChrome.headRow, 'hover:bg-transparent')}>
                <TableHead className={analyticsHeadClass('start')}>
                  {t('analytics.product')}
                </TableHead>
                <TableHead className={analyticsHeadClass('center', 'w-[5rem]')}>
                  {t('analytics.orders')}
                </TableHead>
                <TableHead className={analyticsHeadClass('center', 'w-[6rem]')}>
                  {t('analytics.price')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonRows cols={3} />
              ) : topProducts.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-sm text-[var(--muted-foreground)]"
                  >
                    {t('analytics.noSalesYet')}
                  </TableCell>
                </TableRow>
              ) : (
                topProducts.map((product) => (
                  <TableRow key={product.id} className={analyticsTableChrome.bodyRow}>
                    <TableCell className={analyticsCellClass('start', 'min-w-0 max-w-0')}>
                      <span className="block truncate text-[13px] font-medium">
                        {product.name}
                      </span>
                    </TableCell>
                    <TableCell
                      className={cn(
                        analyticsCellClass('center', 'w-[5rem]'),
                        analyticsTableChrome.numeric,
                      )}
                      dir="ltr"
                    >
                      {formatNumber(product.ordersCount)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        analyticsCellClass('center', 'w-[6rem]'),
                        analyticsTableChrome.numeric,
                        'font-semibold',
                      )}
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

      <TableShell
        title={t('analytics.recentOrders')}
        href="/app/orders"
        linkLabel={t('analytics.orders')}
      >
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
          >
            <TableHeader>
              <TableRow className={cn(analyticsTableChrome.headRow, 'hover:bg-transparent')}>
                <TableHead className={analyticsHeadClass('center', 'w-[6rem]')}>
                  {t('analytics.orderNumber')}
                </TableHead>
                <TableHead className={analyticsHeadClass('start')}>
                  {t('analytics.customer')}
                </TableHead>
                <TableHead className={analyticsHeadClass('center', 'w-[5.5rem]')}>
                  {t('analytics.status')}
                </TableHead>
                <TableHead className={analyticsHeadClass('center', 'w-[6rem]')}>
                  {t('analytics.amount')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonRows cols={4} />
              ) : recentOrders.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-sm text-[var(--muted-foreground)]"
                  >
                    {t('analytics.noOrdersYet')}
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((order) => {
                  const statusPath = `orders.status.${order.status}`;
                  const statusLabel = t(statusPath);
                  return (
                    <TableRow key={order.id} className={analyticsTableChrome.bodyRow}>
                      <TableCell
                        className={cn(
                          analyticsCellClass('center', 'w-[6rem]'),
                          analyticsTableChrome.numeric,
                          'text-[12px] font-medium',
                        )}
                        dir="ltr"
                      >
                        <Link
                          href={`/app/orders/${encodeURIComponent(order.id)}`}
                          className="hover:text-[var(--primary)]"
                        >
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
                          {statusLabel === statusPath ? order.status : statusLabel}
                        </span>
                      </TableCell>
                      <TableCell
                        className={cn(
                          analyticsCellClass('center', 'w-[6rem]'),
                          analyticsTableChrome.numeric,
                          'font-semibold',
                        )}
                        dir="ltr"
                      >
                        {formatCurrency(order.total, order.currency)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </TableShell>
    </div>
  );
}
