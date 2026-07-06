import type { WizardFieldType } from '@/lib/form-field-types';
import type { DraftFormField } from '@/lib/form-field-utils';
import type { ConditionalOperator, ConditionalRule } from '@/lib/conditional-logic-types';

/** How we interpret comparisons for the source (reference) field. */
export type FieldConditionKind =
  | 'text'
  | 'numeric'
  | 'date'
  | 'choice'
  | 'multiChoice'
  | 'boolean'
  | 'filled';

export interface OperatorOption {
  value: ConditionalOperator;
  label: string;
  needsValue: boolean;
  hint?: string;
}

export interface ValueInputConfig {
  kind: 'none' | 'text' | 'email' | 'tel' | 'url' | 'number' | 'date' | 'time' | 'datetime' | 'select' | 'boolean';
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
}

const TEXT_OPERATORS: OperatorOption[] = [
  { value: 'equals', label: 'يساوي', needsValue: true },
  { value: 'notEquals', label: 'لا يساوي', needsValue: true },
  { value: 'contains', label: 'يحتوي على', needsValue: true },
  { value: 'notContains', label: 'لا يحتوي على', needsValue: true },
  { value: 'isEmpty', label: 'فارغ', needsValue: false },
  { value: 'isNotEmpty', label: 'مُعبّأ', needsValue: false },
];

const NUMERIC_OPERATORS: OperatorOption[] = [
  { value: 'equals', label: 'يساوي', needsValue: true },
  { value: 'notEquals', label: 'لا يساوي', needsValue: true },
  { value: 'greaterThan', label: 'أكبر من', needsValue: true },
  { value: 'lessThan', label: 'أصغر من', needsValue: true },
  { value: 'greaterThanOrEqual', label: 'أكبر من أو يساوي', needsValue: true },
  { value: 'lessThanOrEqual', label: 'أصغر من أو يساوي', needsValue: true },
  { value: 'isEmpty', label: 'فارغ', needsValue: false },
  { value: 'isNotEmpty', label: 'مُعبّأ', needsValue: false },
];

const DATE_OPERATORS: OperatorOption[] = [
  { value: 'equals', label: 'في نفس اليوم/الوقت', needsValue: true },
  { value: 'notEquals', label: 'ليس في نفس اليوم/الوقت', needsValue: true },
  { value: 'greaterThan', label: 'بعد', needsValue: true },
  { value: 'lessThan', label: 'قبل', needsValue: true },
  { value: 'isEmpty', label: 'فارغ', needsValue: false },
  { value: 'isNotEmpty', label: 'مُعبّأ', needsValue: false },
];

const CHOICE_OPERATORS: OperatorOption[] = [
  { value: 'equals', label: 'يساوي الخيار', needsValue: true },
  { value: 'notEquals', label: 'لا يساوي الخيار', needsValue: true },
  { value: 'isEmpty', label: 'لم يُخترَ شيء', needsValue: false },
  { value: 'isNotEmpty', label: 'تم الاختيار', needsValue: false },
];

const MULTI_CHOICE_OPERATORS: OperatorOption[] = [
  { value: 'contains', label: 'يتضمّن الخيار', needsValue: true },
  { value: 'notContains', label: 'لا يتضمّن الخيار', needsValue: true },
  { value: 'isEmpty', label: 'لم يُخترَ شيء', needsValue: false },
  { value: 'isNotEmpty', label: 'تم اختيار شيء', needsValue: false },
];

const BOOLEAN_OPERATORS: OperatorOption[] = [
  { value: 'equals', label: 'يساوي', needsValue: true },
  { value: 'notEquals', label: 'لا يساوي', needsValue: true },
];

const FILLED_OPERATORS: OperatorOption[] = [
  { value: 'isEmpty', label: 'فارغ / غير مرفوع', needsValue: false },
  { value: 'isNotEmpty', label: 'مُعبّأ / مرفوع', needsValue: false },
];

export function getFieldConditionKind(type: WizardFieldType): FieldConditionKind {
  switch (type) {
    case 'EMAIL':
    case 'PHONE':
    case 'URL':
    case 'TEXT':
    case 'TEXTAREA':
      return 'text';
    case 'NUMBER':
    case 'RATING':
    case 'SCALE':
    case 'NPS':
      return 'numeric';
    case 'DATE':
    case 'TIME':
    case 'DATETIME':
      return 'date';
    case 'SELECT':
    case 'RADIO':
    case 'IRAQ_GOVERNORATE':
      return 'choice';
    case 'MULTISELECT':
      return 'multiChoice';
    case 'CHECKBOX':
    case 'TOGGLE':
    case 'YES_NO':
    case 'LEGAL_CONSENT':
      return 'boolean';
    case 'FILE':
    case 'SIGNATURE':
    case 'MATRIX':
    case 'RANKING':
    case 'RECAPTCHA':
      return 'filled';
    default:
      return 'text';
  }
}

export function getOperatorsForFieldType(type: WizardFieldType): OperatorOption[] {
  switch (getFieldConditionKind(type)) {
    case 'numeric':
      return NUMERIC_OPERATORS;
    case 'date':
      return DATE_OPERATORS;
    case 'choice':
      return CHOICE_OPERATORS;
    case 'multiChoice':
      return MULTI_CHOICE_OPERATORS;
    case 'boolean':
      return BOOLEAN_OPERATORS;
    case 'filled':
      return FILLED_OPERATORS;
    default:
      return TEXT_OPERATORS;
  }
}

