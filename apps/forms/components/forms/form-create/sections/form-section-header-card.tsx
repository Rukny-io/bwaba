'use client';

import { GripVertical, Trash2 } from 'lucide-react';
import { fieldInputClass } from '@/components/forms/shared/form-field-input-class';
import type { FormSectionDraft } from '@/lib/form-section-utils';
import { cn } from '@/lib/utils';

interface FormSectionHeaderCardProps {
  section: FormSectionDraft;
  index: number;
  total: number;
  canRemove: boolean;
  isDropTarget?: boolean;
  onChange: (next: FormSectionDraft) => void;
  onRemove: () => void;
  onDragHandlePointerDown?: (e: React.PointerEvent<HTMLButtonElement>) => void;
}

export function FormSectionHeaderCard({
  section,
  index,
  total,
  canRemove,
  isDropTarget,
  onChange,
  onRemove,
  onDragHandlePointerDown,
}: FormSectionHeaderCardProps) {
  const showTab = total > 1;

  return (
    <div className="form-section-card relative rounded-2xl shadow-sm transition-[border-color,box-shadow]">
      {showTab ? (
        <div className="absolute -top-3 start-4 z-[1] rounded-md bg-amber-400 px-2.5 py-0.5 text-[11px] font-bold text-amber-950 shadow-sm">
          القسم {index + 1} من {total}
        </div>
      ) : null}

      <div className="px-4 py-4 pt-5 sm:px-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1">
            {total > 1 && onDragHandlePointerDown ? (
              <button
                type="button"
                className="form-section-drag-handle -ms-1 shrink-0 rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                aria-label="سحب القسم"
                onPointerDown={onDragHandlePointerDown}
              >
                <GripVertical className="size-4" />
              </button>
            ) : null}
            <p className="text-xs font-medium text-[var(--muted-foreground)]">
              {total > 1 ? 'عنوان القسم' : 'قسم النموذج'}
            </p>
          </div>
          {canRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--surface-secondary)] hover:text-[var(--danger)]"
              aria-label="حذف القسم"
            >
              <Trash2 className="size-4" />
            </button>
          ) : null}
        </div>

        <input
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          className={cn(
            fieldInputClass,
            'mb-2 w-full border-0 border-b border-transparent bg-transparent px-0 py-1 text-lg font-semibold shadow-none focus:border-[var(--border)]',
          )}
          placeholder="عنوان القسم"
        />
        <textarea
          value={section.description}
          onChange={(e) =>
            onChange({ ...section, description: e.target.value })
          }
          rows={2}
          className={cn(
            fieldInputClass,
            'w-full resize-none border-0 bg-transparent px-0 py-1 text-sm text-[var(--muted-foreground)] shadow-none',
          )}
          placeholder="وصف اختياري للقسم"
        />
      </div>
    </div>
  );
}
