import ar from '../messages/ar.json';
import ckb from '../messages/ckb.json';
import en from '../messages/en.json';
import arProducts from '../messages/products/ar.json';
import ckbProducts from '../messages/products/ckb.json';
import enProducts from '../messages/products/en.json';

export const LOCALES = ['ar', 'en', 'ckb'] as const;
export type AppLocale = (typeof LOCALES)[number];

export type AppMessages = typeof ar & { products: typeof arProducts };

const MESSAGES: Record<AppLocale, typeof ar> = { ar, en, ckb };

const PRODUCT_MESSAGES: Record<AppLocale, typeof arProducts> = {
  ar: arProducts,
  en: enProducts,
  ckb: ckbProducts,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeDeep<T extends Record<string, unknown>>(
  base: T,
  override: Record<string, unknown>,
): T {
  const result = { ...base } as Record<string, unknown>;

  for (const key of Object.keys(override)) {
    const baseValue = base[key];
    const overrideValue = override[key];

    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = mergeDeep(baseValue, overrideValue);
      continue;
    }

    result[key] = overrideValue;
  }

  return result as T;
}

export function isAppLocale(value: string): value is AppLocale {
  return LOCALES.includes(value as AppLocale);
}

export function normalizeLocale(value: string | undefined | null): AppLocale {
  if (value && isAppLocale(value)) return value;
  return 'ar';
}

export function getMessages(locale: AppLocale): AppMessages {
  return mergeDeep(MESSAGES[locale], { products: PRODUCT_MESSAGES[locale] }) as AppMessages;
}

export function getDirection(locale: AppLocale): 'rtl' | 'ltr' {
  return locale === 'en' ? 'ltr' : 'rtl';
}

export const LOCALE_LABELS: Record<AppLocale, string> = {
  ar: 'العربية',
  en: 'English',
  ckb: 'کوردی',
};

export const LOCALE_SHORT: Record<AppLocale, string> = {
  ar: 'عربي',
  en: 'EN',
  ckb: 'کوردی',
};
