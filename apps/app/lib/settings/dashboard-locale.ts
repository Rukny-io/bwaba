import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_KEY,
  LOCALE_STORAGE_KEY,
  parseAppLocale,
  type AppLocale,
} from '@/lib/i18n/config';

export type DashboardLocale = AppLocale;

export const DASHBOARD_LOCALE_STORAGE_KEY = LOCALE_STORAGE_KEY;

export const DASHBOARD_LOCALE_OPTIONS: {
  id: DashboardLocale;
  label: string;
  description: string;
  available: boolean;
}[] = [
  {
    id: 'ar',
    label: 'العربية',
    description: 'واجهة لوحة التحكم بالعربية',
    available: true,
  },
  {
    id: 'en',
    label: 'English',
    description: 'English dashboard interface',
    available: true,
  },
];

function writeLocaleCookie(locale: DashboardLocale) {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE_KEY}=${locale}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function readDashboardLocale(): DashboardLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return parseAppLocale(stored);
}

export function writeDashboardLocale(locale: DashboardLocale) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  writeLocaleCookie(locale);
}
