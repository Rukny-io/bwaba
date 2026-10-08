import {
  getOrderPaymentMethodLabel,
  getOrderPaymentStatusStyle,
} from '@/lib/orders/order-payment-display';
import type { StoreOrder } from '@/lib/orders/types';
import { cn } from '@/lib/utils';

interface OrderPaymentBadgeProps {
  order: StoreOrder;
  className?: string;
  /** صف واحد في الجدول */
  compact?: boolean;
}

export function OrderPaymentBadge({
  order,
  className,
  compact = false,
}: OrderPaymentBadgeProps) {
  const statusStyle = getOrderPaymentStatusStyle(order.paymentStatus);
  const methodLabel = getOrderPaymentMethodLabel(order.paymentMethod);

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
        <span className="truncate">{statusStyle.label}</span>
      </span>
      {compact ? null : (
        <span className="max-w-full truncate text-[10px] text-[var(--muted-foreground)]">
          {methodLabel}
        </span>
      )}
    </div>
  );
}
