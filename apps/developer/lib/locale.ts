export type Locale = 'ar' | 'en';

export const defaultLocale: Locale = 'ar';

export function isRtlLocale(locale: Locale): boolean {
  return locale !== 'en';
}

/** Locale string for React Aria overlays (dropdowns, popovers, etc.). */
export function toAriaLocale(locale: Locale): string {
  return locale === 'ar' ? 'ar-SA' : 'en-US';
}
