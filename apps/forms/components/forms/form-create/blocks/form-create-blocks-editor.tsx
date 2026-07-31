'use client';

import { useEffect, useState } from 'react';
import { AlertDialog, Button, Switch } from '@heroui/react';
import { AddFieldCatalogDialog } from '@/components/forms/add-field-catalog/add-field-catalog-dialog';
import { AddFieldMobileDialog } from '@/components/forms/add-field-catalog/add-field-mobile-dialog';
import { FormAddSectionButton } from '@/components/forms/form-create/blocks/form-add-section-button';
import { FormCreateEmptyBlocks } from '@/components/forms/form-create/blocks/form-create-empty-blocks';
import { FormCreateInsertLine } from '@/components/forms/form-create/blocks/form-create-insert-line';
import { FormCreateSuggestedFields } from '@/components/forms/form-create/blocks/form-create-suggested-fields';
import { FormCreateTypeFieldsButton } from '@/components/forms/form-create/blocks/form-create-type-fields-button';
import { FormSectionCanvas } from '@/components/forms/form-create/sections/form-section-canvas';
import { getFormTemplateFields } from '@/lib/form-templates';
import {
  createDraftField,
  normalizeFieldOrders,
  type DraftFormField,
} from '@/lib/form-field-utils';
import {
  fieldsGroupedBySection,
  flattenFieldsBySections,
  newSectionKey,
  type FormSectionDraft,
} from '@/lib/form-section-utils';
import { getFieldResponseCounts, type FormType } from '@/lib/forms-api';
import { getFormTypeLabel } from '@/lib/forms-format';
import {
  fieldTypeNeedsOptions,
  isLayoutWizardField,
  type WizardFieldType,
} from '@/lib/form-field-types';
import { cn } from '@/lib/utils';

type CatalogTarget =
  | { mode: 'add'; sectionKey?: string }
  | { mode: 'change'; index: number };

interface FormCreateBlocksEditorProps {
  formId: string;
  submissionCount: number;
  formType: FormType;
  fields: DraftFormField[];
  sections: FormSectionDraft[];
  assignment: Record<string, string>;
  showProgressBar?: boolean;
  onChange: (fields: DraftFormField[]) => void;
  onSectionsChange: (sections: FormSectionDraft[]) => void;
  onAssignmentChange: (assignment: Record<string, string>) => void;
  onRemoveField: (clientId: string) => void;
  onMoveField: (fieldId: string, sectionKey: string, targetIndex: number) => void;
  onShowProgressBarChange?: (value: boolean) => void;
}

