'use client';

import { Trash2 } from 'lucide-react';
import { FormCreateSectionBadge } from '@/components/forms/form-create/form-create-primitives';
import { fieldInputClass } from '@/components/forms/shared/form-field-input-class';
import type { FormSectionDraft } from '@/lib/form-section-utils';
import { cn } from '@/lib/utils';

interface FormSectionHeaderCardProps {
  section: FormSectionDraft;
  index: number;
  total: number;
  fieldCount?: number;
  canRemove: boolean;
  isDropTarget?: boolean;
  onChange: (next: FormSectionDraft) => void;
  onRemove: () => void;
}

export function FormSectionHeaderCard({
  section,
  index,
  total,
  fieldCount = 0,
  canRemove,
  isDropTarget,
  onChange,
  onRemove,
}: FormSectionHeaderCardProps) {
  const showTab = total > 1;

  return (
    <div
      className={cn(
        'form-create-section-shell relative',
        isDropTarget && 'form-create-section-shell--drop-target',
      )}
    >
      {showTab ? (
        <FormCreateSectionBadge index={index} total={total} />
      ) : null}

      <div className="flex items-start gap-3 p-4 sm:p-5 sm:pt-6">
        {showTab ? (
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-xs font-bold tabular-nums text-[var(--muted-foreground)] sm:size-10 sm:text-sm">
            {index + 1}
          </span>
        ) : null}

        <div className="min-w-0 flex-1 space-y-2">
          <input
            value={section.title}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
            className={cn(
              fieldInputClass,
              'w-full border-0 border-b border-transparent bg-transparent px-0 py-0.5 text-lg font-semibold leading-tight shadow-none sm:text-xl',
              'placeholder:text-[var(--muted-foreground)]/40 focus:border-[var(--border)]',
            )}
            placeholder="عنوان القسم"
          />
          <textarea
            value={section.description}
            onChange={(e) =>
              onChange({ ...section, description: e.target.value })
            }
            rows={1}
            className={cn(
              fieldInputClass,
              'w-full resize-none border-0 bg-transparent px-0 py-0.5 text-sm leading-relaxed text-[var(--muted-foreground)] shadow-none',
              'placeholder:text-[var(--muted-foreground)]/45',
            )}
            placeholder="وصف اختياري للقسم"
          />
          {fieldCount > 0 ? (
            <p className="text-[11px] font-medium text-[var(--muted-foreground)]">
              {fieldCount} {fieldCount === 1 ? 'حقل' : 'حقول'}
            </p>
          ) : null}
        </div>

        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
            aria-label="حذف القسم"
          >
            <Trash2 className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
