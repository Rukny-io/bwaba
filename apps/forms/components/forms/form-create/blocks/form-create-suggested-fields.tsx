'use client';

import {
  getFieldCatalogItem,
  getSuggestedFieldTypes,
} from '@/lib/form-field-catalog';
import type { FormType } from '@/lib/forms-api';
import type { WizardFieldType } from '@/lib/form-field-types';
import { cn } from '@/lib/utils';

const pillClassName = cn(
  'inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--border)]',
  'bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--foreground)]',
  'transition-colors hover:border-[var(--foreground)]/20 hover:bg-[var(--surface-secondary)]',
);

interface FormCreateSuggestedFieldsProps {
  formType: FormType;
  onInsert: (type: WizardFieldType) => void;
  onOpenCatalog: () => void;
  limit?: number;
  className?: string;
}

export function FormCreateSuggestedFields({
  formType,
  onInsert,
  onOpenCatalog,
  limit = 4,
  className,
}: FormCreateSuggestedFieldsProps) {
  const suggested = getSuggestedFieldTypes(formType).slice(0, limit);

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2',
        className,
      )}
    >
      {suggested.map((type) => {
        const item = getFieldCatalogItem(type);
        if (!item) return null;
        const Icon = item.icon;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onInsert(type)}
            className={pillClassName}
          >
            <Icon
              className="size-3.5 shrink-0 text-[var(--primary)]"
              strokeWidth={1.8}
            />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onOpenCatalog}
        className={cn(
          pillClassName,
          'border-dashed text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
          'col-span-2 sm:col-span-1 sm:w-auto',
        )}
      >
        المزيد…
      </button>
    </div>
  );
}
