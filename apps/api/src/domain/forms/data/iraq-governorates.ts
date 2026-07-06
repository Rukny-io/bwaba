/** ISO 3166-2:IQ governorate codes */
export const IRAQ_GOVERNORATES = [
  { code: 'IQ-AN', nameEn: 'Anbar', nameAr: 'الأنبار' },
  { code: 'IQ-BA', nameEn: 'Basra', nameAr: 'البصرة' },
  { code: 'IQ-MU', nameEn: 'Muthanna', nameAr: 'المثنى' },
  { code: 'IQ-QA', nameEn: 'Qadisiyyah', nameAr: 'القادسية' },
  { code: 'IQ-NA', nameEn: 'Najaf', nameAr: 'النجف' },
  { code: 'IQ-AR', nameEn: 'Erbil', nameAr: 'أربيل' },
  { code: 'IQ-SU', nameEn: 'Sulaymaniyah', nameAr: 'السليمانية' },
  { code: 'IQ-NI', nameEn: 'Nineveh', nameAr: 'نينوى' },
  { code: 'IQ-DI', nameEn: 'Diyala', nameAr: 'ديالى' },
  { code: 'IQ-BG', nameEn: 'Baghdad', nameAr: 'بغداد' },
  { code: 'IQ-BB', nameEn: 'Babil', nameAr: 'بابل' },
  { code: 'IQ-KA', nameEn: 'Karbala', nameAr: 'كربلاء' },
  { code: 'IQ-DA', nameEn: 'Duhok', nameAr: 'دهوك' },
  { code: 'IQ-WA', nameEn: 'Wasit', nameAr: 'واسط' },
  { code: 'IQ-SD', nameEn: 'Saladin', nameAr: 'صلاح الدين' },
  { code: 'IQ-MA', nameEn: 'Maysan', nameAr: 'ميسان' },
  { code: 'IQ-DQ', nameEn: 'Dhi Qar', nameAr: 'ذي قار' },
  { code: 'IQ-KI', nameEn: 'Kirkuk', nameAr: 'كركوك' },
] as const;

export type IraqGovernorateCode =
  (typeof IRAQ_GOVERNORATES)[number]['code'];

const GOVERNORATE_BY_NAME = new Map<string, IraqGovernorateCode>();

for (const g of IRAQ_GOVERNORATES) {
  GOVERNORATE_BY_NAME.set(normalizeGeoToken(g.nameEn), g.code);
  GOVERNORATE_BY_NAME.set(normalizeGeoToken(g.nameAr), g.code);
}

/** geoBoundaries / GeoIP region aliases → ISO 3166-2:IQ */
const REGION_ALIASES: Record<string, IraqGovernorateCode> = {
  alanbar: 'IQ-AN',
  anbar: 'IQ-AN',
  albasrah: 'IQ-BA',
  albasra: 'IQ-BA',
  basra: 'IQ-BA',
  basrah: 'IQ-BA',
  almutanna: 'IQ-MU',
  muthanna: 'IQ-MU',
  alqadisiyah: 'IQ-QA',
  qadisiyyah: 'IQ-QA',
  diwaniyah: 'IQ-QA',
  annajaf: 'IQ-NA',
  najaf: 'IQ-NA',
  erbil: 'IQ-AR',
  arbil: 'IQ-AR',
  hawler: 'IQ-AR',
  alsulaimaniyah: 'IQ-SU',
  sulaymaniyah: 'IQ-SU',
  slemani: 'IQ-SU',
  ninawa: 'IQ-NI',
  nineveh: 'IQ-NI',
  mosul: 'IQ-NI',
  diyala: 'IQ-DI',
  baqubah: 'IQ-DI',
  baghdad: 'IQ-BG',
  babil: 'IQ-BB',
  babylon: 'IQ-BB',
  hillah: 'IQ-BB',
  karbala: 'IQ-KA',
  kerbala: 'IQ-KA',
  dohuk: 'IQ-DA',
  duhok: 'IQ-DA',
  dahuk: 'IQ-DA',
  wasit: 'IQ-WA',
  kut: 'IQ-WA',
  salahaldin: 'IQ-SD',
  salahaddin: 'IQ-SD',
  saladin: 'IQ-SD',
  tikrit: 'IQ-SD',
  maysan: 'IQ-MA',
  amarah: 'IQ-MA',
  dhiqar: 'IQ-DQ',
  nasiriyah: 'IQ-DQ',
  kirkuk: 'IQ-KI',
  ramadi: 'IQ-AN',
  fallujah: 'IQ-AN',
  samawah: 'IQ-MU',
};

function normalizeGeoToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s\u0600-\u06FF]/g, '')
    .replace(/\s+/g, '');
}

function resolveFromToken(token: string): IraqGovernorateCode | null {
  const norm = normalizeGeoToken(token);
  if (!norm) return null;

  return (
    REGION_ALIASES[norm] ??
    GOVERNORATE_BY_NAME.get(norm) ??
    null
  );
}

export function resolveIraqGovernorate(input: {
  city?: string | null;
  region?: string | null;
}): IraqGovernorateCode | null {
  // Prefer region (state/province) — usually more accurate than city for GeoIP
  for (const raw of [input.region, input.city]) {
    if (!raw) continue;
    const code = resolveFromToken(raw);
    if (code) return code;
  }

  return null;
}

export function getGovernorateMeta(code: string) {
  return IRAQ_GOVERNORATES.find((g) => g.code === code) ?? null;
}
