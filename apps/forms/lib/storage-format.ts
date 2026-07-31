const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

export function formatStorageBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    UNITS.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  const unit = UNITS[exponent];

  return `${value.toFixed(exponent === 0 ? 0 : decimals)} ${unit}`;
}

export const DEFAULT_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;

export const FORMS_STORAGE_CATEGORY_LABELS: Record<string, string> = {
  FORM_COVER: 'أغلفة النماذج',
  FORM_BANNER: 'بانرات النماذج',
  FORM_SUBMISSION: 'مرفقات الاستجابات',
};

export const FORMS_STORAGE_CATEGORIES = [
  'FORM_COVER',
  'FORM_BANNER',
  'FORM_SUBMISSION',
] as const;

export function sumFormsStorageBytes(
  breakdown: Record<string, number>,
): number {
  return FORMS_STORAGE_CATEGORIES.reduce(
    (sum, category) => sum + (breakdown[category] ?? 0),
    0,
  );
}

/** Minimum visible width (%) for non-zero usage on progress bars */
export function storageBarWidth(bytes: number, total: number): number {
  if (bytes <= 0 || total <= 0) return 0;
  const pct = (bytes / total) * 100;
  return Math.max(pct, 2);
}
