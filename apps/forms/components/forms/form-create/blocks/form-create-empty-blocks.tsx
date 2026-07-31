'use client';

import { FormCreateInsertLine } from '@/components/forms/form-create/blocks/form-create-insert-line';
import { FormCreateSuggestedFields } from '@/components/forms/form-create/blocks/form-create-suggested-fields';
import { FormCreateTypeFieldsButton } from '@/components/forms/form-create/blocks/form-create-type-fields-button';
import type { FormType } from '@/lib/forms-api';
import type { WizardFieldType } from '@/lib/form-field-types';
import { cn } from '@/lib/utils';

interface FormCreateEmptyBlocksProps {
  formType: FormType;
  onInsert: (type: WizardFieldType) => void;
  onOpenCatalog: () => void;
  onUseTemplate: () => void;
}

const mobileActionsPanelClassName = cn(
  'space-y-3 rounded-2xl border border-[var(--border)]/50 bg-[var(--surface-secondary)]/20 p-3',
  'sm:space-y-4 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0',
);

export function FormCreateEmptyBlocks({
  formType,
  onInsert,
  onOpenCatalog,
  onUseTemplate,
}: FormCreateEmptyBlocksProps) {
  return (
    <div className={cn(mobileActionsPanelClassName, 'pt-2')}>
      <FormCreateTypeFieldsButton
        formType={formType}
        onInsert={onInsert}
        onOpenCatalog={onOpenCatalog}
        onUseTemplate={onUseTemplate}
        className="w-full justify-between sm:w-auto sm:justify-center"
      />

      <FormCreateSuggestedFields
        formType={formType}
        onInsert={onInsert}
        onOpenCatalog={onOpenCatalog}
      />

      <FormCreateInsertLine
        formType={formType}
        onInsert={onInsert}
        onOpenCatalog={onOpenCatalog}
        onUseTemplate={onUseTemplate}
        autoFocus
        className="rounded-xl border border-[var(--border)]/40 bg-[var(--surface)] px-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0"
      />
    </div>
  );
}
