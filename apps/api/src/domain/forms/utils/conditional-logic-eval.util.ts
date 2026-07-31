import type { ConditionalLogic } from '../dto/conditional-logic.dto';
import { ConditionalOperator } from '../dto/conditional-logic.dto';

export function evaluateConditionalLogic(
  conditionalLogic: ConditionalLogic,
  formResponses: Record<string, unknown>,
): boolean {
  if (!conditionalLogic?.rules?.length) return true;

  const results = conditionalLogic.rules.map((rule) => {
    const fieldValue = formResponses[rule.fieldId];
    return evaluateRule(rule.operator, fieldValue, rule.value);
  });

  return conditionalLogic.logic === 'OR'
    ? results.some(Boolean)
    : results.every(Boolean);
}

function evaluateRule(
  operator: ConditionalOperator,
  fieldValue: unknown,
  compareValue: unknown,
): boolean {
  switch (operator) {
    case ConditionalOperator.EQUALS:
      return compareEquals(fieldValue, compareValue);
    case ConditionalOperator.NOT_EQUALS:
      return !compareEquals(fieldValue, compareValue);
    case ConditionalOperator.CONTAINS:
      return compareContains(fieldValue, compareValue);
    case ConditionalOperator.NOT_CONTAINS:
      return !compareContains(fieldValue, compareValue);
    case ConditionalOperator.GREATER_THAN:
      return compareNumber(fieldValue, compareValue, '>');
    case ConditionalOperator.LESS_THAN:
      return compareNumber(fieldValue, compareValue, '<');
    case ConditionalOperator.GREATER_THAN_OR_EQUAL:
      return compareNumber(fieldValue, compareValue, '>=');
    case ConditionalOperator.LESS_THAN_OR_EQUAL:
      return compareNumber(fieldValue, compareValue, '<=');
    case ConditionalOperator.IS_EMPTY:
      return isEmpty(fieldValue);
    case ConditionalOperator.IS_NOT_EMPTY:
      return !isEmpty(fieldValue);
    default:
      return true;
  }
}

function compareEquals(value1: unknown, value2: unknown): boolean {
  if (Array.isArray(value1)) return value1.includes(value2);
  if (typeof value1 === 'string' && typeof value2 === 'boolean') {
    return value1.toLowerCase() === value2.toString();
  }
  if (typeof value2 === 'string' && typeof value1 === 'boolean') {
    return value2.toLowerCase() === value1.toString();
  }
  return String(value1).toLowerCase() === String(value2).toLowerCase();
}

function compareContains(value: unknown, searchValue: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) {
    return value.some((v) =>
      String(v).toLowerCase().includes(String(searchValue).toLowerCase()),
    );
  }
  return String(value)
    .toLowerCase()
    .includes(String(searchValue).toLowerCase());
}

function compareNumber(
  value1: unknown,
  value2: unknown,
  operator: '>' | '<' | '>=' | '<=',
): boolean {
  const num1 = Number(value1);
  const num2 = Number(value2);
  if (Number.isNaN(num1) || Number.isNaN(num2)) return false;
  switch (operator) {
    case '>':
      return num1 > num2;
    case '<':
      return num1 < num2;
    case '>=':
      return num1 >= num2;
    case '<=':
      return num1 <= num2;
    default:
      return false;
  }
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value as object).length === 0) {
    return true;
  }
  return false;
}

export interface FieldVisibilityInput {
  id: string;
  conditionalLogic?: unknown;
  required: boolean;
}

export function resolveFieldVisibility(
  fields: FieldVisibilityInput[],
  formResponses: Record<string, unknown>,
): {
  visibleFieldIds: string[];
  requiredFieldIds: string[];
  hiddenFieldIds: string[];
} {
  const visibleFieldIds: string[] = [];
  const requiredFieldIds: string[] = [];
  const hiddenFieldIds: string[] = [];

  for (const field of fields) {
    if (!field.conditionalLogic) {
      visibleFieldIds.push(field.id);
      if (field.required) requiredFieldIds.push(field.id);
      continue;
    }

    const logic = field.conditionalLogic as ConditionalLogic;
    const conditionMet = evaluateConditionalLogic(logic, formResponses);
    const action = logic.rules?.[0]?.action || 'show';

    if (action === 'show') {
      if (conditionMet) {
        visibleFieldIds.push(field.id);
        if (field.required) requiredFieldIds.push(field.id);
      } else {
        hiddenFieldIds.push(field.id);
      }
      continue;
    }

    if (action === 'hide') {
      if (conditionMet) {
        hiddenFieldIds.push(field.id);
      } else {
        visibleFieldIds.push(field.id);
        if (field.required) requiredFieldIds.push(field.id);
      }
      continue;
    }

    if (action === 'require') {
      visibleFieldIds.push(field.id);
      if (conditionMet) requiredFieldIds.push(field.id);
      continue;
    }

    if (action === 'skip') {
      if (conditionMet) {
        hiddenFieldIds.push(field.id);
      } else {
        visibleFieldIds.push(field.id);
        if (field.required) requiredFieldIds.push(field.id);
      }
      continue;
    }

    visibleFieldIds.push(field.id);
    if (field.required) requiredFieldIds.push(field.id);
  }

  return { visibleFieldIds, requiredFieldIds, hiddenFieldIds };
}
