'use client';

import { memo } from 'react';
import { TableCell, TableRow } from '@/components/ui/cnippet-table';
import { OrderCustomerCell } from '@/components/orders/order-customer-cell';
import { OrderPaymentBadge } from '@/components/orders/order-payment-badge';
import { OrderStatusBadge } from '@/components/orders/order-status-badge';
import { ChevronLeft } from 'lucide-react';
import { OrdersTableCheckbox } from '@/components/orders/orders-table-checkbox';
import {
  ORDERS_TABLE_COLUMNS,
  ordersTableCellClass,
  ordersTableChrome,
} from '@/components/orders/orders-table-config';
import { getOrderDisplayNumber } from '@/lib/orders/order-display';
import type { StoreOrder } from '@/lib/orders/types';
import { formatCurrency, formatIsoDate, formatNumber } from '@/lib/dashboard-format';
import { cn } from '@/lib/utils';

interface OrdersTableRowProps {
  order: StoreOrder;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  onOpenDetails: () => void;
}

function OrdersTableRowComponent({
  order,
  selected,
  onSelectedChange,
  onOpenDetails,
}: OrdersTableRowProps) {
  const orderNumber = getOrderDisplayNumber(order);

  return (
    <TableRow
      data-state={selected ? 'selected' : undefined}
      className={cn(ordersTableChrome.bodyRow, 'cursor-pointer')}
      onClick={onOpenDetails}
    >
      {ORDERS_TABLE_COLUMNS.map((column) => {
        if (column.id === 'select') {
          return (
            <TableCell
              key={column.id}
              className={cn(ordersTableCellClass(column), 'p-0')}
              onClick={(event) => event.stopPropagation()}
            >
              <OrdersTableCheckbox
                aria-label={`تحديد طلب ${orderNumber}`}
                isSelected={selected}
                onChange={onSelectedChange}
              />
            </TableCell>
          );
        }

        if (column.id === 'order') {
          return (
            <TableCell key={column.id} className={ordersTableCellClass(column)}>
              <div className="flex justify-center">
                <span
                  className={cn(
                    'max-w-full truncate text-center text-[12px] font-medium',
                    ordersTableChrome.numeric,
                  )}
                  dir="ltr"
                >
                  {orderNumber}
                </span>
              </div>
            </TableCell>
          );
        }

        if (column.id === 'customer') {
          return (
            <TableCell key={column.id} className={ordersTableCellClass(column)}>
              <OrderCustomerCell order={order} showOrderNumber={false} />
            </TableCell>
          );
        }

        if (column.id === 'status') {
          return (
            <TableCell key={column.id} className={ordersTableCellClass(column)}>
              <div className="flex justify-center">
                <OrderStatusBadge
                  status={order.status}
                  className="justify-center"
                />
              </div>
            </TableCell>
          );
        }

        if (column.id === 'payment') {
          return (
            <TableCell key={column.id} className={ordersTableCellClass(column)}>
              <OrderPaymentBadge order={order} compact />
            </TableCell>
          );
        }

        if (column.id === 'items') {
          return (
            <TableCell
              key={column.id}
              className={cn(ordersTableCellClass(column), ordersTableChrome.numeric)}
              dir="ltr"
            >
              {order.itemsCount ? formatNumber(order.itemsCount) : '—'}
            </TableCell>
          );
        }

        if (column.id === 'total') {
          return (
            <TableCell
              key={column.id}
              className={cn(
                ordersTableCellClass(column),
                ordersTableChrome.numeric,
                'font-semibold',
              )}
              dir="ltr"
            >
              {formatCurrency(order.total, order.currency)}
            </TableCell>
          );
        }

        if (column.id === 'date') {
          return (
            <TableCell
              key={column.id}
              className={cn(
                ordersTableCellClass(column),
                ordersTableChrome.numeric,
                ordersTableChrome.muted,
                'text-[12px]',
              )}
            >
              <time dateTime={order.createdAt} dir="ltr">
                {formatIsoDate(order.createdAt)}
              </time>
            </TableCell>
          );
        }

        return (
          <TableCell
            key={column.id}
            className={ordersTableCellClass(column)}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onOpenDetails}
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-lg py-1.5 ps-2.5 pe-1',
                  'text-[12px] font-medium',
                  ordersTableChrome.rowDetailsButton,
                )}
              >
                <span>التفاصيل</span>
                <ChevronLeft
                  className="size-3.5 shrink-0 opacity-70"
                  strokeWidth={2}
                  aria-hidden
                />
              </button>
            </div>
          </TableCell>
        );
      })}
    </TableRow>
  );
}

export const OrdersTableRow = memo(OrdersTableRowComponent);
