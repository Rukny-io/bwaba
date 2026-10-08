'use client';

import { getOrderStatusStyle } from '@/lib/orders/order-display';
import { useTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const { t } = useTranslations();
  const style = getOrderStatusStyle(status);
  const translated = t(`orders.status.${status}`);
  const label =
    translated === `orders.status.${status}` ? style.label || status : translated;

  return (
    <span
      className={cn(
        'inline-flex w-auto max-w-full items-center justify-start gap-1.5 text-[12px] font-medium leading-snug',
        style.textClassName,
        className,
      )}
    >
      <span
        className={cn('size-1.5 shrink-0 rounded-full', style.dotClassName)}
        aria-hidden
      />
      <span className="truncate">{label}</span>
    </span>
  );
}
