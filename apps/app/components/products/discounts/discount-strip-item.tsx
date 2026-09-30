'use client';

import { memo } from 'react';
import { Pencil } from 'lucide-react';
import type { ProductDiscount } from '@/lib/discounts/types';
import { formatDiscountLabel } from '@/lib/discounts/api';
import { formatNumber } from '@/lib/dashboard-format';
import { cn } from '@/lib/utils';

interface DiscountStripItemProps {
  discount: ProductDiscount;
  selected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
}

function DiscountStripItemComponent({
  discount,
  selected = false,
  onSelect,
  onEdit,
}: DiscountStripItemProps) {
  const title = formatDiscountLabel(discount.percentage);
  const productLabel =
    discount.productsCount === 1
      ? 'منتج واحد'
      : `${formatNumber(discount.productsCount)} منتجات`;

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
              'relative flex aspect-square w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)]/12 via-[var(--surface-secondary)] to-[var(--surface-secondary)] ring-1 transition-all duration-150',
              selected
                ? 'ring-2 ring-[var(--foreground)]'
                : 'ring-[var(--border)] group-hover:ring-[color-mix(in_srgb,var(--border)_55%,var(--foreground)_25%)]',
            )}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--primary)]/80">
              خصم
            </span>
            <span className="text-xl font-bold tabular-nums leading-none tracking-tight text-[var(--foreground)] sm:text-[1.35rem]">
              {formatNumber(discount.percentage)}%
            </span>
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

export function DiscountStripItemSkeleton() {
  return (
    <div className="flex w-[5.25rem] shrink-0 animate-pulse flex-col items-center gap-2.5 sm:w-[5.75rem]">
      <div className="aspect-square w-full rounded-2xl bg-[var(--surface-secondary)]/80" />
      <div className="h-2.5 w-[72%] rounded bg-[var(--surface-secondary)]/60" />
      <div className="h-2 w-[55%] rounded bg-[var(--surface-secondary)]/40" />
    </div>
  );
}

export const DiscountStripItem = memo(DiscountStripItemComponent);
