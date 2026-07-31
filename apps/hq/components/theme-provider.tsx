'use client';

import type { ReactNode } from 'react';

/** HQ theme is toggled via `light` / `dark` on <html> (default: light). */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return children;
}
