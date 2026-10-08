'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Skeleton } from '@heroui/react';
import { ArrowLeft } from 'lucide-react';
import { DashboardNotice } from '@/components/app/dashboard-section';
import { OrderDetailContent } from '@/components/orders/order-detail-content';
import { ApiException } from '@/lib/api-client';
import { useTranslations } from '@/lib/i18n';
import { fetchStoreOrder } from '@/lib/orders/api';
import { findMockOrder } from '@/lib/orders/mock-orders';
import type { StoreOrder } from '@/lib/orders/types';

export function OrderDetailView() {
  const { t } = useTranslations();
  const params = useParams<{ id: string }>();
  const orderId = params?.id ? decodeURIComponent(params.id) : '';
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const mock = findMockOrder(orderId);
    if (mock) {
      setOrder(mock);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchStoreOrder(orderId)
      .then((result) => {
        if (!cancelled) setOrder(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiException && err.statusCode === 404
            ? t('orders.detail.notFound')
            : err instanceof ApiException
              ? err.message
              : t('orders.detail.loadFailed'),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, t]);

  return (
    <section className="dashboard-page flex w-full min-w-0 flex-col gap-4 pt-5 sm:pt-6">
      <Link
        href="/app/orders"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" strokeWidth={1.75} aria-hidden />
        {t('orders.detail.back')}
      </Link>

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : error ? (
        <DashboardNotice
          tone="danger"
          title={t('orders.detail.loadFailedTitle')}
          description={error}
        />
      ) : order ? (
        <OrderDetailContent order={order} />
      ) : null}
    </section>
  );
}
