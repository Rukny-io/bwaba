type FormFieldLike = {
  id: string;
  label: string;
  type: string;
  validationRules?: unknown;
  options?: unknown;
};

function rulesRequireVerification(rules: unknown): boolean {
  if (!rules || typeof rules !== 'object') return false;
  const r = rules as Record<string, unknown>;
  return r.requireVerification === true || r.requireEmailVerification === true;
}

export function fieldRequiresEmailVerification(field: FormFieldLike): boolean {
  if (field.type !== 'EMAIL') return false;
  return (
    rulesRequireVerification(field.validationRules) ||
    rulesRequireVerification(field.options)
  );
}

export function getEmailValueForField(
  field: FormFieldLike,
  data: Record<string, unknown>,
): string | null {
  const raw = data[field.id] ?? data[field.label];
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  return email.includes('@') ? email : null;
}
