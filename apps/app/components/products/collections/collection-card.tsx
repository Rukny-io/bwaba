'use client';

import { memo, useState, type SyntheticEvent } from 'react';
import { motion } from 'framer-motion';
import { Layers, Package } from 'lucide-react';
import { getCollectionDisplayName } from '@/lib/collections/api';
import type { ProductCollection } from '@/lib/collections/types';
import type { ProductsViewMode } from '@/components/products/products-view-mode';
import { resolveMediaUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';

interface CollectionCardProps {
  collection: ProductCollection;
  viewMode?: ProductsViewMode;
  className?: string;
}

function stopActivation(event: SyntheticEvent) {
  event.stopPropagation();
}

function CollectionCoverPlaceholder() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[color-mix(in_srgb,var(--foreground)_7%,var(--surface))] via-[var(--surface-secondary)]/55 to-[var(--surface)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--border) 55%, transparent) 1px, transparent 0)',
          backgroundSize: '14px 14px',
        }}
        aria-hidden
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Layers
          className="size-10 text-[var(--muted-foreground)]/25 sm:size-11"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
    </div>
  );
}

function CollectionCover({
  collection,
  className,
}: {
  collection: ProductCollection;
  className?: string;
}) {
  const [coverFailed, setCoverFailed] = useState(false);
  const bannerUrl = resolveMediaUrl(collection.bannerPath);
  const imageUrl = resolveMediaUrl(collection.imagePath);
  const coverUrl = bannerUrl ?? imageUrl;
  const showCover = Boolean(coverUrl) && !coverFailed;

  return (
    <div className={cn('relative overflow-hidden bg-[var(--surface-secondary)]', className)}>
      {showCover ? (
        <>
          <img
            src={coverUrl!}
            alt=""
            loading="lazy"
            onError={() => setCoverFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        </>
      ) : (
        <CollectionCoverPlaceholder />
      )}

      {!collection.isActive ? (
        <span
          className="absolute start-2 top-2 z-10 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm"
          onClick={stopActivation}
          onPointerDown={stopActivation}
        >
          مخفية
        </span>
      ) : null}

      {imageUrl && bannerUrl ? (
        <div className="absolute bottom-2 start-2 z-10 size-8 overflow-hidden rounded-lg border border-white/70 shadow-sm">
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
    </div>
  );
}

function CollectionCardGrid({
  collection,
  className,
  aspectClass = 'aspect-[4/3]',
}: {
  collection: ProductCollection;
  className?: string;
  aspectClass?: string;
}) {
  const title = getCollectionDisplayName(collection);
  const productsLabel =
    collection.productsCount === 1
      ? 'منتج واحد'
      : `${collection.productsCount} منتج`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'group dashboard-metric-tile flex flex-col rounded-2xl p-2.5 transition-[border-color,background-color] duration-200',
        'hover:border-[color-mix(in_srgb,var(--border)_45%,var(--foreground)_12%)]',
        !collection.isActive && 'opacity-[0.94]',
        className,
      )}
    >
      <CollectionCover collection={collection} className={cn('rounded-xl', aspectClass)} />

      <div className="flex min-w-0 flex-1 flex-col gap-1 px-0.5 pt-2.5 text-start">
        <h3
          dir="auto"
          className="truncate text-[14px] font-semibold leading-[1.35] tracking-tight text-[var(--foreground)]"
          title={title}
        >
          {title}
        </h3>

        <p className="mt-auto truncate text-[12px] leading-relaxed text-[var(--muted-foreground)]">
          {productsLabel}
        </p>
      </div>
    </motion.article>
  );
}

function CollectionCardInline({
  collection,
  className,
}: {
  collection: ProductCollection;
  className?: string;
}) {
  const title = getCollectionDisplayName(collection);
  const productsLabel =
    collection.productsCount === 1
      ? 'منتج واحد'
      : `${collection.productsCount} منتج`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16 }}
      className={cn(
        'dashboard-metric-tile flex items-center gap-3 rounded-2xl p-2.5',
        !collection.isActive && 'opacity-[0.94]',
        className,
      )}
    >
      <CollectionCover
        collection={collection}
        className="size-14 shrink-0 rounded-xl sm:size-16"
      />

      <div className="min-w-0 flex-1">
        <h3
          dir="auto"
          className="truncate text-[14px] font-semibold text-[var(--foreground)]"
          title={title}
        >
          {title}
        </h3>
        <p className="mt-0.5 truncate text-[12px] text-[var(--muted-foreground)]">
          {productsLabel}
        </p>
      </div>

      <Package
        className="size-4 shrink-0 text-[var(--muted-foreground)]/60"
        strokeWidth={1.75}
        aria-hidden
      />
    </motion.article>
  );
}

function CollectionCardComponent({
  collection,
  viewMode = 'grid',
  className,
}: CollectionCardProps) {
  if (viewMode === 'inline') {
    return <CollectionCardInline collection={collection} className={className} />;
  }

  return (
    <CollectionCardGrid
      collection={collection}
      className={className}
      aspectClass={viewMode === 'full' ? 'aspect-[16/9]' : 'aspect-[4/3]'}
    />
  );
}

export function CollectionCardSkeleton({ inline = false }: { inline?: boolean }) {
  if (inline) {
    return (
      <div className="dashboard-metric-tile flex animate-pulse items-center gap-3 rounded-2xl p-2.5">
        <div className="size-14 shrink-0 rounded-xl bg-[var(--surface-secondary)]/70 sm:size-16" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3.5 w-[70%] rounded-md bg-[var(--surface-secondary)]/70" />
          <div className="h-3 w-[40%] rounded-md bg-[var(--surface-secondary)]/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-metric-tile animate-pulse rounded-2xl p-2.5">
      <div className="aspect-[4/3] rounded-xl bg-[var(--surface-secondary)]/70" />
      <div className="px-0.5 pt-2.5">
        <div className="h-3.5 w-[78%] rounded-md bg-[var(--surface-secondary)]/70" />
        <div className="mt-2 h-3 w-[45%] rounded-md bg-[var(--surface-secondary)]/50" />
      </div>
    </div>
  );
}

export const CollectionCard = memo(CollectionCardComponent);
