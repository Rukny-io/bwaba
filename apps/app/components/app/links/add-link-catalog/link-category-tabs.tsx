'use client';

import { cn } from '@/lib/utils';
import type { LinkCatalogCategory, LinkCatalogCategoryId } from '@/lib/links/link-type-catalog';

interface LinkCategoryTabsProps {
  categories: LinkCatalogCategory[];
  active: LinkCatalogCategoryId;
  onSelect: (id: LinkCatalogCategoryId) => void;
  orientation: 'row' | 'column';
  compact?: boolean;
}

export function LinkCategoryTabs({
  categories,
  active,
  onSelect,
  orientation,
  compact,
}: LinkCategoryTabsProps) {
  return (
    <div
      className={cn(
        'flex [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory',
        orientation === 'row'
          ? 'gap-1.5 overflow-x-auto py-0.5 px-0.5 [scroll-padding-inline:8px]'
          : 'flex-col gap-1 snap-none',
      )}
      dir="rtl"
    >
      {categories.map((item) => {
        const isActive = active === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              'flex shrink-0 items-center antialiased transition-colors duration-150 active:scale-95',
              orientation === 'row'
                ? cn(
                    'snap-start rounded-full font-medium',
                    compact ? 'h-8 gap-1 px-2.5 text-[12px]' : 'h-9 gap-1.5 px-3.5 text-[13px]',
                  )
                : 'h-10 w-full justify-start gap-2.5 rounded-2xl px-3 text-[15px] font-medium text-right',
              isActive
                ? orientation === 'row'
                  ? 'bg-[var(--foreground)] text-[var(--background)] shadow-sm'
                  : 'bg-[var(--surface-secondary)] text-[var(--foreground)]'
                : 'text-[var(--foreground)] hover:bg-[var(--surface-secondary)]',
            )}
          >
            <Icon className={cn('shrink-0', orientation === 'row' ? (compact ? 'size-3' : 'size-3.5') : 'size-5')} />
            <span className="whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
