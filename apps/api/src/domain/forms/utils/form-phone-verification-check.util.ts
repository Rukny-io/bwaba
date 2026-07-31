type FormFieldLike = {
  id: string;
  label: string;
  type: string;
  validationRules?: unknown;
  options?: unknown;
};

function rulesRequireWhatsappVerification(rules: unknown): boolean {
  if (!rules || typeof rules !== 'object') return false;
  const r = rules as Record<string, unknown>;
  return (
    r.requireWhatsappVerification === true ||
    r.requirePhoneVerification === true
  );
}

export function fieldRequiresPhoneWhatsappVerification(
  field: FormFieldLike,
): boolean {
  if (field.type !== 'PHONE') return false;
  return (
    rulesRequireWhatsappVerification(field.validationRules) ||
    rulesRequireWhatsappVerification(field.options)
  );
}

export function normalizePhoneNumber(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d+]/g, '');
  if (!digits) return '';
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  if (digits.startsWith('964')) return `+${digits}`;
  if (digits.startsWith('0')) return `+964${digits.slice(1)}`;
  // Iraqi mobile without leading 0, e.g. 773xxxxxxx
  if (/^7\d{9}$/.test(digits)) return `+964${digits}`;
  return `+${digits}`;
}

export function getPhoneValueForField(
  field: FormFieldLike,
  data: Record<string, unknown>,
): string | null {
  const raw = data[field.id] ?? data[field.label];
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw !== 'string') return null;
  const normalized = normalizePhoneNumber(raw);
  return normalized.length >= 8 ? normalized : null;
}
