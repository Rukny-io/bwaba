import type { OrderPaymentMethod, OrderPaymentStatus } from '@/lib/orders/types';

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'عند الاستلام',
  QASEH_CARD: 'بطاقة',
  BANK_TRANSFER: 'تحويل بنكي',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: 'غير مدفوع',
  PAID: 'مدفوع',
  REFUNDED: 'مسترد',
};

export interface OrderPaymentStatusStyle {
  label: string;
  textClassName: string;
  dotClassName: string;
}

const PAYMENT_STATUS_STYLES: Record<string, OrderPaymentStatusStyle> = {
  UNPAID: {
    label: 'غير مدفوع',
    textClassName: 'text-[var(--warning)]',
    dotClassName: 'bg-[var(--warning)]',
  },
  PAID: {
    label: 'مدفوع',
    textClassName: 'text-[var(--success)]',
    dotClassName: 'bg-[var(--success)]',
  },
  REFUNDED: {
    label: 'مسترد',
    textClassName: 'text-[var(--muted-foreground)]',
    dotClassName: 'bg-[var(--muted-foreground)]',
  },
};

const DEFAULT_PAYMENT_STATUS_STYLE: OrderPaymentStatusStyle = {
  label: 'غير مدفوع',
  textClassName: 'text-[var(--muted-foreground)]',
  dotClassName: 'bg-[var(--muted-foreground)]',
};

export function getOrderPaymentMethodLabel(
  method?: OrderPaymentMethod | string | null,
): string {
  if (!method) return PAYMENT_METHOD_LABELS.CASH;
  return PAYMENT_METHOD_LABELS[method] ?? method;
}

function normalizePaymentStatus(
  status?: OrderPaymentStatus | string | null,
): OrderPaymentStatus | 'UNPAID' {
  if (!status || status === 'PENDING' || status === 'FAILED') return 'UNPAID';
  return status as OrderPaymentStatus;
}

export function getOrderPaymentStatusLabel(
  status?: OrderPaymentStatus | string | null,
): string {
  const normalized = normalizePaymentStatus(status);
  return PAYMENT_STATUS_LABELS[normalized] ?? normalized;
}

export function getOrderPaymentStatusStyle(
  status?: OrderPaymentStatus | string | null,
): OrderPaymentStatusStyle {
  const normalized = normalizePaymentStatus(status);
  const style = PAYMENT_STATUS_STYLES[normalized];
  if (style) return style;
  return {
    ...DEFAULT_PAYMENT_STATUS_STYLE,
    label: getOrderPaymentStatusLabel(normalized),
  };
}
