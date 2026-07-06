const DECORATIVE_FIELD_TYPES = new Set([
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
  'HIDDEN',
  'CONDITIONAL_LOGIC',
  'CALCULATED',
]);

type FormFieldLike = { id: string; label: string; type: string };

function formatAnswerValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '';
  if (Array.isArray(value)) return value.map(String).join(', ');
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.webViewLink === 'string') return obj.webViewLink;
    if (typeof obj.secureUrl === 'string') return obj.secureUrl;
    if (typeof obj.url === 'string') return obj.url;
    if (typeof obj.name === 'string') return obj.name;
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Maps submission data to question labels for integrations (Make, Sheets, webhooks).
 */
export function buildSubmissionAnswersByLabel(
  fields: FormFieldLike[],
  data: Record<string, unknown>,
): Record<string, string> {
  const answers: Record<string, string> = {};

  for (const field of fields) {
    if (DECORATIVE_FIELD_TYPES.has(field.type)) continue;

    const raw = data[field.id] ?? data[field.label];
    if (raw === undefined || raw === null || raw === '') continue;

    const formatted = formatAnswerValue(raw);
    if (formatted) {
      answers[field.label] = formatted;
    }
  }

  return answers;
}
