'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { applyHqTheme, readHqTheme, type HqTheme } from '@/lib/hq-theme';

type HqThemeContextValue = {
  theme: HqTheme;
  toggleTheme: () => void;
};

const HqThemeContext = createContext<HqThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<HqTheme>('light');

  useEffect(() => {
    setTheme(readHqTheme());
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      applyHqTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme],
  );

  return (
    <HqThemeContext.Provider value={value}>{children}</HqThemeContext.Provider>
  );
}

export function useHqTheme() {
  const value = useContext(HqThemeContext);
  if (!value) {
    throw new Error('useHqTheme must be used within ThemeProvider.');
  }
  return value;
}
