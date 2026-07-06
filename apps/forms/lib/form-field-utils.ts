import type { FormField, FormFieldPayload } from '@/lib/forms-api';
import {
  IRAQ_GOVERNORATE_CODES,
  getIraqGovernorateLabel,
} from '@/lib/iraq-governorate-options';
import { NPS_DEFAULT_LABELS } from '@/lib/form-field-special';
import {
  fieldTypeNeedsOptions,
  isDecorativeWizardField,
  WIZARD_ADDABLE_FIELD_TYPES,
  type WizardFieldType,
} from '@/lib/form-field-types';

export interface DraftFormField {
  clientId: string;
  label: string;
  type: WizardFieldType;
  order: number;
  required: boolean;
  placeholder?: string;
  description?: string;
  options: string[];
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;
  validationRules?: unknown;
  conditionalLogic?: unknown;
}

export function newClientFieldId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `f-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createDraftField(
  type: WizardFieldType,
  order: number,
  overrides?: Partial<Pick<DraftFormField, 'label' | 'required' | 'placeholder' | 'options'>>,
): DraftFormField {
  const defaultLabel =
    type === 'HEADING'
      ? 'عنوان القسم'
      : type === 'PARAGRAPH'
        ? 'نص توضيحي'
        : type === 'DIVIDER'
          ? '—'
          : type === 'IMAGE'
            ? 'صورة توضيحية'
            : type === 'RESPONDENT_COUNTRY'
              ? 'بلد المستجيب'
              : type === 'IRAQ_GOVERNORATE'
                ? 'المحافظة'
                : type === 'LEGAL_CONSENT'
                  ? 'الموافقة على الشروط'
                  : type === 'YES_NO'
                    ? 'هل توافق؟'
                    : type === 'NPS'
                      ? 'ما مدى احتمال أن توصي بنا؟'
                      : 'حقل جديد';

  return {
    clientId: newClientFieldId(),
    label: overrides?.label ?? defaultLabel,
    type,
    order,
    required: overrides?.required ?? !isDecorativeWizardField(type),
    placeholder: overrides?.placeholder,
    options:
      overrides?.options ??
      (type === 'IRAQ_GOVERNORATE'
        ? [...IRAQ_GOVERNORATE_CODES]
        : type === 'MATRIX'
          ? ['1', '2', '3', '4', '5']
          : fieldTypeNeedsOptions(type)
            ? ['خيار 1', 'خيار 2', 'خيار 3']
            : []),
    minValue:
      type === 'NPS'
        ? 0
        : type === 'RATING' || type === 'SCALE'
          ? 1
          : undefined,
    maxValue:
      type === 'NPS'
        ? 10
        : type === 'RATING' || type === 'SCALE'
          ? 5
          : undefined,
    minLabel: type === 'NPS' ? NPS_DEFAULT_LABELS.minLabel : undefined,
    maxLabel: type === 'NPS' ? NPS_DEFAULT_LABELS.maxLabel : undefined,
    validationRules:
      type === 'MATRIX'
        ? { rows: ['عنصر 1', 'عنصر 2'] }
        : type === 'IMAGE'
          ? { imageUrl: '', alt: '' }
          : type === 'LEGAL_CONSENT'
            ? {
                consentText: 'أوافق على معالجة بياناتي وفق سياسة الخصوصية.',
                linkUrl: '',
                linkLabel: 'اقرأ الشروط',
              }
            : type === 'YES_NO'
              ? { yesLabel: 'نعم', noLabel: 'لا' }
              : undefined,
  };
}

export function draftFromApiField(field: FormField): DraftFormField | null {
  const type = field.type as WizardFieldType;
  if (!isWizardFieldType(type)) return null;

  return {
    clientId: field.id,
    label: field.label,
    type,
    order: field.order,
    required: Boolean(field.required),
    placeholder: field.placeholder ?? undefined,
    options:
      type === 'MATRIX' &&
      field.options &&
      typeof field.options === 'object' &&
      !Array.isArray(field.options)
        ? ((field.options as { columns?: string[] }).columns ?? [
            '1',
            '2',
            '3',
            '4',
            '5',
          ])
        : parseOptionsFromApi(field),
    minValue: field.minValue ?? undefined,
    maxValue: field.maxValue ?? undefined,
    minLabel: field.minLabel ?? undefined,
    maxLabel: field.maxLabel ?? undefined,
    validationRules:
      type === 'MATRIX' &&
      field.options &&
      typeof field.options === 'object' &&
      !Array.isArray(field.options)
        ? {
            rows: (field.options as { rows?: string[] }).rows ?? ['عنصر 1'],
          }
        : (field as FormField & { validationRules?: unknown }).validationRules,
    conditionalLogic: (field as FormField & { conditionalLogic?: unknown })
      .conditionalLogic,
  };
}

/** لعرض الحقول في لوحة الخطوات أثناء التحرير المباشر */
export function draftFieldsToFormFields(drafts: DraftFormField[]): FormField[] {
  return normalizeFieldOrders(drafts).map((f) => ({
    id: f.clientId,
    label: f.label.trim() || 'حقل',
    type: f.type,
    order: f.order,
    required: f.required,
    placeholder: f.placeholder ?? null,
    description: f.description ?? null,
    options: f.options,
    minValue: f.minValue ?? null,
    maxValue: f.maxValue ?? null,
    minLabel: f.minLabel ?? null,
    maxLabel: f.maxLabel ?? null,
  }));
}

function isWizardFieldType(type: string): type is WizardFieldType {
  return (WIZARD_ADDABLE_FIELD_TYPES as readonly string[]).includes(type);
}

function parseOptionsFromApi(field: FormField): string[] {
  const raw = (field as FormField & { options?: unknown }).options;
  if (!raw) return ['خيار 1', 'خيار 2'];
  if (Array.isArray(raw)) {
    return raw.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        return String(o.label ?? o.value ?? '');
      }
      return String(item);
    });
  }
  return ['خيار 1', 'خيار 2'];
}

/** Reorder indices without replacing unchanged field objects (Reorder.Group needs stable refs). */
export function normalizeFieldOrders(fields: DraftFormField[]): DraftFormField[] {
  let changed = false;
  const next = fields.map((f, i) => {
    if (f.order === i) return f;
    changed = true;
    return { ...f, order: i };
  });
  return changed ? next : fields;
}

export function fieldsToPayload(fields: DraftFormField[]): FormFieldPayload[] {
  return normalizeFieldOrders(fields).map((f) => ({
    id: f.clientId,
    label: f.label.trim() || 'حقل',
    type: f.type,
    order: f.order,
    required: isLayoutField(f.type) || f.type === 'RECAPTCHA' || f.type === 'RESPONDENT_COUNTRY'
      ? false
      : f.required,
    placeholder: f.placeholder?.trim() || undefined,
    description: f.description?.trim() || undefined,
    options:
      f.type === 'MATRIX'
        ? {
            rows:
              (f.validationRules as { rows?: string[] })?.rows ?? ['عنصر 1'],
            columns: f.options.filter((o) => o.trim()),
          }
        : fieldTypeNeedsOptions(f.type) || f.type === 'IRAQ_GOVERNORATE'
          ? f.options.filter((o) => o.trim()).map((o) => o.trim())
          : undefined,
    minValue: f.type === 'NPS' ? 0 : f.minValue,
    maxValue: f.type === 'NPS' ? 10 : f.maxValue,
    minLabel: f.minLabel,
    maxLabel: f.maxLabel,
    validationRules:
      f.type === 'MATRIX' ? undefined : f.validationRules,
    conditionalLogic: f.conditionalLogic,
  }));
}

function isLayoutField(type: WizardFieldType): boolean {
  return (
    type === 'HEADING' ||
    type === 'PARAGRAPH' ||
    type === 'DIVIDER' ||
    type === 'IMAGE'
  );
}

export function parseFieldOptions(
  options: unknown,
): { label: string; value: string }[] {
  if (!options) return [];
  if (Array.isArray(options)) {
    return options.map((item, i) => {
      if (typeof item === 'string') {
        return { label: item, value: item };
      }
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        const value = String(o.value ?? o.id ?? o.label ?? i);
        const label = String(o.label ?? o.value ?? value);
        return { label, value };
      }
      return { label: String(item), value: String(item) };
    });
  }
  return [];
}

export function parseGovernorateFieldOptions(
  options: unknown,
): { label: string; value: string }[] {
  return parseFieldOptions(options).map((opt) => {
    if (opt.value.startsWith('IQ-')) {
      return { value: opt.value, label: getIraqGovernorateLabel(opt.value) };
    }
    return opt;
  });
}

export const LAYOUT_FIELD_TYPES = new Set([
  'HEADING',
  'PARAGRAPH',
  'DIVIDER',
  'TITLE',
  'LABEL',
  'IMAGE',
]);

export function isLayoutFieldType(type: string): boolean {
  return LAYOUT_FIELD_TYPES.has(type);
}

export function fieldRequiresEmailVerification(validationRules: unknown): boolean {
  if (!validationRules || typeof validationRules !== 'object') return false;
  const r = validationRules as Record<string, unknown>;
  return r.requireVerification === true || r.requireEmailVerification === true;
}

export function setFieldEmailVerification(
  validationRules: unknown,
  enabled: boolean,
): unknown | undefined {
  const base =
    validationRules && typeof validationRules === 'object'
      ? { ...(validationRules as Record<string, unknown>) }
      : {};

  if (enabled) {
    base.requireVerification = true;
  } else {
    delete base.requireVerification;
    delete base.requireEmailVerification;
  }

  return Object.keys(base).length > 0 ? base : undefined;
}

export function fieldRequiresPhoneWhatsappVerification(
  validationRules: unknown,
): boolean {
  if (!validationRules || typeof validationRules !== 'object') return false;
  const r = validationRules as Record<string, unknown>;
  return (
    r.requireWhatsappVerification === true ||
    r.requirePhoneVerification === true
  );
}

export function setFieldPhoneWhatsappVerification(
  validationRules: unknown,
  enabled: boolean,
): unknown | undefined {
  const base =
    validationRules && typeof validationRules === 'object'
      ? { ...(validationRules as Record<string, unknown>) }
      : {};

  if (enabled) {
    base.requireWhatsappVerification = true;
  } else {
    delete base.requireWhatsappVerification;
    delete base.requirePhoneVerification;
  }

  return Object.keys(base).length > 0 ? base : undefined;
}

export function getScaleMidLabel(validationRules: unknown): string {
  if (!validationRules || typeof validationRules !== 'object') return '';
  const mid = (validationRules as Record<string, unknown>).midLabel;
  return typeof mid === 'string' ? mid : '';
}

export function setScaleMidLabel(
  validationRules: unknown,
  midLabel: string,
): unknown | undefined {
  const base =
    validationRules && typeof validationRules === 'object'
      ? { ...(validationRules as Record<string, unknown>) }
      : {};
  const trimmed = midLabel.trim();
  if (trimmed) {
    base.midLabel = trimmed;
  } else {
    delete base.midLabel;
  }
  return Object.keys(base).length > 0 ? base : undefined;
}

export function parseOptionalNumberInput(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}
