const LAYOUT_FIELD_TYPES = new Set([
  'HEADING',
  'PARAGRAPH',
  'DIVIDER',
  'TITLE',
  'LABEL',
  'IMAGE',
]);

export function parseFieldOptions(
  options: unknown,
): { label: string; value: string }[] {
  if (!options) return [];
  if (Array.isArray(options)) {
    return options.map((item, i) => {
      if (typeof item === 'string') {
        return { label: item, value: item };
      }
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        const value = String(o.value ?? o.id ?? o.label ?? i);
        const label = String(o.label ?? o.value ?? value);
        return { label, value };
      }
      return { label: String(item), value: String(item) };
    });
  }
  return [];
}

export function isLayoutFieldType(type: string): boolean {
  return LAYOUT_FIELD_TYPES.has(type);
}

export function getScaleMidLabel(validationRules: unknown): string {
  if (!validationRules || typeof validationRules !== 'object') return '';
  const mid = (validationRules as Record<string, unknown>).midLabel;
  return typeof mid === 'string' ? mid : '';
}

export { parseGovernorateFieldOptions } from '@/lib/iraq-governorate-geo';

export function fieldRequiresEmailVerification(validationRules: unknown): boolean {
  if (!validationRules || typeof validationRules !== 'object') return false;
  const r = validationRules as Record<string, unknown>;
  return r.requireVerification === true || r.requireEmailVerification === true;
}

export function fieldRequiresPhoneWhatsappVerification(
  validationRules: unknown,
): boolean {
  if (!validationRules || typeof validationRules !== 'object') return false;
  const r = validationRules as Record<string, unknown>;
  return (
    r.requireWhatsappVerification === true ||
    r.requirePhoneVerification === true
  );
}
