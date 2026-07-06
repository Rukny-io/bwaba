import { IRAQ_GOVERNORATE_NAMES } from '@/lib/iraq-governorate-geo';

export const IRAQ_GOVERNORATE_CODES = Object.keys(
  IRAQ_GOVERNORATE_NAMES,
) as string[];

export const IRAQ_GOVERNORATE_OPTIONS = IRAQ_GOVERNORATE_CODES.map((code) => ({
  value: code,
  label: IRAQ_GOVERNORATE_NAMES[code]?.nameAr ?? code,
})).sort((a, b) => a.label.localeCompare(b.label, 'ar'));

export function getIraqGovernorateLabel(code: string): string {
  return IRAQ_GOVERNORATE_NAMES[code]?.nameAr ?? code;
}
