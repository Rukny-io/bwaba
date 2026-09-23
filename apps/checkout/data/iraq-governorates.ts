export type GovernorateEntry = {
  /** Canonical value stored in addresses API */
  ar: string;
  en: string;
};

export const IRAQI_GOVERNORATES: readonly GovernorateEntry[] = [
  { ar: 'بغداد', en: 'Baghdad' },
  { ar: 'البصرة', en: 'Basra' },
  { ar: 'نينوى', en: 'Nineveh' },
  { ar: 'أربيل', en: 'Erbil' },
  { ar: 'السليمانية', en: 'Sulaymaniyah' },
  { ar: 'دهوك', en: 'Duhok' },
  { ar: 'كركوك', en: 'Kirkuk' },
  { ar: 'ديالى', en: 'Diyala' },
  { ar: 'الأنبار', en: 'Anbar' },
  { ar: 'بابل', en: 'Babylon' },
  { ar: 'كربلاء', en: 'Karbala' },
  { ar: 'النجف', en: 'Najaf' },
  { ar: 'القادسية', en: 'Qadisiyyah' },
  { ar: 'المثنى', en: 'Muthanna' },
  { ar: 'ذي قار', en: 'Dhi Qar' },
  { ar: 'ميسان', en: 'Maysan' },
  { ar: 'واسط', en: 'Wasit' },
  { ar: 'صلاح الدين', en: 'Saladin' },
];

export const DEFAULT_GOVERNORATE = IRAQI_GOVERNORATES[0];

export function governorateLabel(
  entry: GovernorateEntry,
  locale: 'ar' | 'en',
): string {
  return locale === 'en' ? entry.en : entry.ar;
}

export function governorateDisplayName(
  storedCity: string,
  locale: 'ar' | 'en',
): string {
  const match = IRAQI_GOVERNORATES.find(
    (g) => g.ar === storedCity || g.en === storedCity,
  );
  if (match) return governorateLabel(match, locale);
  return storedCity;
}
