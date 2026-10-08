'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Skeleton } from '@heroui/react';
import { ArrowRight } from 'lucide-react';
import { DashboardNotice } from '@/components/app/dashboard-section';
import {
  OrderDetailContent,
  OrderDetailFooter,
} from '@/components/orders/order-detail-content';
import { ApiException } from '@/lib/api-client';
import { fetchStoreOrder } from '@/lib/orders/api';
import { findMockOrder } from '@/lib/orders/mock-orders';
import type { StoreOrder } from '@/lib/orders/types';

export function OrderDetailView() {
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
            ? 'الطلب غير موجود.'
            : err instanceof ApiException
              ? err.message
              : 'تعذّر تحميل الطلب',
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <section className="dashboard-page flex w-full min-w-0 flex-col gap-4 pt-5 sm:pt-6">
      <Link
        href="/app/orders"
        className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      >
        <ArrowRight className="size-4" strokeWidth={1.75} aria-hidden />
        الطلبات
      </Link>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-7 w-40 rounded-lg" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : error ? (
        <DashboardNotice tone="danger" title="تعذّر التحميل" description={error} />
      ) : order ? (
        <div className="overflow-hidden rounded-xl bg-[var(--surface)]">
          <div className="px-4 pt-4">
            <OrderDetailContent order={order} />
          </div>
          <OrderDetailFooter order={order} />
        </div>
      ) : null}
    </section>
  );
}
