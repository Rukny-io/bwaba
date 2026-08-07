'use client';

import { Plus } from 'lucide-react';
import { FormCreateFieldChip } from '@/components/forms/form-create/form-create-primitives';
import {
  getFieldCatalogItem,
  getSuggestedFieldTypes,
} from '@/lib/form-field-catalog';
import type { FormType } from '@/lib/forms-api';
import type { WizardFieldType } from '@/lib/form-field-types';
import { cn } from '@/lib/utils';

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
        'grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5',
        className,
      )}
    >
      {suggested.map((type) => {
        const item = getFieldCatalogItem(type);
        if (!item) return null;
        return (
          <FormCreateFieldChip
            key={type}
            label={item.label}
            icon={item.icon}
            onClick={() => onInsert(type)}
          />
        );
      })}
      <button
        type="button"
        onClick={onOpenCatalog}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl p-3 text-[13px] font-medium transition-colors duration-200',
          'bg-[var(--surface-secondary)]/60 text-[var(--muted-foreground)]',
          'hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]',
        )}
      >
        <Plus className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        <span>المزيد</span>
      </button>
    </div>
  );
}
