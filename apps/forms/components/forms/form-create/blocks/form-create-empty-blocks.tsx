'use client';

import { Layers, LayoutTemplate, ListTree } from 'lucide-react';
import { FormCreateInsertLine } from '@/components/forms/form-create/blocks/form-create-insert-line';
import { FormCreateSuggestedFields } from '@/components/forms/form-create/blocks/form-create-suggested-fields';
import {
  FormCreatePill,
  FormCreateQuickActionCard,
} from '@/components/forms/form-create/form-create-primitives';
import type { FormType } from '@/lib/forms-api';
import { getFormTypeLabel } from '@/lib/forms-format';
import type { WizardFieldType } from '@/lib/form-field-types';

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
  const typeLabel = getFormTypeLabel(formType);

  return (
    <section className="form-create-blocks-empty space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <FormCreatePill icon={Layers} label="حقول النموذج" />
        <p className="text-xs leading-relaxed text-[var(--muted-foreground)] sm:max-w-[15rem] sm:text-end sm:text-[13px]">
          أضف حقولاً يدوياً أو ابدأ بقالب جاهز
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5">
        <FormCreateQuickActionCard
          variant="primary"
          icon={LayoutTemplate}
          label={`قالب ${typeLabel}`}
          hint="حقول مقترحة جاهزة للتعديل"
          onClick={onUseTemplate}
        />
        <FormCreateQuickActionCard
          icon={ListTree}
          label="جميع الحقول"
          hint="تصفح الكتالوج واختر ما يناسبك"
          onClick={onOpenCatalog}
        />
      </div>

      <div className="flex items-center gap-3 py-0.5">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span className="shrink-0 text-[11px] font-medium text-[var(--muted-foreground)]">
          إضافة سريعة
        </span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

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
        variant="empty"
      />
    </section>
  );
}
