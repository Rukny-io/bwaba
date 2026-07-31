'use client';

import { cn } from '@/lib/utils';
import type { FieldCatalogCategory, FieldCatalogCategoryId } from '@/lib/form-field-catalog';

interface FieldCategoryTabsProps {
  categories: FieldCatalogCategory[];
  active: FieldCatalogCategoryId;
  onSelect: (id: FieldCatalogCategoryId) => void;
  orientation: 'row' | 'column';
}

export function FieldCategoryTabs({
  categories,
  active,
  onSelect,
  orientation,
}: FieldCategoryTabsProps) {
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
              'flex shrink-0 items-center antialiased transition-all duration-200 active:scale-95',
              orientation === 'row'
                ? 'h-9 gap-1.5 rounded-full px-3.5 text-[13px] font-medium snap-start'
                : 'h-10 w-full justify-start gap-2.5 rounded-2xl px-3 text-[15px] font-medium text-right',
              isActive
                ? orientation === 'row'
                  ? 'bg-[var(--foreground)] text-[var(--background)] shadow-sm'
                  : 'bg-[var(--surface-secondary)] text-[var(--foreground)]'
                : 'text-[var(--foreground)] hover:bg-[var(--surface-secondary)]',
            )}
          >
            <Icon
              className={cn(
                'shrink-0',
                orientation === 'row' ? 'size-3.5' : 'size-5',
              )}
            />
            <span className="whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
