"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useTheme, type Theme } from "@heroui/react";
import { applyMailUiPreferences } from "@/lib/mail-preferences";

type MailThemeValue = {
  theme: Theme;
  resolvedTheme: string | undefined;
  setTheme: (theme: Theme) => void;
};

const MailThemeContext = createContext<MailThemeValue | null>(null);

/** Applies HeroUI theme class/data-theme from localStorage and shares it with Settings. */
export function ThemeSync({ children }: { children?: ReactNode }) {
  const value = useTheme("light");

  useEffect(() => {
    applyMailUiPreferences();
  }, []);

  return (
    <MailThemeContext.Provider value={value}>{children ?? null}</MailThemeContext.Provider>
  );
}

export function useMailTheme(): MailThemeValue {
  const value = useContext(MailThemeContext);
  if (!value) {
    throw new Error("useMailTheme must be used within ThemeSync.");
  }
  return value;
}
