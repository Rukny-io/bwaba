import { SecureIds } from '../../../core/common/utils/secure-id.util';

const PRESERVABLE_FIELD_ID = /^[A-Za-z0-9._-]{1,128}$/;

/** Client or server field id safe to reuse when saving form structure. */
export function resolveFormFieldId(
  field: { id?: unknown },
  options?: { preserveId?: boolean },
): string {
  if (!options?.preserveId || typeof field.id !== 'string') {
    return SecureIds.field();
  }

  const trimmed = field.id.trim();
  if (!trimmed || !PRESERVABLE_FIELD_ID.test(trimmed)) {
    return SecureIds.field();
  }

  return trimmed;
}

/**
 * Maps a form field DTO to a Prisma create row (createMany / create).
 */
export function mapFormFieldData(
  field: any,
  formId: string,
  stepId?: string | null,
  options?: { preserveId?: boolean },
) {
  return {
    id: resolveFormFieldId(field, options),
    formId,
    ...(stepId != null && { stepId }),
    label: field.label,
    description: (field.description as string) ?? null,
    type: field.type,
    order: field.order,
    required: (field.required as boolean) ?? false,
    placeholder: (field.placeholder as string) ?? null,
    defaultValue: (field.defaultValue as string) ?? null,
    options: field.options ?? null,
    validationRules: field.validationRules ?? null,
    conditionalLogic: field.conditionalLogic ?? null,
    minValue: (field.minValue as number) ?? null,
    maxValue: (field.maxValue as number) ?? null,
    minLabel: (field.minLabel as string) ?? null,
    maxLabel: (field.maxLabel as string) ?? null,
    allowedFileTypes: (field.allowedFileTypes as string[]) || [],
    maxFileSize: (field.maxFileSize as number) ?? null,
    maxFiles: (field.maxFiles as number) ?? null,
  };
}
