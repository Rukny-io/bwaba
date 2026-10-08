import { DATE_LOCALE } from '@/lib/dashboard-format';
import type { OrderStatus } from '@/lib/orders/types';

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'معلّق',
  CONFIRMED: 'مؤكد',
  PROCESSING: 'قيد التجهيز',
  SHIPPED: 'تم الشحن',
  OUT_FOR_DELIVERY: 'في الطريق',
  DELIVERED: 'مكتمل',
  CANCELLED: 'ملغي',
  REFUNDED: 'مسترد',
};

export type OrderStatusChipColor =
  | 'default'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger';

export interface OrderStatusStyle {
  label: string;
  textClassName: string;
  dotClassName: string;
}

const ORDER_STATUS_STYLES: Record<string, OrderStatusStyle> = {
  PENDING: {
    label: 'معلّق',
    textClassName:
      'text-[color-mix(in_oklab,var(--warning)_40%,var(--muted-foreground))]',
    dotClassName:
      'bg-[color-mix(in_oklab,var(--warning)_55%,var(--muted-foreground))]',
  },
  CONFIRMED: {
    label: 'مؤكد',
    textClassName:
      'text-[color-mix(in_oklab,var(--accent)_35%,var(--muted-foreground))]',
    dotClassName:
      'bg-[color-mix(in_oklab,var(--accent)_50%,var(--muted-foreground))]',
  },
  PROCESSING: {
    label: 'قيد التجهيز',
    textClassName:
      'text-[color-mix(in_oklab,#3b82f6_35%,var(--muted-foreground))]',
    dotClassName:
      'bg-[color-mix(in_oklab,#3b82f6_50%,var(--muted-foreground))]',
  },
  SHIPPED: {
    label: 'تم الشحن',
    textClassName:
      'text-[color-mix(in_oklab,#8b5cf6_35%,var(--muted-foreground))]',
    dotClassName:
      'bg-[color-mix(in_oklab,#8b5cf6_50%,var(--muted-foreground))]',
  },
  OUT_FOR_DELIVERY: {
    label: 'في الطريق',
    textClassName:
      'text-[color-mix(in_oklab,#06b6d4_35%,var(--muted-foreground))]',
    dotClassName:
      'bg-[color-mix(in_oklab,#06b6d4_50%,var(--muted-foreground))]',
  },
  DELIVERED: {
    label: 'مكتمل',
    textClassName:
      'text-[color-mix(in_oklab,var(--success)_40%,var(--muted-foreground))]',
    dotClassName:
      'bg-[color-mix(in_oklab,var(--success)_55%,var(--muted-foreground))]',
  },
  CANCELLED: {
    label: 'ملغي',
    textClassName:
      'text-[color-mix(in_oklab,var(--danger)_40%,var(--muted-foreground))]',
    dotClassName:
      'bg-[color-mix(in_oklab,var(--danger)_55%,var(--muted-foreground))]',
  },
  REFUNDED: {
    label: 'مسترد',
    textClassName: 'text-[var(--muted-foreground)]',
    dotClassName: 'bg-[var(--muted-foreground)]',
  },
};

const DEFAULT_ORDER_STATUS_STYLE: OrderStatusStyle = {
  label: '',
  textClassName: 'text-[var(--muted-foreground)]',
  dotClassName: 'bg-[var(--muted-foreground)]',
};

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function getOrderStatusStyle(status: string): OrderStatusStyle {
  const style = ORDER_STATUS_STYLES[status];
  if (style) return style;
  return {
    ...DEFAULT_ORDER_STATUS_STYLE,
    label: getOrderStatusLabel(status),
  };
}

export function getOrderStatusChipColor(status: string): OrderStatusChipColor {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'CONFIRMED':
    case 'PROCESSING':
      return 'accent';
    case 'SHIPPED':
    case 'OUT_FOR_DELIVERY':
      return 'default';
    case 'DELIVERED':
      return 'success';
    case 'CANCELLED':
    case 'REFUNDED':
      return 'danger';
    default:
      return 'default';
  }
}

export function getOrderDisplayNumber(order: {
  orderNumber?: string | null;
  id: string;
}): string {
  if (order.orderNumber) return `#${order.orderNumber}`;
  return `#${order.id.slice(0, 8).toUpperCase()}`;
}

export function getOrderDisplayId(order: {
  orderNumber?: string | null;
  id: string;
}): string {
  if (order.orderNumber) return order.orderNumber;
  return order.id.slice(0, 8).toUpperCase();
}

export function formatOrderPlacedAtDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const datePart = new Intl.DateTimeFormat(DATE_LOCALE, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);

  const timePart = new Intl.DateTimeFormat(DATE_LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  return `${datePart} · ${timePart}`;
}

export function formatOrderPlacedAt(value: string): string {
  return `تم الطلب في ${formatOrderPlacedAtDateTime(value)}`;
}

export function getOrderCustomerName(order: {
  customer?: { name?: string | null } | null;
}): string {
  const name = order.customer?.name?.trim();
  return name || 'عميل';
}

export function getOrderCustomerContact(order: {
  phoneNumber?: string | null;
  customer?: { email?: string | null } | null;
}): string | null {
  const phone = order.phoneNumber?.trim();
  if (phone) return phone;

  const email = order.customer?.email?.trim();
  if (email) return email;

  return null;
}

export function getOrderCustomerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0]!.slice(0, 1);
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`;
}

export type OrderStatusFilter = 'all' | OrderStatus;

export const ORDER_STATUS_FILTER_IDS: OrderStatusFilter[] = [
  'all',
  'PENDING',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

/** @deprecated Prefer ORDER_STATUS_FILTER_IDS + t('orders.status.*') */
export const ORDER_STATUS_FILTERS: {
  id: OrderStatusFilter;
  label: string;
}[] = [
  { id: 'all', label: 'الكل' },
  { id: 'PENDING', label: 'معلّق' },
  { id: 'PROCESSING', label: 'قيد التجهيز' },
  { id: 'SHIPPED', label: 'تم الشحن' },
  { id: 'DELIVERED', label: 'مكتمل' },
  { id: 'CANCELLED', label: 'ملغي' },
];
