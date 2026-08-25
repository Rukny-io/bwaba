'use client';

import { useState } from 'react';
import { Box, Download, Package, Wrench } from 'lucide-react';
import type { ProductKind } from '@/lib/products/types';
import { formatProductPrice } from '@/lib/collections/product-utils';
import { cn } from '@/lib/utils';

const KIND_ICONS = {
  PHYSICAL: Box,
  DIGITAL: Download,
  SERVICE: Wrench,
} as const;

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
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden bg-[var(--surface-secondary)]',
        className,
      )}
    >
      {showImage ? (
        <img
          src={imageUrl!}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
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

export function ProductKindBadge({ kind, label, className }: ProductKindBadgeProps) {
  const Icon = KIND_ICONS[kind] ?? Package;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none',
        kind === 'PHYSICAL' &&
          'border-[color-mix(in_srgb,var(--success)_28%,var(--border))] bg-[color-mix(in_srgb,var(--success)_12%,var(--surface))] text-[color-mix(in_srgb,var(--success)_78%,var(--foreground))]',
        kind === 'DIGITAL' &&
          'border-[color-mix(in_srgb,var(--primary)_28%,var(--border))] bg-[color-mix(in_srgb,var(--primary)_10%,var(--surface))] text-[color-mix(in_srgb,var(--primary)_82%,var(--foreground))]',
        kind === 'SERVICE' &&
          'border-[color-mix(in_srgb,var(--warning)_30%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_12%,var(--surface))] text-[color-mix(in_srgb,var(--warning)_78%,var(--foreground))]',
        className,
      )}
    >
      <Icon className="size-3" strokeWidth={2} aria-hidden />
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
    return <span className={cn('text-[12px] text-[var(--muted-foreground)]', className)}>—</span>;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium',
        variant === 'low' &&
          'border-[color-mix(in_srgb,var(--danger)_22%,var(--border))] bg-[color-mix(in_srgb,var(--danger)_6%,var(--surface))] text-[var(--danger)]',
        variant === 'unlimited' &&
          'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]',
        variant === 'default' &&
          'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
        className,
      )}
    >
      {variant === 'unlimited' ? (
        <span className="size-1.5 rounded-full bg-[var(--primary)]" aria-hidden />
      ) : null}
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
    return (
      <span className={cn('flex min-w-0 flex-col items-start gap-0.5', className)}>
        <span className="text-[14px] font-semibold tabular-nums leading-none text-[var(--foreground)]">
          {formatProductPrice(parsedSale!)}
        </span>
        <span className="text-[12px] font-medium tabular-nums leading-none text-[var(--muted-foreground)] line-through">
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

  return (
    <span
      className={cn(
        layout === 'stack'
          ? 'text-[14px] font-semibold tabular-nums text-[var(--foreground)]'
          : cn(textSize, 'font-medium text-[var(--muted-foreground)]'),
        className,
      )}
    >
      {formatProductPrice(basePrice)}
    </span>
  );
}
