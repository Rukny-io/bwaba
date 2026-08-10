'use client';

import { memo, useState } from 'react';
import { Layers, Pencil } from 'lucide-react';
import { getCollectionDisplayName } from '@/lib/collections/api';
import type { ProductCollection } from '@/lib/collections/types';
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

  return (
    <div className="group flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5 sm:w-[5rem]">
      <div className="relative w-full">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className="block w-full"
        >
          <div
            className={cn(
              'relative aspect-square w-full overflow-hidden rounded-2xl border-2 bg-[var(--surface-secondary)] transition-colors duration-200',
              selected
                ? 'border-[var(--foreground)]'
                : 'border-transparent group-hover:border-[var(--border)]',
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
              <div className="flex h-full w-full items-center justify-center">
                <Layers
                  className="size-5 text-[var(--muted-foreground)]/30"
                  strokeWidth={1.5}
                  aria-hidden
                />
              </div>
            )}

            {!collection.isActive ? (
              <span className="absolute start-1 top-1 size-1.5 rounded-full bg-amber-500 ring-1 ring-white" />
            ) : null}
          </div>
        </button>

        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`تعديل ${title}`}
            className={cn(
              'absolute start-0 top-0 z-10 flex size-6 -translate-x-1 -translate-y-1 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] shadow-sm transition-all duration-150 hover:border-[var(--foreground)]/20 hover:text-[var(--foreground)] sm:size-7',
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
          'line-clamp-2 w-full text-center text-[11px] leading-snug sm:text-[12px]',
          selected ? 'font-semibold text-[var(--foreground)]' : 'font-medium text-[var(--muted-foreground)]',
        )}
        title={title}
      >
        {title}
      </button>
    </div>
  );
}

export function CollectionStripItemSkeleton() {
  return (
    <div className="flex w-[4.5rem] shrink-0 animate-pulse flex-col items-center gap-1.5 sm:w-[5rem]">
      <div className="aspect-square w-full rounded-2xl bg-[var(--surface-secondary)]/80" />
      <div className="h-2.5 w-[70%] rounded bg-[var(--surface-secondary)]/60" />
    </div>
  );
}

export const CollectionStripItem = memo(CollectionStripItemComponent);
