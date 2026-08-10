'use client';

import { memo, useState } from 'react';
import { Package } from 'lucide-react';
import { getProductDisplayName } from '@/lib/collections/api';
import type { MyStoreProduct } from '@/lib/collections/types';
import { formatProductPrice, getProductImage } from '@/lib/collections/product-utils';
import { cn } from '@/lib/utils';

interface CollectionProductCardProps {
  product: MyStoreProduct;
  className?: string;
}

function CollectionProductCardComponent({ product, className }: CollectionProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getProductImage(product);
  const showImage = Boolean(imageUrl) && !imageFailed;
  const title = getProductDisplayName(product);
  const isDraft = product.status === 'DRAFT';
  const basePrice = Number(product.price);
  const salePrice =
    product.salePrice != null && product.salePrice !== ''
      ? Number(product.salePrice)
      : null;
  const hasDiscount =
    salePrice != null && Number.isFinite(salePrice) && salePrice < basePrice;

  return (
    <article className={cn('group flex min-w-0 flex-col gap-2.5', className)}>
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--surface-secondary)]">
        {showImage ? (
          <img
            src={imageUrl!}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="size-8 text-[var(--muted-foreground)]/35" strokeWidth={1.5} aria-hidden />
          </div>
        )}

        {isDraft ? (
          <span className="absolute start-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            مسودة
          </span>
        ) : null}
      </div>

      <div className="min-w-0 space-y-1">
        <h3
          dir="auto"
          className="line-clamp-2 text-[13px] font-semibold leading-snug text-[var(--foreground)] sm:text-[14px]"
          title={title}
        >
          {title}
        </h3>
        <p className="text-[12px] font-medium text-[var(--muted-foreground)]">
          {hasDiscount ? (
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="line-through opacity-70">
                {formatProductPrice(basePrice)}
              </span>
              <span className="font-semibold text-[var(--primary)]">
                {formatProductPrice(salePrice!)}
              </span>
            </span>
          ) : (
            formatProductPrice(basePrice)
          )}
        </p>
      </div>
    </article>
  );
}

export function CollectionProductCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-2.5">
      <div className="aspect-square rounded-xl bg-[var(--surface-secondary)]/70" />
      <div className="space-y-1.5">
        <div className="h-3.5 w-full rounded-md bg-[var(--surface-secondary)]/70" />
        <div className="h-3 w-[45%] rounded-md bg-[var(--surface-secondary)]/50" />
      </div>
    </div>
  );
}

export const CollectionProductCard = memo(CollectionProductCardComponent);
