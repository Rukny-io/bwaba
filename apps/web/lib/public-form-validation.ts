import type { FormField } from '@/lib/forms-types';
import { isPublicInputFieldType } from '@rukny/forms-shared/public-form-utils';
import {
  fieldRequiresEmailVerification,
  fieldRequiresPhoneWhatsappVerification,
} from '@/lib/form-field-utils';
import { isPublicFormFileValue } from '@/lib/public-form-upload';

export type FieldErrorMap = Record<string, string>;

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') {
    if (isPublicFormFileValue(value)) return false;
    return Object.keys(value).length === 0;
  }
  return false;
}

export function validateVisibleFields(
  fields: FormField[],
  values: Record<string, unknown>,
  visibleFieldIds: Set<string>,
  verificationState: {
    emailVerified: Record<string, boolean>;
    phoneVerified: Record<string, boolean>;
  },
): FieldErrorMap {
  const errors: FieldErrorMap = {};

  for (const field of fields) {
    if (!visibleFieldIds.has(field.id)) continue;
    if (!isPublicInputFieldType(field.type)) continue;

    const value = values[field.id];
    if (field.required && isEmptyValue(value)) {
      errors[field.id] = 'هذا الحقل مطلوب';
      continue;
    }

    if (field.type === 'FILE' && field.required && !isPublicFormFileValue(value)) {
      errors[field.id] = 'يرجى رفع ملف';
      continue;
    }

    if (field.type === 'EMAIL' && fieldRequiresEmailVerification(field.validationRules)) {
      if (!isEmptyValue(value) && !verificationState.emailVerified[field.id]) {
        errors[field.id] = 'يرجى تأكيد البريد الإلكتروني برمز التحقق';
      }
    }

    if (
      field.type === 'PHONE' &&
      fieldRequiresPhoneWhatsappVerification(field.validationRules)
    ) {
      if (!isEmptyValue(value) && !verificationState.phoneVerified[field.id]) {
        errors[field.id] = 'يرجى تأكيد رقم الهاتف عبر WhatsApp';
      }
    }
  }

  return errors;
}

export function firstErrorFieldId(errors: FieldErrorMap): string | null {
  return Object.keys(errors)[0] ?? null;
}
