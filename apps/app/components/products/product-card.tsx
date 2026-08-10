'use client';

import { memo } from 'react';
import type { StoreProduct } from '@/lib/products/types';
import { getProductDisplayName } from '@/lib/products/api';
import { getProductImage } from '@/lib/collections/product-utils';
import type { MyStoreProduct } from '@/lib/collections/types';
import { getProductStockDisplay } from '@/lib/products/product-display';
import {
  ProductPriceDisplay,
  ProductThumbnail,
} from '@/components/products/product-list-primitives';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: StoreProduct;
  className?: string;
}

function stockTextClass(variant: ReturnType<typeof getProductStockDisplay>['variant']) {
  if (variant === 'low') return 'text-[var(--danger)]';
  if (variant === 'muted') return 'text-[var(--muted-foreground)]/70';
  return 'text-[var(--muted-foreground)]';
}

function ProductCardComponent({ product, className }: ProductCardProps) {
  const imageUrl = getProductImage(product as MyStoreProduct);
  const title = getProductDisplayName(product);
  const stock = getProductStockDisplay(product);
  const isHidden = product.status === 'INACTIVE';

  return (
    <article
      className={cn(
        'group/card flex h-full min-w-0 flex-col',
        isHidden && 'opacity-70',
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-[var(--surface-secondary)]">
        <ProductThumbnail
          imageUrl={imageUrl}
          alt={title}
          className="size-full rounded-2xl"
          imageClassName="transition-opacity duration-200 group-hover/card:opacity-[0.92] group-focus-within/card:opacity-[0.92]"
        />

        {isHidden ? (
          <div className="absolute start-2.5 top-2.5">
            <span className="rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              مخفي
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-3.5 flex min-w-0 flex-col gap-0 px-1.5">
        <h3
          dir="auto"
          className="line-clamp-2 text-[14px] font-medium leading-normal text-[var(--foreground)]"
          title={title}
        >
          {title}
        </h3>

        <div
          className="flex w-full items-center justify-between gap-2 text-[14px]"
          dir="rtl"
        >
          <ProductPriceDisplay
            price={product.price}
            salePrice={product.salePrice}
            size="md"
            className="shrink-0 text-[14px] text-[var(--foreground)]"
          />
          {stock.variant !== 'muted' ? (
            <span className={cn('shrink-0 font-medium', stockTextClass(stock.variant))}>
              {stock.label}
            </span>
          ) : (
            <span aria-hidden />
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col">
      <div className="aspect-square rounded-2xl bg-[var(--surface-secondary)]/70" />
      <div className="mt-3.5 space-y-2 px-1.5">
        <div className="h-3.5 w-[88%] rounded-md bg-[var(--surface-secondary)]/70" />
        <div className="flex justify-between gap-2">
          <div className="h-3.5 w-[38%] rounded-md bg-[var(--surface-secondary)]/60" />
          <div className="h-3.5 w-[28%] rounded-md bg-[var(--surface-secondary)]/50 " />
        </div>
      </div>
    </div>
  );
}

export const ProductCard = memo(ProductCardComponent);
