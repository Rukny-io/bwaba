'use client';

import { Search } from 'lucide-react';
import type { FormType } from '@/lib/forms-api';
import { FORM_TYPE_LABELS } from '@/lib/forms-format';
import {
  TEMPLATE_CATEGORY_LABELS,
  type TemplateCategory,
  type TemplateTypeFilter,
} from '@/lib/form-templates';
import { DashboardSurface } from '@/components/app/dashboard-surface';
import { cn } from '@/lib/utils';

const TYPE_FILTERS: { value: TemplateTypeFilter; label: string }[] = [
  { value: '', label: 'الكل' },
  ...(Object.entries(FORM_TYPE_LABELS) as [FormType, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
];

const CATEGORY_FILTERS: { value: TemplateCategory | ''; label: string }[] = [
  { value: '', label: 'كل الفئات' },
  ...(
    Object.entries(TEMPLATE_CATEGORY_LABELS) as [TemplateCategory, string][]
  ).map(([value, label]) => ({ value, label })),
];

function filterChipClass(active: boolean) {
  return cn(
    'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors',
    active
      ? 'border-transparent bg-[var(--foreground)] text-[var(--background)]'
      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-secondary)]',
  );
}

interface TemplatesToolbarProps {
  query: string;
  formType: TemplateTypeFilter;
  category: TemplateCategory | '';
  onQueryChange: (value: string) => void;
  onFormTypeChange: (value: TemplateTypeFilter) => void;
  onCategoryChange: (value: TemplateCategory | '') => void;
  className?: string;
}

export function TemplatesToolbar({
  query,
  formType,
  category,
  onQueryChange,
  onFormTypeChange,
  onCategoryChange,
  className,
}: TemplatesToolbarProps) {
  return (
    <DashboardSurface padding="md" className={cn('space-y-4', className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]"
          strokeWidth={1.8}
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="ابحث في القوالب…"
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] py-2.5 pe-4 ps-10 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)]/35 focus:bg-[var(--surface)]"
          aria-label="بحث في القوالب"
        />
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium text-[var(--muted-foreground)]">
          نوع النموذج
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="تصفية حسب نوع النموذج"
        >
          {TYPE_FILTERS.map((opt) => (
            <button
              key={opt.value || 'all-types'}
              type="button"
              onClick={() => onFormTypeChange(opt.value)}
              aria-pressed={formType === opt.value}
              className={filterChipClass(formType === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-medium text-[var(--muted-foreground)]">
          الفئة
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="تصفية حسب الفئة"
        >
          {CATEGORY_FILTERS.map((opt) => (
            <button
              key={opt.value || 'all-categories'}
              type="button"
              onClick={() => onCategoryChange(opt.value)}
              aria-pressed={category === opt.value}
              className={filterChipClass(category === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </DashboardSurface>
  );
}
