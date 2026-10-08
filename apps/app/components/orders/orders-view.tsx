'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Input } from '@heroui/react';
import { Package, Search } from 'lucide-react';
import {
  DashboardNotice,
  DashboardPanel,
  DashboardSection,
} from '@/components/app/dashboard-section';
import { OrderDetailSheet } from '@/components/orders/order-detail-sheet';
import { OrdersTable } from '@/components/orders/orders-table';
import { fetchStoreOrders } from '@/lib/orders/api';
import { MOCK_ORDERS, shouldUseMockOrders } from '@/lib/orders/mock-orders';
import {
  getOrderCustomerName,
  ORDER_STATUS_FILTERS,
  type OrderStatusFilter,
} from '@/lib/orders/order-display';
import type { StoreOrder } from '@/lib/orders/types';
import { ApiException } from '@/lib/api-client';
import { orderPillButtonClass } from '@/components/orders/order-pill-button';
import { cn } from '@/lib/utils';

export function OrdersView() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noStore, setNoStore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [detailOrder, setDetailOrder] = useState<StoreOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openOrderDetails = useCallback((order: StoreOrder) => {
    setDetailOrder(order);
    setDetailOpen(true);
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rows = await fetchStoreOrders({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 50,
      });
      setOrders(rows);
      setNoStore(false);
    } catch (err) {
      if (err instanceof ApiException && err.statusCode === 404) {
        setNoStore(true);
        setOrders([]);
      } else {
        setError(
          err instanceof ApiException ? err.message : 'تعذّر تحميل الطلبات',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const useMockOrders = shouldUseMockOrders(orders, loading, noStore, error);

  const displayOrders = useMemo(() => {
    const source = useMockOrders ? MOCK_ORDERS : orders;
    if (!useMockOrders || statusFilter === 'all') return source;
    return source.filter((order) => order.status === statusFilter);
  }, [orders, useMockOrders, statusFilter]);

  const visibleOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return displayOrders;

    return displayOrders.filter((order) => {
      const haystack = [
        order.orderNumber,
        order.id,
        getOrderCustomerName(order),
        order.customer?.email,
        order.phoneNumber,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [displayOrders, searchQuery]);

  const detailOrderIndex = useMemo(() => {
    if (!detailOrder) return -1;
    return visibleOrders.findIndex((row) => row.id === detailOrder.id);
  }, [detailOrder, visibleOrders]);

  const goToDetailOrder = useCallback(
    (offset: number) => {
      if (detailOrderIndex < 0) return;
      const nextIndex = detailOrderIndex + offset;
      const nextOrder = visibleOrders[nextIndex];
      if (nextOrder) setDetailOrder(nextOrder);
    },
    [detailOrderIndex, visibleOrders],
  );

  const emptyMessage = useMemo(() => {
    if (searchQuery.trim()) {
      return 'جرّب بحثاً مختلفاً.';
    }
    if (statusFilter !== 'all') {
      return 'لا توجد طلبات في هذا التصنيف.';
    }
    return 'أضف منتجاتك وشارك صفحتك لبدء استقبال الطلبات.';
  }, [searchQuery, statusFilter]);

  return (
    <section className="dashboard-page flex w-full min-w-0 flex-col gap-5 pt-5 sm:gap-6 sm:pt-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          الطلبات
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
          متابعة ومعالجة طلبات عملائك من متجرك.
        </p>
      </div>

      {noStore ? (
        <DashboardSection
          title="ابدأ بمتجرك"
          description="أضف منتجاتك لبدء استقبال الطلبات من صفحتك العامة."
        >
          <div className="flex min-w-0 flex-col gap-3 rounded-2xl bg-[var(--surface-secondary)] px-4 py-3.5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--muted-foreground)]">
                <Package className="size-4.5" strokeWidth={1.75} aria-hidden />
              </span>
              <p className="text-[13px] leading-5 text-[var(--muted-foreground)]">
                لا يوجد متجر مرتبط بهذا الحساب بعد. أضف منتجاتك أولاً ثم ستظهر
                الطلبات هنا تلقائياً.
              </p>
            </div>
            <Link
              href="/app/products"
              className="inline-flex h-9 w-fit items-center justify-center rounded-full bg-[var(--foreground)] px-4 text-[13px] font-medium text-[var(--background)]"
            >
              الانتقال للمنتجات
            </Link>
          </div>
        </DashboardSection>
      ) : (
        <>
          <section className="flex min-w-0 flex-col gap-4 rounded-2xl bg-[var(--surface)] p-4 sm:p-5">
            {error ? (
              <DashboardNotice tone="danger" title="تعذّر التحميل" description={error} />
            ) : null}

            <DashboardPanel className="flex min-w-0 flex-col gap-4 border-t-0 pt-0">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
                  aria-hidden
                />
                <Input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="بحث برقم الطلب أو اسم العميل…"
                  className="rounded-2xl ps-9 shadow-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {ORDER_STATUS_FILTERS.map((filter) => {
                  const selected = statusFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setStatusFilter(filter.id)}
                      className={cn(
                        orderPillButtonClass,
                        selected && 'bg-[var(--foreground)] text-[var(--background)] hover:opacity-100',
                      )}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </DashboardPanel>

            <div className="min-w-0 pt-2">
              <OrdersTable
                orders={visibleOrders}
                isLoading={loading}
                emptyMessage={emptyMessage}
                onOpenDetails={openOrderDetails}
                onRefresh={() => void loadOrders()}
              />
            </div>
          </section>

          <OrderDetailSheet
            order={detailOrder}
            isOpen={detailOpen}
            onOpenChange={setDetailOpen}
            onPrevious={() => goToDetailOrder(-1)}
            onNext={() => goToDetailOrder(1)}
            canGoPrevious={detailOrderIndex > 0}
            canGoNext={detailOrderIndex >= 0 && detailOrderIndex < visibleOrders.length - 1}
          />
        </>
      )}
    </section>
  );
}
