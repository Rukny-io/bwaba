'use client';

import type { FormStatus } from '@/lib/forms-api';
import { getFormStatusLabel } from '@/lib/forms-format';
import { pillTabClassName, pillTabGroupClassName } from '@/components/ui/pill-tab';

export type FormsListViewMode = 'active' | 'trash';

const FILTER_OPTIONS: { value: '' | FormStatus; label: string }[] = [
  { value: '', label: 'الكل' },
  { value: 'DRAFT', label: getFormStatusLabel('DRAFT') },
  { value: 'PUBLISHED', label: getFormStatusLabel('PUBLISHED') },
  { value: 'CLOSED', label: getFormStatusLabel('CLOSED') },
  { value: 'ARCHIVED', label: getFormStatusLabel('ARCHIVED') },
];

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
      <div className={pillTabGroupClassName} role="group" aria-label="عرض النماذج">
        <button
          type="button"
          onClick={() => onViewModeChange('active')}
          aria-pressed={viewMode === 'active'}
          className={pillTabClassName(viewMode === 'active')}
        >
          النماذج النشطة
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('trash')}
          aria-pressed={viewMode === 'trash'}
          className={pillTabClassName(viewMode === 'trash')}
        >
          سلة المحذوفات
        </button>
      </div>

      {viewMode === 'active' ? (
        <div className={pillTabGroupClassName} role="group" aria-label="تصفية النماذج">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value || 'all'}
              type="button"
              onClick={() => onStatusChange(opt.value)}
              aria-pressed={status === opt.value}
              className={pillTabClassName(status === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
