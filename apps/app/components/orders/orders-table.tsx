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
  ORDERS_TABLE_COLUMN_DEFS,
  type OrdersTableColumn,
  ordersTableCellClass,
  ordersTableChrome,
  ordersTableHeadClass,
} from '@/components/orders/orders-table-config';
import { ApiException } from '@/lib/api-client';
import {
  bulkDeleteOrders,
  bulkUpdateOrderStatus,
  bulkUpdatePaymentStatus,
  isMockOrderId,
} from '@/lib/orders/bulk-actions';
import { downloadOrdersCsv } from '@/lib/orders/export-orders-csv';
import { useTranslations } from '@/lib/i18n';
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

function OrdersTableSkeleton({ columns }: { columns: OrdersTableColumn[] }) {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <TableRow
          key={`loading-${index}`}
          className={cn(ordersTableChrome.bodyRow, 'pointer-events-none')}
        >
          {columns.map((column) => (
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

function summarizeBulkResult(
  input: {
    successCount: number;
    failedCount: number;
    skippedCount: number;
    successLabel: string;
  },
  t: (path: string, vars?: Record<string, string | number>) => string,
): string | null {
  const { successCount, failedCount, skippedCount, successLabel } = input;
  if (successCount > 0 && failedCount === 0 && skippedCount === 0) {
    return null;
  }
  if (successCount === 0 && skippedCount > 0 && failedCount === 0) {
    return t('orders.bulk.mockOnly');
  }
  if (successCount > 0 && (failedCount > 0 || skippedCount > 0)) {
    return t('orders.bulk.partial', { action: successLabel });
  }
  if (failedCount > 0) {
    return t('orders.bulk.failed');
  }
  return null;
}

export function OrdersTable({
  orders,
  isLoading,
  emptyMessage,
  onOpenDetails,
  onRefresh,
}: OrdersTableProps) {
  const { t } = useTranslations();
  const columns = useMemo<OrdersTableColumn[]>(
    () =>
      ORDERS_TABLE_COLUMN_DEFS.map((column) => {
        if (column.id === 'select' || column.id === 'actions') {
          return { ...column, label: '' };
        }
        const key =
          column.id === 'items'
            ? 'orders.columns.products'
            : column.id === 'total'
              ? 'orders.columns.amount'
              : `orders.columns.${column.id}`;
        return { ...column, label: t(key) };
      }),
    [t],
  );
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
        const { updated, failed, skipped } = await bulkUpdateOrderStatus(ids, status);
        if (updated.length > 0) {
          onRefresh?.();
          setSelectedIds(new Set());
        }
        setBulkNotice(
          summarizeBulkResult(
            {
              successCount: updated.length,
              failedCount: failed.length,
              skippedCount: skipped.length,
              successLabel:
                status === 'CONFIRMED'
                  ? t('orders.bulk.accepted')
                  : t('orders.bulk.rejected'),
            },
            t,
          ),
        );
      } catch (error) {
        setBulkNotice(
          error instanceof ApiException
            ? error.message
            : t('orders.bulk.actionFailed'),
        );
      } finally {
        setBulkBusy(false);
      }
    },
    [onRefresh, selectedIds, t],
  );

  const runBulkPayment = useCallback(
    async (paymentStatus: 'PAID' | 'UNPAID') => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) return;

      setBulkBusy(true);
      setBulkNotice(null);
      try {
        const { updated, failed, skipped } = await bulkUpdatePaymentStatus(
          ids,
          paymentStatus,
        );
        if (updated.length > 0) {
          onRefresh?.();
          setSelectedIds(new Set());
        }
        setBulkNotice(
          summarizeBulkResult(
            {
              successCount: updated.length,
              failedCount: failed.length,
              skippedCount: skipped.length,
              successLabel:
                paymentStatus === 'PAID'
                  ? t('orders.bulk.markedPaid')
                  : t('orders.bulk.markedUnpaid'),
            },
            t,
          ),
        );
      } catch (error) {
        setBulkNotice(
          error instanceof ApiException
            ? error.message
            : t('orders.bulk.paymentFailed'),
        );
      } finally {
        setBulkBusy(false);
      }
    },
    [onRefresh, selectedIds, t],
  );

  const handleExportCsv = useCallback(() => {
    if (selectedOrders.length === 0) return;
    downloadOrdersCsv(selectedOrders);
    setBulkNotice(null);
  }, [selectedOrders]);

  const handleDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const hasMock = ids.some(isMockOrderId);
    const realCount = ids.filter((id) => !isMockOrderId(id)).length;
    if (realCount === 0) {
      setBulkNotice(t('orders.bulk.deleteMockOnly'));
      return;
    }

    const confirmed = window.confirm(
      hasMock
        ? t('orders.bulk.deleteConfirmMock', { n: realCount })
        : t('orders.bulk.deleteConfirm', { n: realCount }),
    );
    if (!confirmed) return;

    setBulkBusy(true);
    setBulkNotice(null);
    try {
      const { deleted, failed, skipped } = await bulkDeleteOrders(ids);
      if (deleted.length > 0) {
        onRefresh?.();
        setSelectedIds(new Set());
      }
      setBulkNotice(
        summarizeBulkResult(
          {
            successCount: deleted.length,
            failedCount: failed.length,
            skippedCount: skipped.length,
            successLabel: t('orders.bulk.deleted'),
          },
          t,
        ),
      );
    } catch (error) {
      setBulkNotice(
        error instanceof ApiException
          ? error.message
          : t('orders.bulk.deleteFailed'),
      );
    } finally {
      setBulkBusy(false);
    }
  }, [onRefresh, selectedIds, t]);

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

            >
              <TableHeader>
                <TableRow
                  className={cn(
                    ordersTableChrome.headRow,
                    'hover:bg-transparent dark:hover:bg-transparent',
                  )}
                >
                  {columns.map((column) => (
                    <TableHead key={column.id} className={ordersTableHeadClass(column)}>
                      {column.id === 'select' ? (
                        <OrdersTableCheckbox
                          aria-label={t('orders.selectAll')}
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
                  <OrdersTableSkeleton columns={columns} />
                ) : orders.length === 0 ? (
                  <TableRow
                    className={cn(
                      'border-0 hover:bg-transparent',
                      'dark:hover:bg-transparent',
                    )}
                  >
                    <TableCell
                      colSpan={columns.length}
                      className="h-36 border-0 bg-transparent px-4 text-center"
                    >
                      <ShoppingBag
                        className="mx-auto mb-3 size-8 text-[var(--muted-foreground)]/70"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {t('orders.emptyTitle')}
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
        onMarkPaid={() => void runBulkPayment('PAID')}
        onMarkUnpaid={() => void runBulkPayment('UNPAID')}
        onAccept={() => void runBulkStatus('CONFIRMED')}
        onReject={() => void runBulkStatus('CANCELLED')}
        onExportCsv={handleExportCsv}
        onDelete={() => void handleDelete()}
      />
    </>
  );
}
