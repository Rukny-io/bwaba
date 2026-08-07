'use client';

import { ChevronDown, GripVertical, Trash2 } from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Switch,
  TextField,
} from '@heroui/react';
import {
  fieldTypeNeedsOptions,
  isAutoCapturedWizardField,
  isLayoutWizardField,
  WIZARD_FIELD_TYPE_LABELS,
} from '@/lib/form-field-types';
import { FieldRespondentCountrySettings } from '@/components/forms/field-settings/field-respondent-country-settings';
import { FieldImageSettings } from '@/components/forms/field-settings/field-image-settings';
import { FieldLegalConsentSettings } from '@/components/forms/field-settings/field-legal-consent-settings';
import { FieldIraqGovernorateSettings } from '@/components/forms/field-settings/field-iraq-governorate-settings';
import { getFieldCatalogItem } from '@/lib/form-field-catalog';
import { ConditionalLogicEditor } from '@/components/forms/form-create/fields/conditional-logic-editor';
import { FieldVerificationSwitch } from '@/components/forms/form-create/fields/field-verification-switch';
import { FieldLinearScaleSettings } from '@/components/forms/field-settings/field-linear-scale-settings';
import { FieldMultiselectSettings } from '@/components/forms/field-settings/field-multiselect-settings';
import { FieldMatrixSettings } from '@/components/forms/field-settings/field-matrix-settings';
import { FieldNumberSettings } from '@/components/forms/field-settings/field-number-settings';
import { FieldOptionsEditor } from '@/components/forms/field-settings/field-options-editor';
import {
  fieldRequiresEmailVerification,
  fieldRequiresPhoneWhatsappVerification,
  setFieldEmailVerification,
  setFieldPhoneWhatsappVerification,
  type DraftFormField,
} from '@/lib/form-field-utils';
import type { ConditionalLogic } from '@/lib/conditional-logic-types';
import { cn } from '@/lib/utils';

