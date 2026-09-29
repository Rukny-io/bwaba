'use client';

import { Package } from 'lucide-react';
import { formatProfileProductPrice } from '@/lib/public-profile-copy';
import { useResilientImage } from '@/lib/use-resilient-image';
import type { PublicProfileProduct } from './types';
import { cn } from './utils';

export function formatProductPrice(price: number | string, currencyShort = 'IQD'): string {
  return formatProfileProductPrice(price, currencyShort);
}

export type ProductStockVariant = 'muted' | 'default' | 'low' | 'unlimited';

export interface ProductStockDisplay {
  label: string;
  variant: ProductStockVariant;
}

export function getPublicProductStockDisplay(product: PublicProfileProduct): ProductStockDisplay {
  if (product.isDigital) {
    return { label: '—', variant: 'muted' };
  }

  const quantity = product.stock ?? 0;

  if (quantity <= 0) {
    return { label: 'نفد المخزون', variant: 'low' };
  }

  if (quantity <= 10) {
    return { label: `${quantity} متبقي`, variant: 'low' };
  }

  return { label: 'متوفر', variant: 'default' };
}

function salePercent(price: number, salePrice: number | null | undefined): number | null {
  const sale = salePrice != null ? Number(salePrice) : null;
  if (!Number.isFinite(price) || price <= 0 || sale == null || !Number.isFinite(sale) || sale >= price) {
    return null;
  }
  return Math.max(1, Math.round((1 - sale / price) * 100));
}

interface ProductThumbnailProps {
  imageUrl: string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

export function ProductThumbnail({
  imageUrl,
  alt = '',
  className,
  imageClassName,
  priority = false,
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
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={imageKey}
          src={imageUrl!}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
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
  variant: ProductStockVariant;
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

interface ProductPriceDisplayProps {
  price: number;
  salePrice?: number | null;
  className?: string;
  size?: 'sm' | 'md';
  layout?: 'inline' | 'stack';
  currencyShort?: string;
}

export function ProductPriceDisplay({
  price,
  salePrice,
  className,
  size = 'sm',
  layout = 'stack',
  currencyShort = 'IQD',
}: ProductPriceDisplayProps) {
  const parsedSale = salePrice != null ? Number(salePrice) : null;
  const hasDiscount =
    parsedSale != null && Number.isFinite(parsedSale) && parsedSale < price;

  const textSize = size === 'md' ? 'text-[13px]' : 'text-[12px]';

  if (!Number.isFinite(price)) {
    return <span className={cn(textSize, 'text-[var(--muted-foreground)]', className)}>—</span>;
  }

  if (hasDiscount) {
    const saleTextSize = size === 'md' ? 'text-[14px]' : 'text-[13px]';
    const baseTextSize = size === 'md' ? 'text-[12px]' : 'text-[11px]';

    const discountLayout =
      layout === 'inline'
        ? 'flex min-w-0 flex-wrap items-center gap-1.5'
        : 'flex min-w-0 flex-col items-start gap-0.5';

    return (
      <span className={cn(discountLayout, className)}>
        <span
          dir="ltr"
          className={cn(
            saleTextSize,
            'font-semibold tabular-nums leading-none text-[var(--foreground)]',
          )}
        >
          {formatProfileProductPrice(parsedSale!, currencyShort)}
        </span>
        <span
          dir="ltr"
          className={cn(
            baseTextSize,
            'font-medium tabular-nums leading-none text-[var(--muted-foreground)] line-through',
            layout === 'inline' && 'opacity-70',
          )}
        >
          {formatProfileProductPrice(price, currencyShort)}
        </span>
      </span>
    );
  }

  const stackTextSize = size === 'md' ? 'text-[14px]' : 'text-[13px]';

  return (
    <span
      dir="ltr"
      className={cn(
        layout === 'inline' ? textSize : stackTextSize,
        'font-semibold tabular-nums text-[var(--foreground)]',
        className,
      )}
    >
      {formatProfileProductPrice(price, currencyShort)}
    </span>
  );
}

export function getProductDiscountPercent(product: PublicProfileProduct): number | null {
  return salePercent(product.price, product.salePrice);
}
