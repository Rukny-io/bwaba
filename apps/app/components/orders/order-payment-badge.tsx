'use client';

import { getOrderPaymentStatusStyle } from '@/lib/orders/order-payment-display';
import { useTranslations } from '@/lib/i18n';
import type { StoreOrder } from '@/lib/orders/types';
import { cn } from '@/lib/utils';

interface OrderPaymentBadgeProps {
  order: StoreOrder;
  className?: string;
  /** صف واحد في الجدول */
  compact?: boolean;
}

function paymentStatusKey(status?: string | null): string {
  if (!status || status === 'PENDING' || status === 'FAILED') return 'UNPAID';
  return status;
}

export function OrderPaymentBadge({
  order,
  className,
  compact = false,
}: OrderPaymentBadgeProps) {
  const { t } = useTranslations();
  const statusStyle = getOrderPaymentStatusStyle(order.paymentStatus);
  const statusKey = paymentStatusKey(order.paymentStatus);
  const statusPath = `paymentStatus.${statusKey}`;
  const translatedStatus = t(statusPath);
  const statusLabel =
    translatedStatus === statusPath
      ? statusStyle.label || statusKey
      : translatedStatus;

  const method = order.paymentMethod || 'CASH';
  const methodPath = `orders.paymentMethod.${method}`;
  const translatedMethod = t(methodPath);
  const methodLabel =
    translatedMethod === methodPath ? method : translatedMethod;

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col',
        compact ? 'items-center gap-0' : 'items-center gap-0.5',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex max-w-full items-center justify-center gap-1.5 text-[12px] font-medium leading-snug',
          statusStyle.textClassName,
        )}
      >
        <span
          className={cn('size-1.5 shrink-0 rounded-full', statusStyle.dotClassName)}
          aria-hidden
        />
        <span className="truncate">{statusLabel}</span>
      </span>
      {compact ? null : (
        <span className="max-w-full truncate text-[10px] text-[var(--muted-foreground)]">
          {methodLabel}
        </span>
      )}
    </div>
  );
}