export function FormCreateBlocksEditor({
  formId,
  submissionCount,
  formType,
  fields,
  sections,
  assignment,
  showProgressBar = true,
  onChange,
  onSectionsChange,
  onAssignmentChange,
  onRemoveField,
  onMoveField,
  onShowProgressBarChange,
}: FormCreateBlocksEditorProps) {
  const [templateOpen, setTemplateOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);
  const [catalogTarget, setCatalogTarget] = useState<CatalogTarget>({
    mode: 'add',
  });
  const [pendingRemoveClientId, setPendingRemoveClientId] = useState<string | null>(
    null,
  );
  const [fieldResponseCounts, setFieldResponseCounts] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    if (submissionCount <= 0) {
      setFieldResponseCounts({});
      return;
    }

    let cancelled = false;
    void getFieldResponseCounts(formId)
      .then((result) => {
        if (!cancelled) setFieldResponseCounts(result.counts);
      })
      .catch(() => {
        if (!cancelled) setFieldResponseCounts({});
      });

    return () => {
      cancelled = true;
    };
  }, [formId, submissionCount]);

  function updateField(index: number, next: DraftFormField) {
    const copy = [...fields];
    copy[index] = next;
    onChange(normalizeFieldOrders(copy));
  }

  function requestRemoveField(clientId: string) {
    const field = fields.find((f) => f.clientId === clientId);
    if (!field) return;

    const responseCount = fieldResponseCounts[field.clientId] ?? 0;
    if (submissionCount > 0 && responseCount > 0) {
      setPendingRemoveClientId(clientId);
      return;
    }

    onRemoveField(clientId);
  }

  function confirmRemoveField() {
    if (pendingRemoveClientId === null) return;
    onRemoveField(pendingRemoveClientId);
    setPendingRemoveClientId(null);
  }

  const pendingRemoveField =
    pendingRemoveClientId === null
      ? null
      : fields.find((f) => f.clientId === pendingRemoveClientId);
  const pendingRemoveCount = pendingRemoveField
    ? (fieldResponseCounts[pendingRemoveField.clientId] ?? 0)
    : 0;

  function addField(type: WizardFieldType, sectionKey?: string) {
    const targetSection =
      sectionKey ?? sections[sections.length - 1]?.clientKey ?? sections[0]?.clientKey;
    const nextField = createDraftField(type, fields.length);
    const nextAssignment = { ...assignment, [nextField.clientId]: targetSection };
    const grouped = fieldsGroupedBySection(
      [...fields, nextField],
      sections,
      nextAssignment,
    );
    onAssignmentChange(nextAssignment);
    onChange(normalizeFieldOrders(flattenFieldsBySections(sections, grouped)));
  }

  function addFieldToLastSection(type: WizardFieldType) {
    const lastKey = sections[sections.length - 1]?.clientKey;
    addField(type, lastKey);
  }

  function addSection() {
    const n = sections.length + 1;
    const key = newSectionKey();
    onSectionsChange([
      ...sections,
      { clientKey: key, title: `القسم ${n}`, description: '' },
    ]);
  }

  function applyFieldType(type: WizardFieldType) {
    if (catalogTarget.mode === 'change') {
      const current = fields[catalogTarget.index];
      if (!current) return;
      updateField(catalogTarget.index, {
        ...current,
        type,
        required: isLayoutWizardField(type) ? false : current.required,
        options: fieldTypeNeedsOptions(type)
          ? current.options.length
            ? current.options
            : ['خيار 1', 'خيار 2']
          : [],
      });
      return;
    }
    if (catalogTarget.sectionKey) {
      addField(type, catalogTarget.sectionKey);
      return;
    }
    addFieldToLastSection(type);
  }

  function openAddCatalog() {
    setCatalogTarget({ mode: 'add' });
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
      setCatalogOpen(true);
    } else {
      setMobilePickerOpen(true);
    }
  }

  function openChangeType(index: number) {
    setCatalogTarget({ mode: 'change', index });
    if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
      setCatalogOpen(true);
    } else {
      setMobilePickerOpen(true);
    }
  }

  function applyTemplate() {
    onChange(getFormTemplateFields(formType));
    setTemplateOpen(false);
  }

  function requestUseTemplate() {
    if (fields.length === 0) {
      applyTemplate();
      return;
    }
    setTemplateOpen(true);
  }

  const isMultiSection = sections.length > 1;

  return (
    <div className="space-y-4">
      {fields.length === 0 ? (
        <FormCreateEmptyBlocks
          formType={formType}
          onInsert={addFieldToLastSection}
          onOpenCatalog={openAddCatalog}
          onUseTemplate={requestUseTemplate}
        />
      ) : (
        <>
          {isMultiSection && onShowProgressBarChange ? (
            <div className="mb-3 flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)]/50 bg-[var(--surface-secondary)]/20 px-4 py-3">
              <div>
                <p className="text-sm font-medium">شريط التقدم</p>
                <p className="mt-0.5 text-[12px] text-[var(--muted-foreground)]">
                  يظهر للمستجيب أثناء التنقل بين الأقسام.
                </p>
              </div>
              <Switch
                isSelected={showProgressBar}
                onChange={onShowProgressBarChange}
                aria-label="شريط التقدم"
              >
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch>
            </div>
          ) : null}

          <FormSectionCanvas
            sections={sections}
            fields={fields}
            assignment={assignment}
            onSectionsChange={onSectionsChange}
            onFieldsChange={onChange}
            onAssignmentChange={onAssignmentChange}
            onFieldChange={updateField}
            onRemoveField={requestRemoveField}
            onMoveField={onMoveField}
            onChangeFieldType={openChangeType}
            enableCrossSectionDrag={isMultiSection}
          />

          <div
            className={cn(
              'space-y-3 rounded-2xl border border-[var(--border)]/50 bg-[var(--surface-secondary)]/20 p-3',
              'sm:space-y-2 sm:rounded-none sm:border-0 sm:border-t sm:border-[var(--border)]/50 sm:bg-transparent sm:p-0 sm:pt-3',
            )}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <FormCreateTypeFieldsButton
                formType={formType}
                onInsert={addFieldToLastSection}
                onOpenCatalog={openAddCatalog}
                onUseTemplate={requestUseTemplate}
                className="w-full justify-between sm:w-auto sm:justify-center"
              />
              <FormAddSectionButton onAdd={addSection} />
            </div>
            <FormCreateSuggestedFields
              formType={formType}
              onInsert={addFieldToLastSection}
              onOpenCatalog={openAddCatalog}
            />
            <FormCreateInsertLine
              formType={formType}
              onInsert={addFieldToLastSection}
              onOpenCatalog={openAddCatalog}
              onUseTemplate={requestUseTemplate}
              className="rounded-xl border border-[var(--border)]/40 bg-[var(--surface)] px-2 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0"
            />
          </div>
        </>
      )}

      <AddFieldCatalogDialog
        open={catalogOpen}
        onClose={() => {
          setCatalogOpen(false);
          setCatalogTarget({ mode: 'add' });
        }}
        formType={formType}
        title={
          catalogTarget.mode === 'change' ? 'تغيير نوع الحقل' : 'إضافة حقل'
        }
        onPick={applyFieldType}
      />

      <AddFieldMobileDialog
        open={mobilePickerOpen}
        onOpenChange={(open) => {
          setMobilePickerOpen(open);
          if (!open) setCatalogTarget({ mode: 'add' });
        }}
        formType={formType}
        title={
          catalogTarget.mode === 'change' ? 'تغيير نوع الحقل' : 'إضافة حقل'
        }
        onPick={applyFieldType}
      />

      <AlertDialog.Backdrop
        isDismissable
        isOpen={pendingRemoveField != null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveClientId(null);
        }}
        variant="blur"
      >
        <AlertDialog.Container placement="center" size="md">
          <AlertDialog.Dialog className="max-w-md rounded-3xl p-6">
            <AlertDialog.Header>
              <AlertDialog.Heading>حذف هذا الحقل؟</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-sm text-[var(--muted-foreground)]">
                الحقل «{pendingRemoveField?.label}» يحتوي على{' '}
                <span className="font-semibold text-[var(--foreground)]">
                  {pendingRemoveCount}
                </span>{' '}
                {pendingRemoveCount === 1 ? 'إجابة' : 'إجابات'}.
              </p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                لن تُحذف الاستجابات، لكن إجابات هذا الحقل لن تظهر في التقارير
                بعد الحذف. يمكنك تصدير CSV قبل المتابعة.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer className="gap-2">
              <Button
                variant="outline"
                onPress={() => setPendingRemoveClientId(null)}
                className="rounded-full"
              >
                إلغاء
              </Button>
              <Button
                variant="danger"
                onPress={confirmRemoveField}
                className="rounded-full"
              >
                حذف الحقل
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>

      <AlertDialog.Backdrop
        isDismissable
        isOpen={templateOpen}
        onOpenChange={setTemplateOpen}
        variant="blur"
      >
        <AlertDialog.Container placement="center" size="md">
          <AlertDialog.Dialog className="max-w-md rounded-3xl p-6">
            <AlertDialog.Header>
              <AlertDialog.Heading>استخدام القالب؟</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-sm text-[var(--muted-foreground)]">
                سيستبدل هذا القالب الحقول الحالية بحقول مقترحة لنوع «
                {getFormTypeLabel(formType)}». يمكنك تعديلها بعد ذلك.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer className="gap-2">
              <Button
                variant="outline"
                onPress={() => setTemplateOpen(false)}
                className="rounded-full"
              >
                إلغاء
              </Button>
              <Button
                variant="primary"
                onPress={applyTemplate}
                className="rounded-full"
              >
                استبدال بالقالب
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </div>
  );
}
