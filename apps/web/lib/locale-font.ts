import type { AppLocale } from '@/lib/i18n';

export type LocaleFontKind = 'arabic' | 'kurdish' | 'latin';

export function getLocaleFontKind(locale: AppLocale): LocaleFontKind {
  if (locale === 'en') return 'latin';
  if (locale === 'ckb') return 'kurdish';
  return 'arabic';
}

export function getLocaleBodyFontClass(
  locale: AppLocale,
  fonts: {
    arabic: string;
    kurdish: string;
    latin: string;
  },
): string {
  return fonts[getLocaleFontKind(locale)];
}

export function getLocaleFontUtilityClass(locale: AppLocale): string {
  const kind = getLocaleFontKind(locale);
  if (kind === 'latin') return 'font-sans';
  if (kind === 'kurdish') return 'font-kurdish';
  return 'font-arabic';
}
