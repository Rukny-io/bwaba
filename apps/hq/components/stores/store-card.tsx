'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Chip } from '@heroui/react';
import type { AdminStore } from '@/lib/types/stores';
import { StoresTableStoreCell } from '@/components/stores/stores-table-store-cell';
import { StoresTableOwnerCell } from '@/components/stores/stores-table-owner-cell';
import { getStorePublicUrl } from '@/lib/stores-url';
import {
  formatStoreDate,
  formatStoreStatus,
  storeStatusChipColor,
} from '@/lib/stores-format';
import { cn } from '@/lib/utils';

interface StoreCardProps {
  store: AdminStore;
}

export function StoreCard({ store }: StoreCardProps) {
  const category = store.store_categories;
  const detailHref = `/app/stores/${store.id}`;
  const publicUrl = getStorePublicUrl(store.slug);

  return (
    <article className="dashboard-card flex h-full flex-col rounded-2xl p-4 sm:rounded-3xl sm:p-5">
      <StoresTableStoreCell store={store} />

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
            <span className="max-w-[10rem] truncate">{category.nameAr}</span>
          </Chip>
        ) : null}
        {store.city ? (
          <Chip size="sm" variant="soft">
            {store.city}
          </Chip>
        ) : null}
      </div>

      <div className="mt-3 border-t border-[var(--border)]/50 pt-3">
        <StoresTableOwnerCell owner={store.user} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--border)]/50 pt-3">
        <time
          className="text-[11px] text-[var(--muted-foreground)]"
          dateTime={store.createdAt}
        >
          {formatStoreDate(store.createdAt)}
        </time>
        <div className="flex items-center gap-1">
          <Link
            href={detailHref}
            className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-secondary)]"
          >
            Details
          </Link>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex h-8 items-center justify-center gap-1 rounded-lg px-2.5 text-xs font-medium text-[var(--primary)] transition-colors hover:bg-[var(--surface-secondary)]',
            )}
            aria-label={`View ${store.name} storefront`}
          >
            <ExternalLink className="size-3.5" aria-hidden />
            View
          </a>
        </div>
      </div>
    </article>
  );
}
