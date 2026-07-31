'use client';

import { ChevronRight, SearchX } from 'lucide-react';
import { LinkPlatformIconBadge } from '@/components/app/links/platform-icons/link-platform-icon-badge';
import type { LinkCatalogItem } from '@/lib/links/link-type-catalog';
import { cn } from '@/lib/utils';

interface LinkTypeListProps {
  items: LinkCatalogItem[];
  onPick: (item: LinkCatalogItem) => void;
  compact?: boolean;
}

export function LinkTypeList({ items, onPick, compact }: LinkTypeListProps) {
  if (items.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 text-center',
          compact ? 'px-2 py-14' : 'rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/30 px-4 py-12',
        )}
      >
        <SearchX className="size-7 text-[var(--muted-foreground)]/70" />
        <div>
          <p className="text-[14px] font-semibold text-[var(--foreground)]">لا توجد أنواع مطابقة</p>
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
        const disabled = item.comingSoon;
        return (
          <li key={item.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onPick(item)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-2xl text-start transition-colors duration-150',
                compact ? 'px-2.5 py-2.5' : 'px-2.5 py-2.5 sm:px-3 sm:py-3',
                disabled
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:bg-[var(--surface-secondary)]/50 active:bg-[var(--surface-secondary)] active:scale-[0.995]',
              )}
              dir="rtl"
            >
              <LinkPlatformIconBadge type={item.id} size={compact ? 'sm' : 'md'} />

              <div className="min-w-0 flex-1 text-right">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-[var(--foreground)] sm:text-[15px]">
                    {item.label}
                  </p>
                  {item.comingSoon ? (
                    <span className="shrink-0 rounded-full bg-[var(--surface-secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)]">
                      قريباً
                    </span>
                  ) : null}
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
