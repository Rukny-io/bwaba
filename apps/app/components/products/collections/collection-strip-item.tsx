'use client';

import { memo, useState } from 'react';
import { Layers, Pencil } from 'lucide-react';
import { getCollectionDisplayName } from '@/lib/collections/api';
import type { ProductCollection } from '@/lib/collections/types';
import { formatNumber } from '@/lib/dashboard-format';
import { resolveMediaUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';

interface CollectionStripItemProps {
  collection: ProductCollection;
  selected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
}

function CollectionStripItemComponent({
  collection,
  selected = false,
  onSelect,
  onEdit,
}: CollectionStripItemProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const title = getCollectionDisplayName(collection);
  const imageUrl = resolveMediaUrl(collection.imagePath);
  const bannerUrl = resolveMediaUrl(collection.bannerPath);
  const thumbUrl = imageUrl ?? bannerUrl;
  const showImage = Boolean(thumbUrl) && !imageFailed;
  const productLabel =
    collection.productsCount === 1
      ? 'منتج واحد'
      : `${formatNumber(collection.productsCount)} منتجات`;

  return (
    <div className="group flex w-[5.25rem] shrink-0 flex-col items-center gap-2.5 sm:w-[5.75rem]">
      <div className="relative w-full">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className="block w-full"
        >
          <div
            className={cn(
              'relative aspect-square w-full overflow-hidden rounded-2xl bg-[var(--surface-secondary)] ring-1 transition-all duration-150',
              selected
                ? 'ring-2 ring-[var(--foreground)]'
                : 'ring-[var(--border)] group-hover:ring-[color-mix(in_srgb,var(--border)_55%,var(--foreground)_25%)]',
            )}
          >
            {showImage ? (
              <img
                src={thumbUrl!}
                alt=""
                loading="lazy"
                onError={() => setImageFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--primary)]/8 via-[var(--surface-secondary)] to-[var(--surface-secondary)]">
                <Layers
                  className="size-7 text-[var(--muted-foreground)]/30 sm:size-8"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </div>
            )}
          </div>
        </button>

        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`تعديل ${title}`}
            className={cn(
              'absolute end-0 top-0 z-10 flex size-6 translate-x-1 -translate-y-1 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] shadow-sm transition-all duration-150 hover:border-[var(--foreground)]/20 hover:text-[var(--foreground)] sm:size-7',
              selected ? 'opacity-100' : 'max-sm:hidden',
              'sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100',
            )}
          >
            <Pencil className="size-3 sm:size-3.5" strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onSelect}
        dir="auto"
        className={cn(
          'flex w-full flex-col items-center gap-0.5 text-center',
          selected
            ? 'text-[var(--foreground)]'
            : 'text-[var(--muted-foreground)]',
        )}
        title={`${title} · ${productLabel}`}
      >
        <span
          className={cn(
            'line-clamp-1 w-full text-[11px] leading-snug sm:text-xs',
            selected ? 'font-semibold' : 'font-medium',
          )}
        >
          {title}
        </span>
        <span className="line-clamp-1 w-full text-[10px] leading-none text-[var(--muted-foreground)]/80 sm:text-[11px]">
          {productLabel}
        </span>
      </button>
    </div>
  );
}

export function CollectionStripItemSkeleton() {
  return (
    <div className="flex w-[5.25rem] shrink-0 animate-pulse flex-col items-center gap-2.5 sm:w-[5.75rem]">
      <div className="aspect-square w-full rounded-2xl bg-[var(--surface-secondary)]/80" />
      <div className="h-2.5 w-[72%] rounded bg-[var(--surface-secondary)]/60" />
      <div className="h-2 w-[55%] rounded bg-[var(--surface-secondary)]/40" />
    </div>
  );
}

export const CollectionStripItem = memo(CollectionStripItemComponent);
