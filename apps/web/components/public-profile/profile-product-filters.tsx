'use client';

import { useTranslations } from 'next-intl';
import { cn } from './utils';

interface ProfileProductFiltersProps {
  categories: string[];
  value: string | null;
  onChange: (category: string | null) => void;
  compact?: boolean;
}

export function ProfileProductFilters({
  categories,
  value,
  onChange,
  compact = false,
}: ProfileProductFiltersProps) {
  const t = useTranslations('publicProfile.store');

  if (categories.length === 0) return null;

  const options = [{ id: null as string | null, label: t('allCategories') }, ...categories.map((c) => ({ id: c, label: c }))];

  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto px-1',
        '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
      )}
      role="tablist"
      aria-label={t('filterLabel')}
    >
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id ?? 'all'}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={cn(
              'shrink-0 rounded-full border font-semibold transition-[border-color,background-color,color] duration-200',
              compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-[12px] sm:text-[13px]',
              isActive
                ? 'border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]'
                : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--muted-foreground)]/35',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function getProductCategories(products: { category?: string | null }[]): string[] {
  const seen = new Set<string>();
  const categories: string[] = [];

  for (const product of products) {
    const category = product.category?.trim();
    if (!category) continue;
    const key = category.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    categories.push(category);
  }

  return categories.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}
