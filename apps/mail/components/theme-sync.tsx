"use client";

import { useTheme } from "@heroui/react";

/** Applies HeroUI theme class/data-theme from localStorage. */
export function ThemeSync() {
  useTheme("light");
  return null;
}
