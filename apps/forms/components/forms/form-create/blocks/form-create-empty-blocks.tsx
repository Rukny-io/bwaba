'use client';

import { FormCreateInsertLine } from '@/components/forms/form-create/blocks/form-create-insert-line';
import { FormCreateTypeFieldsButton } from '@/components/forms/form-create/blocks/form-create-type-fields-button';
import {
  getFieldCatalogItem,
  getSuggestedFieldTypes,
} from '@/lib/form-field-catalog';
import type { FormType } from '@/lib/forms-api';
import type { WizardFieldType } from '@/lib/form-field-types';
import { cn } from '@/lib/utils';

interface FormCreateEmptyBlocksProps {
  formType: FormType;
  onInsert: (type: WizardFieldType) => void;
  onOpenCatalog: () => void;
  onUseTemplate: () => void;
}

export function FormCreateEmptyBlocks({
  formType,
  onInsert,
  onOpenCatalog,
  onUseTemplate,
}: FormCreateEmptyBlocksProps) {
  const suggested = getSuggestedFieldTypes(formType).slice(0, 4);

  return (
    <div className="space-y-4 pt-2">
      <FormCreateTypeFieldsButton
        formType={formType}
        onInsert={onInsert}
        onOpenCatalog={onOpenCatalog}
        onUseTemplate={onUseTemplate}
      />

      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {suggested.map((type) => {
          const item = getFieldCatalogItem(type);
          if (!item) return null;
          const Icon = item.icon;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onInsert(type)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border)]',
                'bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]',
                'transition-colors hover:border-[var(--foreground)]/20 hover:bg-[var(--surface-secondary)]',
              )}
            >
              <Icon className="size-3.5 shrink-0 text-[var(--primary)]" strokeWidth={1.8} />
              {item.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={onOpenCatalog}
          className={cn(
            'inline-flex shrink-0 items-center rounded-full border border-dashed border-[var(--border)]',
            'px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)]',
            'transition-colors hover:border-[var(--foreground)]/20 hover:text-[var(--foreground)]',
          )}
        >
          المزيد…
        </button>
      </div>

      <FormCreateInsertLine
        formType={formType}
        onInsert={onInsert}
        onOpenCatalog={onOpenCatalog}
        onUseTemplate={onUseTemplate}
        autoFocus
      />
    </div>
  );
}
