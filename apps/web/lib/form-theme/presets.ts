/** ألوان أساسية جاهزة لاختيار سريع في محرّر التصميم */
export const PRIMARY_COLOR_PRESETS = [
  { value: '#062C30', label: 'أخضر داكن' },
  { value: '#0f172a', label: 'كحلي' },
  { value: '#1e40af', label: 'أزرق' },
  { value: '#3b82f6', label: 'أزرق فاتح' },
  { value: '#0891b2', label: 'سماوي' },
  { value: '#059669', label: 'أخضر' },
  { value: '#10b981', label: 'زمردي' },
  { value: '#d97706', label: 'ذهبي' },
  { value: '#f59e0b', label: 'كهرماني' },
  { value: '#ef4444', label: 'أحمر' },
  { value: '#ec4899', label: 'وردي' },
  { value: '#8b5cf6', label: 'بنفسجي' },
] as const;

export function normalizeHexColor(hex: string): string {
  const trimmed = hex.trim();
  if (!trimmed) return '#062C30';
  return trimmed.startsWith('#') ? trimmed.toLowerCase() : `#${trimmed.toLowerCase()}`;
}

export function isPresetPrimaryColor(hex: string): boolean {
  const n = normalizeHexColor(hex);
  return PRIMARY_COLOR_PRESETS.some((p) => p.value === n);
}
