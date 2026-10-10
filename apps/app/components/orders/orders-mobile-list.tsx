'use client';

import Link from 'next/link';
import { Card } from '@heroui/react';
import { ShoppingBag } from 'lucide-react';
import { OrderCustomerCell } from '@/components/orders/order-customer-cell';
import { OrderPaymentBadge } from '@/components/orders/order-payment-badge';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import type { StoreOrder } from '@/lib/orders/types';
import {
  formatCurrency,
  formatNumber,
  formatRelativeTime,
} from '@/lib/dashboard-format';
import { getOrderDisplayNumber } from '@/lib/orders/order-display';
import { useTranslations } from '@/lib/i18n';

interface OrdersMobileListProps {
  orders: StoreOrder[];
  isLoading?: boolean;
  emptyMessage: string;
}

function OrdersMobileSkeleton() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <li key={`mobile-loading-${index}`}>
          <Card variant="secondary" className="h-[7.25rem] animate-pulse gap-0 p-3.5">
            <span className="sr-only">جاري التحميل</span>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function OrdersMobileCard({ order }: { order: StoreOrder }) {
  const { t } = useTranslations();
  const orderNumber = getOrderDisplayNumber(order);

  const method = order.paymentMethod || 'CASH';
  const methodPath = `orders.paymentMethod.${method}`;
  const translatedMethod = t(methodPath);
  const methodLabel =
    translatedMethod === methodPath ? method : translatedMethod;

  return (
    <Link
      href={`/app/orders/${encodeURIComponent(order.id)}`}
      className="block rounded-[inherit] transition-transform active:scale-[0.99]"
    >
      <Card variant="secondary" className="gap-0 p-3.5">
        <Card.Content className="flex flex-col gap-3 p-0">
          <div className="flex items-center justify-between gap-3">
            <span
              className="truncate text-[12px] font-semibold tabular-nums tracking-wide text-[var(--foreground)]"
              dir="ltr"
            >
              {orderNumber}
            </span>
            <time
              className="shrink-0 text-[11px] text-[var(--muted-foreground)]"
              dateTime={order.createdAt}
            >
              {formatRelativeTime(order.createdAt)}
            </time>
          </div>

          <OrderCustomerCell order={order} showOrderNumber={false} />

          <div className="flex items-end justify-between gap-3 border-t border-[var(--border)] pt-2.5">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
                <OrderStatusBadge status={order.status} />
                <OrderPaymentBadge
                  order={order}
                  compact
                  className="items-start"
                />
              </div>
              <p className="truncate text-[11px] text-[var(--muted-foreground)]">
                <span>{methodLabel}</span>
                {order.itemsCount ? (
                  <>
                    <span className="mx-1.5 text-[var(--border)]" aria-hidden>
                      ·
                    </span>
                    <span>
                      {formatNumber(order.itemsCount)} منتج
                    </span>
                  </>
                ) : null}
              </p>
            </div>

            <p
              className="shrink-0 text-[15px] font-semibold tabular-nums leading-none text-[var(--foreground)]"
              dir="ltr"
            >
              {formatCurrency(order.total, order.currency)}
            </p>
          </div>
        </Card.Content>
      </Card>
    </Link>
  );
}

export function OrdersMobileList({
  orders,
  isLoading,
  emptyMessage,
}: OrdersMobileListProps) {
  if (isLoading) {
    return <OrdersMobileSkeleton />;
  }

  if (orders.length === 0) {
    return (
      <Card variant="secondary" className="px-4 py-10 text-center">
        <ShoppingBag
          className="mx-auto mb-3 size-8 text-[var(--muted-foreground)]/70"
          strokeWidth={1.5}
          aria-hidden
        />
        <p className="text-sm font-medium text-[var(--foreground)]">لا توجد طلبات</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <ul className="space-y-2">
      {orders.map((order) => (
        <li key={order.id}>
          <OrdersMobileCard order={order} />
        </li>
      ))}
    </ul>
  );
}