export function getDefaultOperatorForFieldType(
  type: WizardFieldType,
): ConditionalOperator {
  const ops = getOperatorsForFieldType(type);
  return ops[0]?.value ?? 'equals';
}

export function isOperatorAllowedForField(
  type: WizardFieldType,
  operator: ConditionalOperator,
): boolean {
  return getOperatorsForFieldType(type).some((op) => op.value === operator);
}

export function normalizeRuleForSourceField(
  rule: ConditionalRule,
  sourceField: DraftFormField | undefined,
): ConditionalRule {
  if (!sourceField) return rule;

  const operators = getOperatorsForFieldType(sourceField.type);
  const operator = isOperatorAllowedForField(sourceField.type, rule.operator)
    ? rule.operator
    : getDefaultOperatorForFieldType(sourceField.type);
  const needsValue = operators.find((op) => op.value === operator)?.needsValue ?? true;

  return {
    ...rule,
    fieldId: sourceField.clientId,
    operator,
    value: needsValue ? (rule.value ?? '') : undefined,
  };
}

function choiceOptions(field: DraftFormField): { value: string; label: string }[] {
  return field.options
    .map((o) => o.trim())
    .filter(Boolean)
    .map((o) => ({ value: o, label: o }));
}

export function getValueInputConfig(
  sourceField: DraftFormField,
  operator: ConditionalOperator,
): ValueInputConfig {
  const operators = getOperatorsForFieldType(sourceField.type);
  const op = operators.find((item) => item.value === operator);
  if (!op?.needsValue) {
    return { kind: 'none' };
  }

  const kind = getFieldConditionKind(sourceField.type);

  switch (kind) {
    case 'numeric':
      return {
        kind: 'number',
        placeholder: 'مثال: 5',
        hint: 'أدخل رقماً للمقارنة مع إجابة المستخدم.',
        min: sourceField.minValue,
        max: sourceField.maxValue,
      };
    case 'date':
      return {
        kind:
          sourceField.type === 'TIME'
            ? 'time'
            : sourceField.type === 'DATETIME'
              ? 'datetime'
              : 'date',
        hint:
          sourceField.type === 'DATE'
            ? 'قارن بتاريخ الإجابة (YYYY-MM-DD).'
            : sourceField.type === 'TIME'
              ? 'قارن بالوقت (HH:MM).'
              : 'قارن بالتاريخ والوقت معاً.',
      };
    case 'choice':
      return {
        kind: 'select',
        hint: 'اختر أحد خيارات الحقل المرجعي.',
        options: choiceOptions(sourceField),
      };
    case 'multiChoice':
      return {
        kind: 'select',
        hint: 'اختر خياراً يجب أن يظهر ضمن الاختيارات المتعددة.',
        options: choiceOptions(sourceField),
      };
    case 'boolean':
      return {
        kind: 'boolean',
        hint: 'للموافقة/المفتاح: «مفعّل» يعني أن المستخدم وافق أو شغّل الخيار.',
        options: [
          { value: 'true', label: 'مفعّل / نعم' },
          { value: 'false', label: 'غير مفعّل / لا' },
        ],
      };
    case 'filled':
      return { kind: 'none' };
    default:
      if (sourceField.type === 'EMAIL') {
        return {
          kind: 'email',
          placeholder: 'user@example.com',
          hint: 'قارن بعنوان البريد كما يكتبه المستخدم.',
        };
      }
      if (sourceField.type === 'PHONE') {
        return {
          kind: 'tel',
          placeholder: '07xxxxxxxxx',
          hint: 'قارن برقم الهاتف كما يُدخله المستخدم.',
        };
      }
      if (sourceField.type === 'URL') {
        return {
          kind: 'url',
          placeholder: 'https://example.com',
          hint: 'قارن بالرابط كما يُدخله المستخدم.',
        };
      }
      return {
        kind: 'text',
        placeholder: 'القيمة المتوقعة',
        hint: 'قارن بالنص كما يكتبه المستخدم في الحقل.',
      };
  }
}

/** Only fields that appear before the current field can drive conditions. */
export function priorSourceFields(
  current: DraftFormField,
  allFields: DraftFormField[],
): DraftFormField[] {
  return allFields.filter(
    (f) =>
      f.order < current.order &&
      f.type !== 'HEADING' &&
      f.type !== 'PARAGRAPH' &&
      f.type !== 'DIVIDER' &&
      f.type !== 'RECAPTCHA',
  );
}

export function fieldTypeHint(type: WizardFieldType): string {
  switch (getFieldConditionKind(type)) {
    case 'numeric':
      return 'مشغّلات رقمية (أكبر من / أصغر من…)';
    case 'date':
      return 'مشغّلات زمنية (قبل / بعد / يساوي…)';
    case 'choice':
      return 'مقارنة بخيار من قائمة الحقل';
    case 'multiChoice':
      return 'يتحقق إذا اختار المستخدم خياراً معيّناً';
    case 'boolean':
      return 'مفعّل أو غير مفعّل';
    case 'filled':
      return 'هل الحقل مُعبّأ أو فارغ فقط';
    default:
      return 'مقارنة نصية (يساوي / يحتوي…)';
  }
}
