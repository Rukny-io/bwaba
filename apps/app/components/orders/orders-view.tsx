'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@heroui/react';
import { Package, Search } from 'lucide-react';
import {
  DashboardNotice,
  DashboardPanel,
  DashboardSection,
} from '@/components/app/dashboard-section';
import {
  OrdersAdvancedSearch,
  type OrdersAdvancedFilters,
} from '@/components/orders/orders-advanced-search';
import { OrdersTable } from '@/components/orders/orders-table';
import { fetchStoreOrders } from '@/lib/orders/api';
import { MOCK_ORDERS, shouldUseMockOrders } from '@/lib/orders/mock-orders';
import {
  getOrderCustomerName,
  ORDER_STATUS_FILTER_IDS,
  type OrderStatusFilter,
} from '@/lib/orders/order-display';
import type { StoreOrder } from '@/lib/orders/types';
import { ApiException } from '@/lib/api-client';
import { useTranslations } from '@/lib/i18n';
import { orderPillButtonClass } from '@/components/orders/order-pill-button';
import { cn } from '@/lib/utils';

const EMPTY_ADVANCED: OrdersAdvancedFilters = {
  paymentFilter: 'all',
  startDate: '',
  endDate: '',
};

function normalizePayment(status?: string | null): 'PAID' | 'UNPAID' | 'OTHER' {
  if (status === 'PAID') return 'PAID';
  if (!status || status === 'UNPAID' || status === 'PENDING' || status === 'FAILED') {
    return 'UNPAID';
  }
  return 'OTHER';
}

export function OrdersView() {
  const { t } = useTranslations();
  const router = useRouter();
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noStore, setNoStore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] =
    useState<OrdersAdvancedFilters>(EMPTY_ADVANCED);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const openOrderDetails = useCallback(
    (order: StoreOrder) => {
      router.push(`/app/orders/${encodeURIComponent(order.id)}`);
    },
    [router],
  );

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const rows = await fetchStoreOrders({
        status: statusFilter === 'all' ? undefined : statusFilter,
        paymentStatus:
          advancedFilters.paymentFilter === 'all'
            ? undefined
            : advancedFilters.paymentFilter,
        search: debouncedSearch || undefined,
        startDate: advancedFilters.startDate || undefined,
        endDate: advancedFilters.endDate || undefined,
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
          err instanceof ApiException ? err.message : t('orders.loadFailedGeneric'),
        );
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, advancedFilters, debouncedSearch, t]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const useMockOrders = shouldUseMockOrders(orders, loading, noStore, error);

  const displayOrders = useMemo(() => {
    const source = useMockOrders ? MOCK_ORDERS : orders;
    return source.filter((order) => {
      if (useMockOrders && statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      if (advancedFilters.paymentFilter !== 'all') {
        const payment = normalizePayment(order.paymentStatus);
        if (payment !== advancedFilters.paymentFilter) return false;
      }

      if (advancedFilters.startDate) {
        const start = new Date(advancedFilters.startDate);
        start.setHours(0, 0, 0, 0);
        if (new Date(order.createdAt) < start) return false;
      }

      if (advancedFilters.endDate) {
        const end = new Date(advancedFilters.endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(order.createdAt) > end) return false;
      }

      const query = debouncedSearch.toLowerCase();
      if (!query) return true;

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
  }, [orders, useMockOrders, statusFilter, advancedFilters, debouncedSearch]);

  const emptyMessage = useMemo(() => {
    if (
      searchQuery.trim() ||
      advancedFilters.paymentFilter !== 'all' ||
      advancedFilters.startDate ||
      advancedFilters.endDate
    ) {
      return t('orders.emptySearch');
    }
    if (statusFilter !== 'all') {
      return t('orders.emptyStatus');
    }
    return t('orders.emptyDefault');
  }, [searchQuery, statusFilter, advancedFilters, t]);

  return (
    <section className="dashboard-page flex w-full min-w-0 flex-col gap-5 pt-5 sm:gap-6 sm:pt-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          {t('orders.title')}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-foreground)]">
          {t('orders.description')}
        </p>
      </div>

      {noStore ? (
        <DashboardSection
          title={t('orders.startStoreTitle')}
          description={t('orders.startStoreDescription')}
        >
          <div className="flex min-w-0 flex-col gap-3 rounded-2xl bg-[var(--surface-secondary)] px-4 py-3.5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--muted-foreground)]">
                <Package className="size-4.5" strokeWidth={1.75} aria-hidden />
              </span>
              <p className="text-[13px] leading-5 text-[var(--muted-foreground)]">
                {t('orders.noStoreHint')}
              </p>
            </div>
            <Link
              href="/app/products"
              className="inline-flex h-9 w-fit items-center justify-center rounded-full bg-[var(--foreground)] px-4 text-[13px] font-medium text-[var(--background)]"
            >
              {t('orders.goToProducts')}
            </Link>
          </div>
        </DashboardSection>
      ) : (
        <>
          <section className="flex min-w-0 flex-col gap-4 rounded-xl bg-[var(--surface)] p-4 sm:p-5">
            {error ? (
              <DashboardNotice
                tone="danger"
                title={t('orders.loadFailed')}
                description={error}
              />
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
                  placeholder={t('orders.searchPlaceholder')}
                  className="rounded-lg ps-9 shadow-none"
                />
              </div>

              <OrdersAdvancedSearch
                open={advancedOpen}
                onOpenChange={setAdvancedOpen}
                filters={advancedFilters}
                onChange={setAdvancedFilters}
                onReset={() => setAdvancedFilters(EMPTY_ADVANCED)}
              />

              <div className="flex flex-wrap gap-2">
                {ORDER_STATUS_FILTER_IDS.map((id) => {
                  const selected = statusFilter === id;
                  const label =
                    id === 'all' ? t('common.all') : t(`orders.status.${id}`);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setStatusFilter(id)}
                      className={cn(
                        orderPillButtonClass,
                        selected &&
                          'bg-[var(--foreground)] text-[var(--background)] hover:opacity-100',
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </DashboardPanel>

            <div className="min-w-0 pt-2">
              <OrdersTable
                orders={displayOrders}
                isLoading={loading}
                emptyMessage={emptyMessage}
                onOpenDetails={openOrderDetails}
                onRefresh={() => void loadOrders()}
              />
            </div>
          </section>
        </>
      )}
    </section>
  );
}
