'use client';

import { memo, useState } from 'react';
import { Pencil, Percent } from 'lucide-react';
import type { ProductDiscount } from '@/lib/discounts/types';
import { formatDiscountLabel } from '@/lib/discounts/api';
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
      : `${discount.productsCount} منتجات`;

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
              'relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border-2 bg-[var(--primary)]/10 transition-colors duration-200',
              selected
                ? 'border-[var(--foreground)]'
                : 'border-transparent group-hover:border-[var(--border)]',
            )}
          >
            <Percent
              className="size-5 text-[var(--primary)] sm:size-[1.35rem]"
              strokeWidth={2}
              aria-hidden
            />

            {!discount.isActive ? (
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
        className={cn(
          'line-clamp-2 w-full text-center text-[11px] leading-snug sm:text-[12px]',
          selected
            ? 'font-semibold text-[var(--foreground)]'
            : 'font-medium text-[var(--muted-foreground)]',
        )}
        title={`${title} · ${productLabel}`}
      >
        {title}
      </button>
    </div>
  );
}

export function DiscountStripItemSkeleton() {
  return (
    <div className="flex w-[4.5rem] shrink-0 animate-pulse flex-col items-center gap-1.5 sm:w-[5rem]">
      <div className="aspect-square w-full rounded-2xl bg-[var(--surface-secondary)]/80" />
      <div className="h-2.5 w-[70%] rounded bg-[var(--surface-secondary)]/60" />
    </div>
  );
}

export const DiscountStripItem = memo(DiscountStripItemComponent);
