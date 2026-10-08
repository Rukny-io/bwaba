export type AppLocale = 'ar' | 'en';

export const DEFAULT_LOCALE: AppLocale = 'ar';
export const LOCALE_STORAGE_KEY = 'rukny-app-locale';
export const LOCALE_COOKIE_KEY = 'rukny-app-locale';

export function isAppLocale(value: unknown): value is AppLocale {
  return value === 'ar' || value === 'en';
}

export function isRtlLocale(locale: AppLocale): boolean {
  return locale === 'ar';
}

export function localeDirection(locale: AppLocale): 'rtl' | 'ltr' {
  return isRtlLocale(locale) ? 'rtl' : 'ltr';
}

/** Locale string for React Aria / HeroUI overlays */
export function toAriaLocale(locale: AppLocale): string {
  return locale === 'ar' ? 'ar-IQ' : 'en-US';
}

export function toIntlLocale(locale: AppLocale): string {
  return locale === 'ar' ? 'ar-IQ' : 'en-GB';
}

export function parseAppLocale(value: string | null | undefined): AppLocale {
  return value === 'en' ? 'en' : DEFAULT_LOCALE;
}
