'use client';

import Link from 'next/link';
import { Card, Chip } from '@heroui/react';
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
          <Card variant="secondary" className="h-[7.5rem] animate-pulse gap-0 p-3">
            <span className="sr-only">جاري التحميل</span>
          </Card>
        </li>
      ))}
    </ul>
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
          <Link
            href={`/app/orders/${encodeURIComponent(order.id)}`}
            className="block rounded-[inherit] transition-transform active:scale-[0.99]"
          >
            <Card variant="secondary" className="gap-3 p-3">
              <Card.Content className="gap-3 p-0">
                <OrderCustomerCell order={order} />

                <div className="flex flex-wrap items-center gap-1.5">
                  <OrderStatusBadge status={order.status} className="w-auto" />
                  <OrderPaymentBadge order={order} className="items-start" />
                  {order.itemsCount ? (
                    <Chip size="sm" variant="soft">
                      {formatNumber(order.itemsCount)} منتج
                    </Chip>
                  ) : null}
                </div>

                <div className="flex items-end justify-between gap-3">
                  <p
                    className="text-sm font-semibold tabular-nums text-[var(--foreground)]"
                    dir="ltr"
                  >
                    {formatCurrency(order.total, order.currency)}
                  </p>
                  <time
                    className="shrink-0 text-[11px] text-[var(--muted-foreground)]"
                    dateTime={order.createdAt}
                  >
                    {formatRelativeTime(order.createdAt)}
                  </time>
                </div>
              </Card.Content>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
