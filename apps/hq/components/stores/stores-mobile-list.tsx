'use client';

import Link from 'next/link';
import { ExternalLink, Package, ShoppingCart } from 'lucide-react';
import { Chip } from '@heroui/react';
import type { AdminStore } from '@/lib/types/stores';
import { StoresTableStoreCell } from '@/components/stores/stores-table-store-cell';
import { StoresTableOwnerCell } from '@/components/stores/stores-table-owner-cell';
import { getStorePublicUrl } from '@/lib/stores-url';
import {
  formatStoreDate,
  formatStoreMetric,
  formatStoreStatus,
  storeStatusChipColor,
} from '@/lib/stores-format';
import { ClientPagination } from '@/components/shared/client-pagination';

interface StoresMobileListProps {
  stores: AdminStore[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

function StoresMobileSkeleton() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <li
          key={`stores-mobile-loading-${index}`}
          className="h-[9rem] animate-pulse rounded-2xl bg-[var(--surface-secondary)]"
        />
      ))}
    </ul>
  );
}

export function StoresMobileList({
  stores,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
}: StoresMobileListProps) {
  if (isLoading) {
    return <StoresMobileSkeleton />;
  }

  if (stores.length === 0) {
    return (
      <div className="rounded-2xl bg-[var(--surface-secondary)]/50 px-4 py-10 text-center">
        <p className="text-sm font-medium text-[var(--foreground)]">No stores found</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Try a different search term or filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {stores.map((store) => {
          const category = store.store_categories;
          return (
            <li key={store.id}>
              <div className="rounded-2xl bg-[var(--surface-secondary)]/55 p-3">
                <Link href={`/app/stores/${store.id}`} className="block">
                  <StoresTableStoreCell store={store} linkToDetail={false} />
                </Link>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Chip color={storeStatusChipColor(store.status)} size="sm" variant="soft">
                    {formatStoreStatus(store.status)}
                  </Chip>
                  {category ? (
                    <Chip
                      size="sm"
                      variant="soft"
                      style={{
                        backgroundColor: `${category.color}22`,
                        color: category.color,
                      }}
                    >
                      {category.nameAr}
                    </Chip>
                  ) : null}
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2.5 py-1 text-[11px] text-[var(--muted-foreground)]">
                    <Package className="size-3" />
                    {formatStoreMetric(store._count.products)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2.5 py-1 text-[11px] text-[var(--muted-foreground)]">
                    <ShoppingCart className="size-3" />
                    {formatStoreMetric(store._count.orders)}
                  </span>
                </div>

                <div className="mt-3 border-t border-[var(--border)]/40 pt-3">
                  <StoresTableOwnerCell owner={store.user} />
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <time
                    className="text-[11px] text-[var(--muted-foreground)]"
                    dateTime={store.createdAt}
                  >
                    {formatStoreDate(store.createdAt)}
                  </time>
                  <a
                    href={getStorePublicUrl(store.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[var(--primary)]"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <ExternalLink className="size-3" />
                    View
                  </a>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="rounded-2xl bg-[var(--surface-secondary)]/40 px-2 py-2">
        <ClientPagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}
