export function isBlankSubmissionValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function buildCurrentFieldKeySet(
  fields: { id: string; label: string }[],
): Set<string> {
  const keys = new Set<string>();
  for (const field of fields) {
    keys.add(field.id);
    keys.add(field.label);
  }
  return keys;
}

export function getSubmissionFieldValue(
  data: Record<string, unknown>,
  field: { id: string; label: string },
): unknown {
  if (Object.prototype.hasOwnProperty.call(data, field.id)) {
    const value = data[field.id];
    if (!isBlankSubmissionValue(value)) return value;
  }
  if (Object.prototype.hasOwnProperty.call(data, field.label)) {
    const value = data[field.label];
    if (!isBlankSubmissionValue(value)) return value;
  }
  return undefined;
}

export function countSubmissionsWithFieldValue(
  submissions: { data: unknown }[],
  field: { id: string; label: string },
): number {
  let count = 0;
  for (const submission of submissions) {
    const data = submission.data as Record<string, unknown>;
    if (getSubmissionFieldValue(data, field) !== undefined) count++;
  }
  return count;
}

export function collectFieldResponseCounts(
  submissions: { data: unknown }[],
  fields: { id: string; label: string }[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const field of fields) {
    counts[field.id] = countSubmissionsWithFieldValue(submissions, field);
  }
  return counts;
}

export function collectOrphanedFieldKeys(
  submissions: { data: unknown }[],
  currentFieldKeys: Set<string>,
): string[] {
  const orphaned = new Set<string>();

  for (const submission of submissions) {
    const data = submission.data as Record<string, unknown>;
    if (!data || typeof data !== 'object') continue;

    for (const key of Object.keys(data)) {
      if (currentFieldKeys.has(key)) continue;
      if (isBlankSubmissionValue(data[key])) continue;
      orphaned.add(key);
    }
  }

  return [...orphaned].sort();
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

export function formatSubmissionDisplayValue(value: unknown): string {
  if (isBlankSubmissionValue(value)) return '';
  if (Array.isArray(value)) return value.map(String).join('، ');
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.secureUrl === 'string') return record.secureUrl;
    if (typeof record.url === 'string') return record.url;
    if (typeof record.filename === 'string') return record.filename;
    return JSON.stringify(value);
  }
  return String(value);
}
