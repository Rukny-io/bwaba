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
