import { formatCurrency, formatIsoDate, formatNumber } from '@/lib/dashboard-format';
import {
  getOrderCustomerName,
  getOrderDisplayNumber,
  getOrderStatusLabel,
} from '@/lib/orders/order-display';
import {
  getOrderPaymentMethodLabel,
  getOrderPaymentStatusLabel,
} from '@/lib/orders/order-payment-display';
import type { StoreOrder } from '@/lib/orders/types';

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadOrdersCsv(orders: StoreOrder[], filename = 'orders.csv'): void {
  const headers = [
    'رقم الطلب',
    'الحالة',
    'العميل',
    'الهاتف',
    'البريد',
    'حالة الدفع',
    'طريقة الدفع',
    'المنتجات',
    'المبلغ',
    'التاريخ',
  ];

  const rows = orders.map((order) => {
    const cells = [
      getOrderDisplayNumber(order),
      getOrderStatusLabel(order.status),
      getOrderCustomerName(order),
      order.phoneNumber ?? '',
      order.customer?.email ?? '',
      getOrderPaymentStatusLabel(order.paymentStatus),
      getOrderPaymentMethodLabel(order.paymentMethod),
      order.itemsCount ? formatNumber(order.itemsCount) : '',
      formatCurrency(order.total, order.currency),
      formatIsoDate(order.createdAt),
    ];
    return cells.map((cell) => escapeCsvCell(String(cell))).join(',');
  });

  const bom = '\uFEFF';
  const csv = bom + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
