export type DashboardLocale = 'ar' | 'en';

export const DASHBOARD_LOCALE_STORAGE_KEY = 'rukny-app-locale';

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
    description: 'English dashboard (قريباً)',
    available: false,
  },
];

export function readDashboardLocale(): DashboardLocale {
  if (typeof window === 'undefined') return 'ar';
  const stored = window.localStorage.getItem(DASHBOARD_LOCALE_STORAGE_KEY);
  return stored === 'en' ? 'en' : 'ar';
}

export function writeDashboardLocale(locale: DashboardLocale) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DASHBOARD_LOCALE_STORAGE_KEY, locale);
}
