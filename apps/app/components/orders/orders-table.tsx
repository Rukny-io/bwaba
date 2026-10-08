'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/cnippet-table';
import { OrdersMobileList } from '@/components/orders/orders-mobile-list';
import { OrdersSelectionBar } from '@/components/orders/orders-selection-bar';
import { OrdersTableCheckbox } from '@/components/orders/orders-table-checkbox';
import { OrdersTableRow } from '@/components/orders/orders-table-row';
import {
  ORDERS_TABLE_CHECKBOX_COL,
  ORDERS_TABLE_COLUMNS,
  ordersTableCellClass,
  ordersTableChrome,
  ordersTableHeadClass,
} from '@/components/orders/orders-table-config';
import { ApiException } from '@/lib/api-client';
import { bulkUpdateOrderStatus, isMockOrderId } from '@/lib/orders/bulk-actions';
import { downloadOrdersCsv } from '@/lib/orders/export-orders-csv';
import type { StoreOrder } from '@/lib/orders/types';
import { cn } from '@/lib/utils';

interface OrdersTableProps {
  orders: StoreOrder[];
  isLoading?: boolean;
  emptyMessage: string;
  onOpenDetails: (order: StoreOrder) => void;
  onRefresh?: () => void;
}

const tableStyle = {
  '--table-checkbox-col': ORDERS_TABLE_CHECKBOX_COL,
} as CSSProperties;

function OrdersTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <TableRow
          key={`loading-${index}`}
          className={cn(ordersTableChrome.bodyRow, 'pointer-events-none')}
        >
          {ORDERS_TABLE_COLUMNS.map((column) => (
            <TableCell key={column.id} className={ordersTableCellClass(column)}>
              <div
                className={cn(
                  'animate-pulse rounded-md bg-[var(--surface-secondary)]',
                  column.id === 'customer' ? 'h-8 w-full' : 'mx-auto h-3.5 w-3/4',
                  column.id === 'select' && 'mx-auto size-4 rounded',
                )}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function OrdersTable({
  orders,
  isLoading,
  emptyMessage,
  onOpenDetails,
  onRefresh,
}: OrdersTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);

  const orderIdSet = useMemo(() => new Set(orders.map((order) => order.id)), [orders]);

  useEffect(() => {
    setSelectedIds((current) => {
      const next = new Set<string>();
      for (const id of current) {
        if (orderIdSet.has(id)) next.add(id);
      }
      return next.size === current.size ? current : next;
    });
  }, [orderIdSet]);

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedIds.has(order.id)),
    [orders, selectedIds],
  );

  const allSelected =
    orders.length > 0 && orders.every((order) => selectedIds.has(order.id));
  const someSelected = orders.some((order) => selectedIds.has(order.id));

  const toggleAll = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setSelectedIds(new Set());
        return;
      }
      setSelectedIds(new Set(orders.map((order) => order.id)));
    },
    [orders],
  );

  const toggleOne = useCallback((orderId: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(orderId);
      else next.delete(orderId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setBulkNotice(null);
  }, []);

  const runBulkStatus = useCallback(
    async (status: 'CONFIRMED' | 'CANCELLED') => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      setBulkBusy(true);
      setBulkNotice(null);
      try {
        const { updated, skipped } = await bulkUpdateOrderStatus(ids, status);
        if (updated.length > 0) {
          onRefresh?.();
          setSelectedIds(new Set());
        }
        if (skipped.length > 0 && updated.length === 0) {
          setBulkNotice('لا يمكن تطبيق الإجراء على الطلبات التجريبية.');
        } else if (skipped.length > 0) {
          setBulkNotice('تم التحديث باستثناء الطلبات التجريبية.');
        }
      } catch (error) {
        setBulkNotice(
          error instanceof ApiException ? error.message : 'تعذّر تنفيذ الإجراء',
        );
      } finally {
        setBulkBusy(false);
      }
    },
    [onRefresh, selectedIds],
  );

  const handleExportCsv = useCallback(() => {
    if (selectedOrders.length === 0) return;
    downloadOrdersCsv(selectedOrders);
  }, [selectedOrders]);

  const handlePaymentAction = useCallback(() => {
    const hasMock = selectedOrders.some((order) => isMockOrderId(order.id));
    setBulkNotice(
      hasMock
        ? 'تعيين حالة الدفع غير متاح للطلبات التجريبية حالياً.'
        : 'تعيين حالة الدفع للطلبات قيد التطوير.',
    );
  }, [selectedOrders]);

  const handleDelete = useCallback(() => {
    setBulkNotice('حذف الطلبات غير متاح بعد.');
  }, []);

  return (
    <>
      <div className="sm:hidden">
        <OrdersMobileList
          orders={orders}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
        />
      </div>

      <div className="hidden sm:block">
        <div className={ordersTableChrome.shell} style={tableStyle}>
          {bulkNotice ? (
            <p
              className={cn(
                ordersTableChrome.noticeBar,
                'text-start text-[11px] text-[var(--muted-foreground)]',
              )}
            >
              {bulkNotice}
            </p>
          ) : null}

          <div className={ordersTableChrome.scroll}>
            <Table
              variant="default"
              className={cn(
                ordersTableChrome.table,
                '[&_[data-slot=table-container]]:overflow-visible',
                '[&_[data-slot=table-cell]]:p-0 [&_[data-slot=table-head]]:p-0',
                '[&_[data-slot=table-body]:before]:hidden',
              )}
              dir="rtl"
            >
              <TableHeader>
                <TableRow
                  className={cn(
                    ordersTableChrome.headRow,
                    'hover:bg-transparent dark:hover:bg-transparent',
                  )}
                >
                  {ORDERS_TABLE_COLUMNS.map((column) => (
                    <TableHead key={column.id} className={ordersTableHeadClass(column)}>
                      {column.id === 'select' ? (
                        <OrdersTableCheckbox
                          aria-label="تحديد كل الطلبات"
                          isSelected={allSelected}
                          isIndeterminate={someSelected && !allSelected}
                          onChange={toggleAll}
                        />
                      ) : (
                        <span className="block truncate">{column.label}</span>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <OrdersTableSkeleton />
                ) : orders.length === 0 ? (
                  <TableRow
                    className={cn(
                      'border-0 hover:bg-transparent',
                      'dark:hover:bg-transparent',
                    )}
                  >
                    <TableCell
                      colSpan={ORDERS_TABLE_COLUMNS.length}
                      className="h-36 border-0 bg-transparent px-4 text-center"
                    >
                      <ShoppingBag
                        className="mx-auto mb-3 size-8 text-[var(--muted-foreground)]/70"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        لا توجد طلبات
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {emptyMessage}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <OrdersTableRow
                      key={order.id}
                      order={order}
                      selected={selectedIds.has(order.id)}
                      onSelectedChange={(checked) => toggleOne(order.id, checked)}
                      onOpenDetails={() => onOpenDetails(order)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <OrdersSelectionBar
        count={selectedIds.size}
        busy={bulkBusy}
        onClear={clearSelection}
        onMarkPaid={handlePaymentAction}
        onMarkUnpaid={handlePaymentAction}
        onAccept={() => void runBulkStatus('CONFIRMED')}
        onReject={() => void runBulkStatus('CANCELLED')}
        onExportCsv={handleExportCsv}
        onDelete={handleDelete}
      />
    </>
  );
}
