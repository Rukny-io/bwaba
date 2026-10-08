'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { I18nProvider } from '@heroui/react';
import {
  localeDirection,
  toAriaLocale,
  type AppLocale,
} from '@/lib/i18n/config';
import {
  readDashboardLocale,
  writeDashboardLocale,
  type DashboardLocale,
} from '@/lib/settings/dashboard-locale';

type LocaleContextValue = {
  locale: DashboardLocale;
  direction: 'rtl' | 'ltr';
  setLocale: (locale: DashboardLocale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const LOCALE_CHANGED_EVENT = 'rukny:locale-change';

export function AppLocaleProvider({
  children,
  initialLocale = 'ar',
}: {
  children: React.ReactNode;
  initialLocale?: DashboardLocale;
}) {
  const [locale, setLocaleState] = useState<DashboardLocale>(initialLocale);
  const direction = localeDirection(locale);

  const setLocale = useCallback((next: DashboardLocale) => {
    writeDashboardLocale(next);
    setLocaleState(next);
    window.dispatchEvent(new Event(LOCALE_CHANGED_EVENT));
    // Match apps/developer: full reload so SSR chrome/dictionaries pick up the cookie.
    window.location.reload();
  }, []);

  useEffect(() => {
    const syncLocale = () => {
      const next = readDashboardLocale();
      setLocaleState(next);
      // Keep cookie aligned with localStorage for SSR.
      writeDashboardLocale(next);
    };
    syncLocale();
    window.addEventListener('storage', syncLocale);
    window.addEventListener(LOCALE_CHANGED_EVENT, syncLocale);
    return () => {
      window.removeEventListener('storage', syncLocale);
      window.removeEventListener(LOCALE_CHANGED_EVENT, syncLocale);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    document.documentElement.dataset.dashboardLocale = locale;
  }, [direction, locale]);

  const value = useMemo(
    () => ({ locale, direction, setLocale }),
    [direction, locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>
      <I18nProvider locale={toAriaLocale(locale as AppLocale)}>
        <div dir={direction} lang={locale} className="contents" data-dashboard-locale={locale}>
          {children}
        </div>
      </I18nProvider>
    </LocaleContext.Provider>
  );
}

export function useDashboardLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useDashboardLocale must be used inside AppLocaleProvider');
  }
  return context;
}
