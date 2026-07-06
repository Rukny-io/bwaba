export type ConditionalOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'isEmpty'
  | 'isNotEmpty';

export type ConditionalAction = 'show' | 'hide' | 'require' | 'skip';

export interface ConditionalRule {
  fieldId: string;
  operator: ConditionalOperator;
  value?: string;
  action: ConditionalAction;
}

export interface ConditionalLogic {
  logic: 'AND' | 'OR';
  rules: ConditionalRule[];
}

export const CONDITIONAL_OPERATOR_OPTIONS: {
  value: ConditionalOperator;
  label: string;
  needsValue: boolean;
}[] = [
  { value: 'equals', label: 'يساوي', needsValue: true },
  { value: 'notEquals', label: 'لا يساوي', needsValue: true },
  { value: 'contains', label: 'يحتوي', needsValue: true },
  { value: 'notContains', label: 'لا يحتوي', needsValue: true },
  { value: 'greaterThan', label: 'أكبر من', needsValue: true },
  { value: 'lessThan', label: 'أصغر من', needsValue: true },
  { value: 'isEmpty', label: 'فارغ', needsValue: false },
  { value: 'isNotEmpty', label: 'غير فارغ', needsValue: false },
];

export const CONDITIONAL_ACTION_OPTIONS: {
  value: ConditionalAction;
  label: string;
}[] = [
  { value: 'show', label: 'إظهار الحقل عند تحقق الشرط' },
  { value: 'hide', label: 'إخفاء الحقل عند تحقق الشرط' },
];

export function parseConditionalLogic(value: unknown): ConditionalLogic | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<ConditionalLogic>;
  if (!Array.isArray(raw.rules) || raw.rules.length === 0) return null;
  return {
    logic: raw.logic === 'OR' ? 'OR' : 'AND',
    rules: raw.rules
      .filter((rule) => rule && typeof rule.fieldId === 'string')
      .map((rule) => ({
        fieldId: rule.fieldId,
        operator: (rule.operator as ConditionalOperator) ?? 'equals',
        value: rule.value != null ? String(rule.value) : undefined,
        action: (rule.action as ConditionalAction) ?? 'show',
      })),
  };
}

export function emptyConditionalLogic(
  sourceFieldId: string,
  defaultOperator: ConditionalOperator = 'equals',
): ConditionalLogic {
  return {
    logic: 'AND',
    rules: [
      {
        fieldId: sourceFieldId,
        operator: defaultOperator,
        value: '',
        action: 'show',
      },
    ],
  };
}
