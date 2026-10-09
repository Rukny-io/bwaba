'use client';

import type { AdminStore } from '@/lib/types/stores';
import { StoreCard } from '@/components/stores/store-card';
import { ClientPagination } from '@/components/shared/client-pagination';

interface StoresCardsGridProps {
  stores: AdminStore[];
  isLoading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

function StoresCardsSkeleton() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <li
          key={`stores-card-loading-${index}`}
          className="h-[14rem] animate-pulse rounded-2xl bg-[var(--surface-secondary)] sm:rounded-3xl"
        />
      ))}
    </ul>
  );
}

export function StoresCardsGrid({
  stores,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
}: StoresCardsGridProps) {
  if (isLoading) {
    return <StoresCardsSkeleton />;
  }

  if (stores.length === 0) {
    return (
      <div className="dashboard-card rounded-2xl px-6 py-16 text-center sm:rounded-3xl">
        <p className="text-sm font-medium text-[var(--foreground)]">No stores found</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Try a different search term or filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stores.map((store) => (
          <li key={store.id} className="min-h-0">
            <StoreCard store={store} />
          </li>
        ))}
      </ul>

      <div className="dashboard-card rounded-2xl px-3 py-2 sm:rounded-3xl">
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
