'use client';

import type { FormStatus } from '@/lib/forms-api';
import { getFormStatusLabel } from '@/lib/forms-format';
import { cn } from '@/lib/utils';

export type FormsListViewMode = 'active' | 'trash';

const FILTER_OPTIONS: { value: '' | FormStatus; label: string }[] = [
  { value: '', label: 'الكل' },
  { value: 'DRAFT', label: getFormStatusLabel('DRAFT') },
  { value: 'PUBLISHED', label: getFormStatusLabel('PUBLISHED') },
  { value: 'CLOSED', label: getFormStatusLabel('CLOSED') },
  { value: 'ARCHIVED', label: getFormStatusLabel('ARCHIVED') },
];

function tabClass(active: boolean) {
  return cn(
    'rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-colors sm:px-3.5 sm:text-[13px]',
    active
      ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
      : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
  );
}

export function FormsListToolbar({
  viewMode,
  onViewModeChange,
  status,
  onStatusChange,
}: {
  viewMode: FormsListViewMode;
  onViewModeChange: (mode: FormsListViewMode) => void;
  status: '' | FormStatus;
  onStatusChange: (status: '' | FormStatus) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div
        className="flex flex-wrap gap-1 rounded-2xl bg-[var(--surface-secondary)] p-1"
        role="group"
        aria-label="عرض النماذج"
      >
        <button
          type="button"
          onClick={() => onViewModeChange('active')}
          aria-pressed={viewMode === 'active'}
          className={tabClass(viewMode === 'active')}
        >
          النماذج النشطة
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('trash')}
          aria-pressed={viewMode === 'trash'}
          className={tabClass(viewMode === 'trash')}
        >
          سلة المحذوفات
        </button>
      </div>

      {viewMode === 'active' ? (
        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="تصفية النماذج"
        >
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value || 'all'}
              type="button"
              onClick={() => onStatusChange(opt.value)}
              aria-pressed={status === opt.value}
              className={cn(
                'rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition-colors sm:text-[12px]',
                status === opt.value
                  ? 'bg-[var(--surface-tertiary)] text-[var(--primary)]'
                  : 'text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
