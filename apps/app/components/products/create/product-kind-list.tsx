'use client';

import { ChevronRight, SearchX } from 'lucide-react';
import { ProductKindIconBadge } from '@/components/products/create/product-kind-icon-badge';
import type { ProductKindCatalogItem } from '@/lib/products/product-kind-catalog';
import { cn } from '@/lib/utils';

interface ProductKindListProps {
  items: ProductKindCatalogItem[];
  onPick: (item: ProductKindCatalogItem) => void;
  compact?: boolean;
}

export function ProductKindList({ items, onPick, compact }: ProductKindListProps) {
  if (items.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 text-center',
          compact
            ? 'px-2 py-14'
            : 'rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/30 px-4 py-12',
        )}
      >
        <SearchX className="size-7 text-[var(--muted-foreground)]/70" />
        <div>
          <p className="text-[14px] font-semibold text-[var(--foreground)]">
            لا توجد أنواع مطابقة
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
            جرّب كلمة بحث أخرى.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onPick(item)}
            className={cn(
              'group flex w-full items-center gap-3 rounded-2xl text-start transition-colors duration-150',
              compact ? 'px-2.5 py-2.5' : 'px-2.5 py-2.5 sm:px-3 sm:py-3',
              'hover:bg-[var(--surface-secondary)]/50 active:bg-[var(--surface-secondary)] active:scale-[0.995]',
            )}
            dir="rtl"
          >
            <ProductKindIconBadge kind={item.id} size={compact ? 'sm' : 'md'} />

            <div className="min-w-0 flex-1 text-right">
              <p className="truncate text-[14.5px] font-semibold text-[var(--foreground)] sm:text-[15px]">
                {item.label}
              </p>
              <p className="truncate text-[12px] text-[var(--muted-foreground)] sm:text-xs">
                {item.description}
              </p>
            </div>

            <ChevronRight
              className="size-4 shrink-0 rotate-180 text-[var(--muted-foreground)] opacity-40 transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:opacity-70"
              aria-hidden
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
