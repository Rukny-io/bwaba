export const COUNTRY_LABELS: Record<string, { name: string; nameAr: string }> = {
  IQ: { name: 'Iraq', nameAr: 'العراق' },
  TR: { name: 'Turkey', nameAr: 'تركيا' },
  IR: { name: 'Iran', nameAr: 'إيران' },
  SA: { name: 'Saudi Arabia', nameAr: 'السعودية' },
  JO: { name: 'Jordan', nameAr: 'الأردن' },
  SY: { name: 'Syria', nameAr: 'سوريا' },
  KW: { name: 'Kuwait', nameAr: 'الكويت' },
  AE: { name: 'United Arab Emirates', nameAr: 'الإمارات' },
  QA: { name: 'Qatar', nameAr: 'قطر' },
  BH: { name: 'Bahrain', nameAr: 'البحرين' },
  OM: { name: 'Oman', nameAr: 'عُمان' },
  LB: { name: 'Lebanon', nameAr: 'لبنان' },
  PS: { name: 'Palestine', nameAr: 'فلسطين' },
  US: { name: 'United States', nameAr: 'الولايات المتحدة' },
  GB: { name: 'United Kingdom', nameAr: 'المملكة المتحدة' },
  DE: { name: 'Germany', nameAr: 'ألمانيا' },
  FR: { name: 'France', nameAr: 'فرنسا' },
  EG: { name: 'Egypt', nameAr: 'مصر' },
  XX: { name: 'Unknown', nameAr: 'غير معروف' },
};

export function countryDisplayNames(countryCode: string): {
  name: string;
  nameAr: string;
} {
  const code = countryCode.toUpperCase().slice(0, 2);
  return COUNTRY_LABELS[code] ?? { name: code, nameAr: code };
}
