/** Matches API create-form.dto slug rules (lowercase, digits, hyphens, max 200). */
export const PUBLIC_FORM_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,198}[a-z0-9])?$/;

/** Auto-generated 6-character public slugs. */
export const SYSTEM_FORM_SLUG_PATTERN = /^[a-z0-9]{6}$/;

export function isValidPublicFormSlug(slug: string): boolean {
  return PUBLIC_FORM_SLUG_PATTERN.test(slug);
}

export function isSystemFormSlug(slug: string): boolean {
  return SYSTEM_FORM_SLUG_PATTERN.test(slug);
}

const LAYOUT_TYPES = new Set([
  'HEADING',
  'PARAGRAPH',
  'DIVIDER',
  'TITLE',
  'LABEL',
  'IMAGE',
  'VIDEO',
  'AUDIO',
  'EMBED',
]);

const NON_INPUT_TYPES = new Set(['RECAPTCHA', 'RESPONDENT_COUNTRY', 'HIDDEN']);

export function isLayoutFieldType(type: string): boolean {
  return LAYOUT_TYPES.has(type);
}

export function isPublicInputFieldType(type: string): boolean {
  return !isLayoutFieldType(type) && !NON_INPUT_TYPES.has(type);
}

export const PUBLIC_FORM_LAYOUT_TYPES = LAYOUT_TYPES;
