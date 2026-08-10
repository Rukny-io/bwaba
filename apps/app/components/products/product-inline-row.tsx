'use client';

import { memo } from 'react';
import type { StoreProduct } from '@/lib/products/types';
import { getProductDisplayName } from '@/lib/products/api';
import { getProductImage } from '@/lib/collections/product-utils';
import type { MyStoreProduct } from '@/lib/collections/types';
import {
  getProductCategoryLabel,
  getProductKindLabelFor,
  getProductStockDisplay,
  resolveProductKind,
} from '@/lib/products/product-display';
import {
  ProductCategoryBadge,
  ProductKindBadge,
  ProductPriceDisplay,
  ProductStockBadge,
  ProductThumbnail,
} from '@/components/products/product-list-primitives';
import { cn } from '@/lib/utils';

interface ProductInlineRowProps {
  product: StoreProduct;
  className?: string;
}

function ProductInlineRowComponent({ product, className }: ProductInlineRowProps) {
  const imageUrl = getProductImage(product as MyStoreProduct);
  const title = getProductDisplayName(product);
  const kind = resolveProductKind(product);
  const stock = getProductStockDisplay(product);
  const categoryLabel = getProductCategoryLabel(product);

  return (
    <article
      className={cn(
        'grid grid-cols-[minmax(0,1fr)_7.5rem_6.5rem_5.5rem] items-center gap-3 border-b border-[var(--border)]/70 px-1 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_9rem_7.5rem_6rem] sm:gap-4 sm:px-2',
        product.status === 'INACTIVE' && 'opacity-70',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <ProductThumbnail
          imageUrl={imageUrl}
          className="size-14 rounded-xl sm:size-16"
        />
        <div className="min-w-0">
          <h3
            dir="auto"
            className="truncate text-[14px] font-semibold text-[var(--foreground)]"
            title={title}
          >
            {title}
          </h3>
          <ProductPriceDisplay
            price={product.price}
            salePrice={product.salePrice}
            className="mt-0.5"
          />
        </div>
      </div>

      <div className="min-w-0 justify-self-start">
        <ProductCategoryBadge label={categoryLabel} />
      </div>

      <div className="justify-self-start">
        <ProductStockBadge label={stock.label} variant={stock.variant} />
      </div>

      <div className="justify-self-start">
        <ProductKindBadge kind={kind} label={getProductKindLabelFor(product)} />
      </div>
    </article>
  );
}

export function ProductInlineHeader() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_7.5rem_6.5rem_5.5rem] gap-3 border-b border-[var(--border)] px-1 pb-2 text-[11px] font-semibold text-[var(--muted-foreground)] sm:grid-cols-[minmax(0,1fr)_9rem_7.5rem_6rem] sm:gap-4 sm:px-2">
      <span>المنتج</span>
      <span>المجموعة</span>
      <span>المخزون</span>
      <span>النوع</span>
    </div>
  );
}

export function ProductInlineRowSkeleton() {
  return (
    <div className="grid animate-pulse grid-cols-[minmax(0,1fr)_7.5rem_6.5rem_5.5rem] items-center gap-3 border-b border-[var(--border)]/50 px-1 py-4 sm:grid-cols-[minmax(0,1fr)_9rem_7.5rem_6rem] sm:gap-4 sm:px-2">
      <div className="flex items-center gap-3">
        <div className="size-14 rounded-xl bg-[var(--surface-secondary)]/70 sm:size-16" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-3.5 w-[70%] rounded-md bg-[var(--surface-secondary)]/70" />
          <div className="h-3 w-[35%] rounded-md bg-[var(--surface-secondary)]/50" />
        </div>
      </div>
      <div className="h-6 w-20 rounded-lg bg-[var(--surface-secondary)]/60" />
      <div className="h-6 w-16 rounded-full bg-[var(--surface-secondary)]/50" />
      <div className="h-6 w-14 rounded-full bg-[var(--surface-secondary)]/50" />
    </div>
  );
}

export const ProductInlineRow = memo(ProductInlineRowComponent);
