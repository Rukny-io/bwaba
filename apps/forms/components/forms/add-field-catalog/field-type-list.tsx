'use client';

import { ChevronRight, SearchX } from 'lucide-react';
import { FieldTypeHelpTrigger } from '@/components/forms/add-field-catalog/field-type-help-trigger';
import type { FieldCatalogItem } from '@/lib/form-field-catalog';
import { cn } from '@/lib/utils';

interface FieldTypeListProps {
  items: FieldCatalogItem[];
  onPick: (item: FieldCatalogItem) => void;
}

export function FieldTypeList({ items, onPick }: FieldTypeListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/30 px-4 py-12 text-center">
        <SearchX className="size-7 text-[var(--muted-foreground)]/70" />
        <div>
          <p className="text-[14px] font-semibold text-[var(--foreground)]">
            لا توجد أنواع مطابقة
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
            جرّب كلمة بحث أخرى أو اختر تصنيفاً مختلفاً.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.type}>
            <button
              type="button"
              onClick={() => onPick(item)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-start transition-colors duration-150',
                'hover:bg-[var(--surface-secondary)]/50 active:bg-[var(--surface-secondary)] active:scale-[0.995] sm:px-3 sm:py-3',
              )}
              dir="rtl"
            >
              <div
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-2xl',
                  'bg-[var(--surface-secondary)]/60 p-2 transition-transform duration-200 group-active:scale-95',
                )}
              >
                <Icon className="size-5 text-[var(--foreground)]" aria-hidden />
              </div>

              <div className="min-w-0 flex-1 text-right">
                <div className="flex items-center gap-1">
                  <p className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-[var(--foreground)] sm:text-[15px]">
                    {item.label}
                  </p>
                  <FieldTypeHelpTrigger item={item} />
                </div>
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
        );
      })}
    </ul>
  );
}