interface FormFieldEditorRowProps {
  field: DraftFormField;
  index: number;
  allFields: DraftFormField[];
  onChange: (field: DraftFormField) => void;
  onRemove: () => void;
  onChangeType?: () => void;
  isDragging?: boolean;
  variant?: 'default' | 'canvas';
  onDragHandlePointerDown?: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onGripPointerDown?: (e: React.PointerEvent<HTMLElement>) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function FormFieldEditorRow({
  field,
  index,
  allFields,
  onChange,
  onRemove,
  onChangeType,
  isDragging = false,
  variant = 'default',
  onDragHandlePointerDown,
  onGripPointerDown,
  collapsed = false,
  onCollapsedChange,
}: FormFieldEditorRowProps) {
  const usePointerDrag = Boolean(onGripPointerDown);
  const isCanvas = variant === 'canvas';
  const isCollapsed = isCanvas && collapsed;
  const layout = isLayoutWizardField(field.type);
  const autoCaptured = isAutoCapturedWizardField(field.type);
  const needsOptions =
    fieldTypeNeedsOptions(field.type) && field.type !== 'MULTISELECT';
  const isMatrix = field.type === 'MATRIX';
  const catalogItem = getFieldCatalogItem(field.type);
  const TypeIcon = catalogItem?.icon;

  const gripClassName = cn(
    'flex size-8 shrink-0 touch-none select-none items-center justify-center rounded-lg',
    'text-[var(--muted-foreground)] transition-colors',
    'cursor-grab active:cursor-grabbing',
    'hover:bg-black/[0.05] hover:text-[var(--foreground)] dark:hover:bg-white/10',
    isDragging && 'cursor-grabbing bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] text-[var(--foreground)]',
  );

  const gripLabel = usePointerDrag
    ? `سحب الحقل ${index + 1} لإعادة الترتيب أو نقله إلى قسم آخر`
    : `سحب الحقل ${index + 1} لإعادة الترتيب`;

  const fieldLabel = field.label.trim() || 'حقل جديد';
  const typeLabel = WIZARD_FIELD_TYPE_LABELS[field.type];

  const editorBody = (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          className={cn('w-full', needsOptions && 'sm:col-span-2')}
          value={field.label}
          onChange={(value) => onChange({ ...field, label: value })}
          aria-label={layout ? 'النص المعروض' : 'التسمية'}
          maxLength={500}
          fullWidth
        >
          <Label>{layout ? 'النص المعروض' : 'التسمية'}</Label>
          <Input />
        </TextField>

        {!layout && !autoCaptured && !isMatrix ? (
          <>
            <TextField
              className="w-full"
              value={field.placeholder ?? ''}
              onChange={(value) => onChange({ ...field, placeholder: value })}
              aria-label="نص توضيحي داخل الحقل"
              maxLength={200}
              fullWidth
            >
              <Label>نص توضيحي (اختياري)</Label>
              <Input />
            </TextField>

            <div className="flex flex-wrap items-end gap-4 pb-1">
              <Switch
                isSelected={field.required}
                onChange={(checked) =>
                  onChange({ ...field, required: checked })
                }
              >
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Switch.Content>
                  <Label className="text-sm font-medium">مطلوب</Label>
                </Switch.Content>
              </Switch>
              {field.type === 'EMAIL' ? (
                <FieldVerificationSwitch
                  feature="emailFieldVerification"
                  label="التحقق من البريد (OTP)"
                  isSelected={fieldRequiresEmailVerification(field.validationRules)}
                  onChange={(checked) =>
                    onChange({
                      ...field,
                      validationRules: setFieldEmailVerification(
                        field.validationRules,
                        checked,
                      ),
                    })
                  }
                />
              ) : null}
              {field.type === 'PHONE' ? (
                <FieldVerificationSwitch
                  feature="phoneWhatsappVerification"
                  label="التحقق عبر WhatsApp"
                  isSelected={fieldRequiresPhoneWhatsappVerification(
                    field.validationRules,
                  )}
                  onChange={(checked) =>
                    onChange({
                      ...field,
                      validationRules: setFieldPhoneWhatsappVerification(
                        field.validationRules,
                        checked,
                      ),
                    })
                  }
                />
              ) : null}
            </div>
          </>
        ) : null}

        {isMatrix ? (
          <div className="flex flex-wrap items-end gap-4 pb-1 sm:col-span-2">
            <Switch
              isSelected={field.required}
              onChange={(checked) => onChange({ ...field, required: checked })}
            >
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Switch.Content>
                <Label className="text-sm font-medium">مطلوب</Label>
              </Switch.Content>
            </Switch>
          </div>
        ) : null}
      </div>

      {field.type === 'EMAIL' &&
      fieldRequiresEmailVerification(field.validationRules) ? (
        <p className="mt-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
          يجب على المستجيب تأكيد البريد برمز OTP قبل إرسال النموذج.
        </p>
      ) : null}

      {field.type === 'PHONE' &&
      fieldRequiresPhoneWhatsappVerification(field.validationRules) ? (
        <p className="mt-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
          يجب على المستجيب تأكيد رقم الهاتف برمز يُرسل عبر WhatsApp قبل إرسال
          النموذج.
        </p>
      ) : null}

      {field.type === 'RESPONDENT_COUNTRY' ? (
        <FieldRespondentCountrySettings />
      ) : null}

      {field.type === 'IMAGE' ? (
        <FieldImageSettings field={field} onChange={onChange} />
      ) : null}

      {field.type === 'LEGAL_CONSENT' ? (
        <FieldLegalConsentSettings field={field} onChange={onChange} />
      ) : null}

      {field.type === 'IRAQ_GOVERNORATE' ? (
        <FieldIraqGovernorateSettings />
      ) : null}

      {field.type === 'MULTISELECT' ? (
        <FieldMultiselectSettings field={field} onChange={onChange} />
      ) : null}

      {field.type === 'SCALE' ? (
        <FieldLinearScaleSettings field={field} onChange={onChange} />
      ) : null}

      {field.type === 'NPS' ? (
        <p className="mt-6 text-xs leading-relaxed text-[var(--muted-foreground)]">
          مقياس NPS ثابت من 0 إلى 10 مع تسميات «غير محتمل» و«محتمل جداً».
        </p>
      ) : null}

      {field.type === 'NUMBER' ? (
        <FieldNumberSettings field={field} onChange={onChange} />
      ) : null}

      {field.type === 'MATRIX' ? (
        <FieldMatrixSettings field={field} onChange={onChange} />
      ) : null}

      {needsOptions ? (
        <div className="mt-6 space-y-3">
          <Label className="text-sm font-medium">الخيارات</Label>
          <FieldOptionsEditor field={field} onChange={onChange} />
        </div>
      ) : null}

      {!layout && !autoCaptured ? (
        <ConditionalLogicEditor
          field={field}
          allFields={allFields}
          onChange={(conditionalLogic: ConditionalLogic | undefined) =>
            onChange({ ...field, conditionalLogic })
          }
        />
      ) : null}
    </>
  );

  return (
    <div
      className={cn(
        'transition-[padding]',
        isDragging && 'opacity-95',
        isCollapsed ? 'px-3 py-2.5 sm:px-3.5 sm:py-3' : 'p-4 sm:p-5',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2 sm:gap-2.5',
          !isCollapsed && 'border-b border-[var(--border)]/60 pb-4',
        )}
      >
        {usePointerDrag ? (
          <div
            role="button"
            tabIndex={0}
            className={gripClassName}
            aria-label={gripLabel}
            onPointerDown={(e) => {
              e.stopPropagation();
              onGripPointerDown?.(e);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
            }}
          >
            <GripVertical className="size-4" aria-hidden />
          </div>
        ) : (
          <button
            type="button"
            className={gripClassName}
            aria-label={gripLabel}
            onPointerDown={onDragHandlePointerDown}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        )}

        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--surface-secondary)] text-[10px] font-bold tabular-nums text-[var(--muted-foreground)] sm:size-7 sm:text-[11px]">
          {index + 1}
        </span>

