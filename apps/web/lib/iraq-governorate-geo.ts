/** Arabic/English labels keyed by ISO 3166-2:IQ code */
export const IRAQ_GOVERNORATE_NAMES: Record<
  string,
  { nameEn: string; nameAr: string }
> = {
  'IQ-AN': { nameEn: 'Anbar', nameAr: 'الأنبار' },
  'IQ-BA': { nameEn: 'Basra', nameAr: 'البصرة' },
  'IQ-MU': { nameEn: 'Muthanna', nameAr: 'المثنى' },
  'IQ-QA': { nameEn: 'Qadisiyyah', nameAr: 'القادسية' },
  'IQ-NA': { nameEn: 'Najaf', nameAr: 'النجف' },
  'IQ-AR': { nameEn: 'Erbil', nameAr: 'أربيل' },
  'IQ-SU': { nameEn: 'Sulaymaniyah', nameAr: 'السليمانية' },
  'IQ-NI': { nameEn: 'Nineveh', nameAr: 'نينوى' },
  'IQ-DI': { nameEn: 'Diyala', nameAr: 'ديالى' },
  'IQ-BG': { nameEn: 'Baghdad', nameAr: 'بغداد' },
  'IQ-BB': { nameEn: 'Babil', nameAr: 'بابل' },
  'IQ-KA': { nameEn: 'Karbala', nameAr: 'كربلاء' },
  'IQ-DA': { nameEn: 'Duhok', nameAr: 'دهوك' },
  'IQ-WA': { nameEn: 'Wasit', nameAr: 'واسط' },
  'IQ-SD': { nameEn: 'Saladin', nameAr: 'صلاح الدين' },
  'IQ-MA': { nameEn: 'Maysan', nameAr: 'ميسان' },
  'IQ-DQ': { nameEn: 'Dhi Qar', nameAr: 'ذي قار' },
  'IQ-KI': { nameEn: 'Kirkuk', nameAr: 'كركوك' },
};

export function getIraqGovernorateLabel(code: string): string {
  return IRAQ_GOVERNORATE_NAMES[code]?.nameAr ?? code;
}

export function parseGovernorateFieldOptions(
  options: unknown,
): { label: string; value: string }[] {
  if (!options || !Array.isArray(options)) return [];
  return options.map((item, i) => {
    const value = typeof item === 'string' ? item : String(item);
    return {
      value,
      label: value.startsWith('IQ-') ? getIraqGovernorateLabel(value) : value,
    };
  });
}
