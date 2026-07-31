import {
  getGovernorateMeta,
  resolveIraqGovernorate,
} from '../data/iraq-governorates';

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    .replace(/\s+/g, '');
}

/** Normalized alias token → canonical English city name. */
const IRAQ_CITY_ALIASES: Record<string, string> = {};

function registerCityAliases(tokens: string[], english: string): void {
  for (const token of tokens) {
    IRAQ_CITY_ALIASES[normalizeToken(token)] = english;
  }
}

registerCityAliases(['baghdad', 'bagdad', 'بغداد'], 'Baghdad');
registerCityAliases(['basra', 'basrah', 'albasrah', 'albasra', 'البصرة'], 'Basra');
registerCityAliases(['erbil', 'arbil', 'hawler', 'أربيل'], 'Erbil');
registerCityAliases(
  ['slemani', 'sulaymaniyah', 'alsulaymaniyah', 'السليمانية'],
  'Sulaymaniyah',
);
registerCityAliases(['mosul', 'almosul', 'الموصل'], 'Mosul');
registerCityAliases(['najaf', 'annajaf', 'النجف'], 'Najaf');
registerCityAliases(['karbala', 'kerbala', 'كربلاء'], 'Karbala');
registerCityAliases(['kirkuk', '\u0643\u0631\u0643\u0648\u0643'], 'Kirkuk');
registerCityAliases(['duhok', 'dohuk', 'dahuk', 'دهوك'], 'Duhok');
registerCityAliases(['ramadi', 'الرمادي'], 'Ramadi');
registerCityAliases(['fallujah', 'الفلوجة'], 'Fallujah');
registerCityAliases(['tikrit', '\u062a\u0643\u0631\u064a\u062a'], 'Tikrit');
registerCityAliases(['hillah', 'hilla', '\u0627\u0644\u062d\u0645\u0644\u0629', 'al hillah', 'al-hillah', 'alhillah'], 'Hillah');
registerCityAliases(['kut', 'alkut', 'الكوت'], 'Kut');
registerCityAliases(['amarah', 'amara', 'alamarah', 'alamara', 'العمارة'], 'Al Amarah');
registerCityAliases(['nasiriyah', 'nassiriya', 'الناصرية'], 'Nasiriyah');
registerCityAliases(['samawah', 'السماوة'], 'Samawah');
registerCityAliases(['diwaniyah', '\u0627\u0644\u062f\u064a\u0648\u0627\u0646\u064a\u0629'], 'Diwaniyah');

function titleCase(value: string): string {
  const cleaned = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents/diacritics (e.g. ā -> a)
    .replace(/['"‘’`´]/g, '');       // Remove quotes/apostrophes (e.g. ‘)

  return cleaned
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function resolveIraqCityLabel(raw: string): string | null {
  const token = normalizeToken(raw);
  if (!token) return null;

  const alias = IRAQ_CITY_ALIASES[token];
  if (alias) return alias;

  const governorateCode = resolveIraqGovernorate({ city: raw, region: raw });
  if (governorateCode) {
    return getGovernorateMeta(governorateCode)?.nameEn ?? null;
  }

  return null;
}

/** Canonical English city label for analytics storage and display. */
export function normalizeAnalyticsCity(
  rawCity: string | null | undefined,
  countryCode: string,
  region?: string | null,
): string {
  const code = countryCode.toUpperCase().slice(0, 2);

  for (const candidate of [rawCity, region]) {
    const value = candidate?.trim();
    if (!value) continue;

    if (code === 'IQ') {
      const iqLabel = resolveIraqCityLabel(value);
      if (iqLabel) return iqLabel;
    }

    return titleCase(value);
  }

  return '';
}