        {isCollapsed ? (
          <button
            type="button"
            onClick={() => onCollapsedChange?.(false)}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-1 py-0.5 text-start transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.05] sm:gap-3"
          >
            {TypeIcon ? (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--brand-soft-lime)_75%,var(--surface))] text-[var(--brand-carbon)] dark:text-[var(--foreground)] sm:size-9">
                <TypeIcon className="size-4" strokeWidth={1.9} aria-hidden />
              </span>
            ) : null}
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold leading-tight text-[var(--foreground)]">
                {fieldLabel}
              </span>
              <span className="truncate text-[11px] text-[var(--muted-foreground)]">
                {typeLabel}
              </span>
            </span>
            {field.required ? (
              <span className="hidden shrink-0 rounded-full bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary)] sm:inline">
                مطلوب
              </span>
            ) : null}
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {TypeIcon ? (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--brand-soft-lime)_75%,var(--surface))] text-[var(--brand-carbon)] dark:text-[var(--foreground)] sm:size-9">
                <TypeIcon className="size-4" strokeWidth={1.9} aria-hidden />
              </span>
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold leading-tight text-[var(--foreground)] sm:text-[15px]">
                {fieldLabel}
              </span>
              <span className="text-[11px] text-[var(--muted-foreground)] sm:text-xs">
                {typeLabel}
              </span>
            </div>
            {field.required ? (
              <span className="shrink-0 rounded-full bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary)]">
                مطلوب
              </span>
            ) : null}
            {onChangeType ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onPress={onChangeType}
                className="ms-auto h-7 rounded-full px-2.5 text-xs sm:ms-0"
              >
                تغيير النوع
              </Button>
            ) : null}
          </div>
        )}

        {isCanvas ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCollapsedChange?.(!isCollapsed);
            }}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'توسيع الحقل' : 'طي الحقل'}
            className={cn(
              'inline-flex size-8 shrink-0 items-center justify-center rounded-lg',
              'text-[var(--muted-foreground)] transition-colors',
              'hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]',
            )}
          >
            <ChevronDown
              className={cn(
                'size-4 transition-transform duration-200',
                !isCollapsed && 'rotate-180',
              )}
              aria-hidden
            />
          </button>
        ) : null}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label="حذف الحقل"
          className={cn(
            'inline-flex size-8 shrink-0 items-center justify-center rounded-lg',
            'text-[var(--muted-foreground)] transition-colors',
            'hover:bg-[var(--danger)]/10 hover:text-[var(--danger)] active:scale-95',
          )}
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>

      {isCanvas ? (
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-200 ease-out',
            isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]',
          )}
        >
          <div className="overflow-hidden">
            <div className={cn(!isCollapsed && 'pt-4')}>{editorBody}</div>
          </div>
        </div>
      ) : (
        <div className="mt-4">{editorBody}</div>
      )}
    </div>
  );
}
