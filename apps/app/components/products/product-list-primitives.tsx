'use client';

import { Package } from 'lucide-react';
import { useResilientImage } from '@/lib/use-resilient-image';
import type { ProductKind } from '@/lib/products/types';
import { formatProductPrice } from '@/lib/collections/product-utils';
import { cn } from '@/lib/utils';

interface ProductThumbnailProps {
  imageUrl: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
}

export function ProductThumbnail({
  imageUrl,
  alt = '',
  className,
  imageClassName,
}: ProductThumbnailProps) {
  const { showImage, imageKey, onError } = useResilientImage(imageUrl);

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden bg-[var(--surface-secondary)]',
        className,
      )}
    >
      {showImage ? (
        <img
          key={imageKey}
          src={imageUrl!}
          alt={alt}
          loading="eager"
          decoding="async"
          onError={onError}
          className={cn('size-full object-cover', imageClassName)}
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <Package
            className="size-[38%] min-w-5 text-[var(--muted-foreground)]/30"
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
      )}
    </div>
  );
}

interface ProductKindBadgeProps {
  kind: ProductKind;
  label: string;
  className?: string;
}

export function ProductKindBadge({ label, className }: ProductKindBadgeProps) {
  return (
    <span
      className={cn(
        'text-[11px] font-medium leading-none text-[var(--muted-foreground)]',
        className,
      )}
    >
      {label}
    </span>
  );
}

interface ProductStockBadgeProps {
  label: string;
  variant: 'muted' | 'default' | 'low' | 'unlimited';
  className?: string;
}

export function ProductStockBadge({ label, variant, className }: ProductStockBadgeProps) {
  if (variant === 'muted') {
    return <span className={cn('text-[11px] text-[var(--muted-foreground)]', className)}>—</span>;
  }

  return (
    <span
      className={cn(
        'text-[11px] font-medium text-[var(--foreground)]',
        variant === 'low' && 'text-[var(--danger)]',
        variant === 'default' && 'text-[var(--muted-foreground)]',
        className,
      )}
    >
      {label}
    </span>
  );
}

interface ProductCategoryBadgeProps {
  label: string | null;
  className?: string;
}

export function ProductCategoryBadge({ label, className }: ProductCategoryBadgeProps) {
  if (!label) {
    return (
      <span className={cn('text-[12px] text-[var(--muted-foreground)]/70', className)}>
        بدون مجموعة
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--foreground)]',
        className,
      )}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

interface ProductPriceDisplayProps {
  price: number | string;
  salePrice?: number | string | null;
  className?: string;
  size?: 'sm' | 'md';
  layout?: 'inline' | 'stack';
}

export function ProductPriceDisplay({
  price,
  salePrice,
  className,
  size = 'sm',
  layout = 'inline',
}: ProductPriceDisplayProps) {
  const basePrice = Number(price);
  const parsedSale =
    salePrice != null && salePrice !== '' ? Number(salePrice) : null;
  const hasDiscount =
    parsedSale != null && Number.isFinite(parsedSale) && parsedSale < basePrice;

  const textSize = size === 'md' ? 'text-[13px]' : 'text-[12px]';

  if (!Number.isFinite(basePrice)) {
    return <span className={cn(textSize, 'text-[var(--muted-foreground)]', className)}>—</span>;
  }

  if (hasDiscount && layout === 'stack') {
    const saleTextSize = size === 'md' ? 'text-[14px]' : 'text-[13px]';
    const baseTextSize = size === 'md' ? 'text-[12px]' : 'text-[11px]';

    return (
      <span className={cn('flex min-w-0 flex-col items-start gap-0.5', className)}>
        <span
          className={cn(
            saleTextSize,
            'font-semibold tabular-nums leading-none text-[var(--foreground)]',
          )}
        >
          {formatProductPrice(parsedSale!)}
        </span>
        <span
          className={cn(
            baseTextSize,
            'font-medium tabular-nums leading-none text-[var(--muted-foreground)] line-through',
          )}
        >
          {formatProductPrice(basePrice)}
        </span>
      </span>
    );
  }

  if (hasDiscount) {
    return (
      <span className={cn('flex flex-wrap items-center gap-1.5', textSize, className)}>
        <span className="font-medium text-[var(--muted-foreground)] line-through opacity-70">
          {formatProductPrice(basePrice)}
        </span>
        <span className="font-semibold text-[var(--primary)]">
          {formatProductPrice(parsedSale!)}
        </span>
      </span>
    );
  }

  const stackTextSize = size === 'md' ? 'text-[14px]' : 'text-[13px]';

  return (
    <span
      className={cn(
        layout === 'stack'
          ? cn(stackTextSize, 'font-semibold tabular-nums text-[var(--foreground)]')
          : cn(textSize, 'font-medium text-[var(--muted-foreground)]'),
        className,
      )}
    >
      {formatProductPrice(basePrice)}
    </span>
  );
}
