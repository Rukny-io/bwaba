import type { FormField, FormSubmission } from '@/lib/forms-api';
import { formatRespondentCountryValue, isRespondentCountryValue } from '@/lib/country-labels';
import { isLayoutFieldType } from '@/lib/form-field-utils';

export type SubmissionsViewTab = 'summary' | 'question' | 'individual';

export const SUBMISSIONS_TABS: {
  id: SubmissionsViewTab;
  label: string;
}[] = [
  { id: 'summary', label: 'ملخص' },
  { id: 'question', label: 'سؤال' },
  { id: 'individual', label: 'فردي' },
];

const DECORATIVE_TYPES = new Set([
  'HEADING',
  'PARAGRAPH',
  'DIVIDER',
  'TITLE',
  'LABEL',
  'IMAGE',
  'VIDEO',
  'AUDIO',
  'EMBED',
  'RECAPTCHA',
]);

export function isInputField(field: Pick<FormField, 'type'>): boolean {
  return !DECORATIVE_TYPES.has(field.type) && !isLayoutFieldType(field.type);
}

export function getSubmissionFieldValue(
  data: Record<string, unknown>,
  field: Pick<FormField, 'id' | 'label'>,
): unknown {
  if (Object.prototype.hasOwnProperty.call(data, field.id)) {
    return data[field.id];
  }
  if (Object.prototype.hasOwnProperty.call(data, field.label)) {
    return data[field.label];
  }
  return undefined;
}

export function formatOrphanedFieldKeyLabel(fieldKey: string): string {
  if (fieldKey.startsWith('fld_')) {
    return `حقل محذوف (${fieldKey.slice(-8)})`;
  }
  if (fieldKey.length > 36) {
    return `حقل محذوف (${fieldKey.slice(0, 10)}…)`;
  }
  return `حقل محذوف: ${fieldKey}`;
}

export function getOrphanedSubmissionEntries(
  data: Record<string, unknown>,
  fields: Pick<FormField, 'id' | 'label'>[],
): { key: string; label: string; value: unknown }[] {
  const known = new Set<string>();
  for (const field of fields) {
    known.add(field.id);
    known.add(field.label);
  }

  return Object.entries(data)
    .filter(([key, value]) => !known.has(key) && !isBlankSubmissionValue(value))
    .map(([key, value]) => ({
      key,
      label: formatOrphanedFieldKeyLabel(key),
      value,
    }));
}

export function isBlankSubmissionValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** Repair common corruption (e.g. sanitize removed ";" before base64). */
export function normalizeSignatureDataUrl(value: string): string {
  let s = value.trim();
  if (!s) return s;

  s = s.replace(/^(data:image\/[\w+.-]+)base64,/i, '$1;base64,');

  if (!s.startsWith('data:') && s.includes(';base64,')) {
    s = `data:${s}`;
  }

  if (
    !s.startsWith('data:') &&
    s.length > 80 &&
    /^[A-Za-z0-9+/=\s]+$/.test(s)
  ) {
    s = `data:image/png;base64,${s.replace(/\s/g, '')}`;
  }

  return s;
}

/** Resolve a stored signature answer to an image src (data URL or https). */
export function resolveSignatureImageSrc(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = normalizeSignatureDataUrl(value);
    if (!trimmed) return null;
    if (trimmed.startsWith('data:image')) return trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
  }

  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if (typeof o.url === 'string') return o.url;
    if (typeof o.secureUrl === 'string') return o.secureUrl;
    if (typeof o.webViewLink === 'string') return o.webViewLink;
    if (typeof o.readUrl === 'string') return o.readUrl;
  }

  return null;
}

export function isSignatureSubmissionValue(value: unknown): boolean {
  return resolveSignatureImageSrc(value) !== null;
}

export function formatSubmissionValue(value: unknown): string {
  if (isBlankSubmissionValue(value)) return '';
  if (isRespondentCountryValue(value)) return formatRespondentCountryValue(value);
  if (isSignatureSubmissionValue(value)) return 'توقيع';
  if (Array.isArray(value)) return value.map(String).join('، ');
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if (typeof o.name === 'string') return o.name;
    if (typeof o.filename === 'string') return o.filename;
    if (typeof o.secureUrl === 'string') return o.secureUrl;
    if (typeof o.url === 'string') return o.url;
    return JSON.stringify(value);
  }
  return String(value);
}

export function collectRespondentEmails(
  submissions: FormSubmission[],
): string[] {
  const emails = new Set<string>();
  for (const sub of submissions) {
    const email = sub.user?.email?.trim();
    if (email) emails.add(email);
  }
  return [...emails];
}

export function sortedInputFields(fields: FormField[]): FormField[] {
  return [...fields]
    .filter(isInputField)
    .sort((a, b) => a.order - b.order);
}

const CHOICE_TYPES = new Set(['SELECT', 'RADIO', 'MULTISELECT', 'IRAQ_GOVERNORATE']);

export function isChoiceFieldType(type: string): boolean {
  return CHOICE_TYPES.has(type);
}

export function isNumericFieldType(type: string): boolean {
  return type === 'RATING' || type === 'SCALE' || type === 'NPS' || type === 'NUMBER';
}
