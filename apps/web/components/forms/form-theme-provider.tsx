'use client';

import type { ReactNode } from 'react';
import {
  getGoogleFontStylesheetUrl,
  getPageBackground,
  themeToCssVariables,
  type FormTheme,
} from '@/lib/form-theme';
import { cn } from '@/lib/utils';
import { FormThemeFontLoader } from '@/components/forms/form-theme-font-loader';

interface FormThemeProviderProps {
  theme: FormTheme;
  children: ReactNode;
  className?: string;
  embedded?: boolean;
  transparentPage?: boolean;
}

export function FormThemeProvider({
  theme,
  children,
  className,
  embedded = false,
  transparentPage = false,
}: FormThemeProviderProps) {
  const fontUrl = getGoogleFontStylesheetUrl(theme.typography.fontFamily);
  const cssVars = themeToCssVariables(theme);
  const pageBg = getPageBackground(theme);

  return (
    <>
      <FormThemeFontLoader href={fontUrl} fontFamily={theme.typography.fontFamily} />
      <div
        className={cn(
          'form-themed',
          embedded ? 'min-h-0 bg-transparent' : 'min-h-dvh',
          className,
        )}
        style={{
          ...cssVars,
          ...(embedded
            ? {}
            : {
                background: transparentPage ? 'transparent' : pageBg,
                color: theme.colors.text.body,
              }),
        }}
      >
        {children}
      </div>
    </>
  );
}
