'use client';

import type { FormType } from '@/lib/forms-api';
import { FORM_TYPE_LABELS } from '@/lib/forms-format';
import {
  TEMPLATE_CATEGORY_LABELS,
  type TemplateCategory,
  type TemplateTypeFilter,
} from '@/lib/form-templates';
import { pillTabClassName, pillTabGroupClassName } from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

const TYPE_FILTERS: { value: TemplateTypeFilter; label: string }[] = [
  { value: '', label: 'الكل' },
  ...(
    Object.entries(FORM_TYPE_LABELS) as [FormType, string][]
  ).map(([value, label]) => ({ value, label })),
];

const CATEGORY_FILTERS: { value: TemplateCategory | ''; label: string }[] = [
  { value: '', label: 'كل الفئات' },
  ...(
    Object.entries(TEMPLATE_CATEGORY_LABELS) as [TemplateCategory, string][]
  ).map(([value, label]) => ({ value, label })),
];

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
    <div className={cn('space-y-3', className)}>
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="ابحث في القوالب…"
        className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--foreground)]/30"
        aria-label="بحث في القوالب"
      />

      <div className="space-y-2">
        <p className="text-[11px] font-medium text-[var(--muted-foreground)]">
          نوع النموذج
        </p>
        <div
          className={`${pillTabGroupClassName} justify-start`}
          role="group"
          aria-label="تصفية حسب نوع النموذج"
        >
          {TYPE_FILTERS.map((opt) => (
            <button
              key={opt.value || 'all-types'}
              type="button"
              onClick={() => onFormTypeChange(opt.value)}
              aria-pressed={formType === opt.value}
              className={pillTabClassName(formType === opt.value, 'text-xs sm:text-sm')}
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
          className={`${pillTabGroupClassName} justify-start`}
          role="group"
          aria-label="تصفية حسب الفئة"
        >
          {CATEGORY_FILTERS.map((opt) => (
            <button
              key={opt.value || 'all-categories'}
              type="button"
              onClick={() => onCategoryChange(opt.value)}
              aria-pressed={category === opt.value}
              className={pillTabClassName(category === opt.value, 'text-xs sm:text-sm')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
