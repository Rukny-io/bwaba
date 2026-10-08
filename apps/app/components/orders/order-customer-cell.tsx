'use client';

import { Avatar } from '@heroui/react';
import {
  getOrderCustomerContact,
  getOrderCustomerInitials,
  getOrderCustomerName,
  getOrderDisplayNumber,
} from '@/lib/orders/order-display';
import type { StoreOrder } from '@/lib/orders/types';
import { resolveAvatarUrl } from '@/lib/media-url';

interface OrderCustomerCellProps {
  order: StoreOrder;
  /** عرض رقم الطلب بجانب العميل (قائمة الجوال) */
  showOrderNumber?: boolean;
}

export function OrderCustomerCell({
  order,
  showOrderNumber = true,
}: OrderCustomerCellProps) {
  const customerName = getOrderCustomerName(order);
  const customerContact = getOrderCustomerContact(order);
  const orderNumber = getOrderDisplayNumber(order);
  const avatarUrl = resolveAvatarUrl(order.customer?.avatar ?? null);
  const initials = getOrderCustomerInitials(customerName);

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar size="sm" className="shrink-0 self-center">
        {avatarUrl ? <Avatar.Image alt={customerName} src={avatarUrl} /> : null}
        <Avatar.Fallback>{initials}</Avatar.Fallback>
      </Avatar>

      <div className="min-w-0 flex-1 text-start">
        <p className="truncate text-sm font-medium text-[var(--foreground)]">
          {customerName}
        </p>
        {customerContact ? (
          <p className="mt-0.5 truncate text-[11px] leading-tight text-[var(--muted-foreground)]">
            <bdi dir="ltr" className="inline-block max-w-full truncate">
              {customerContact}
            </bdi>
          </p>
        ) : !showOrderNumber ? (
          <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">—</p>
        ) : null}
      </div>

      {showOrderNumber ? (
        <span
          className="shrink-0 text-[12px] tabular-nums text-[var(--muted-foreground)]"
          dir="ltr"
        >
          {orderNumber}
        </span>
      ) : null}
    </div>
  );
}
