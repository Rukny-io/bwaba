"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function setLocaleCookie(locale: "ar" | "en") {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

export function getAlternateLocale(current: string): "ar" | "en" {
  return current === "ar" ? "en" : "ar";
}

/** Switch locale without a full page reload */
export function switchLocale(current: string, router: AppRouterInstance) {
  const next = getAlternateLocale(current);
  setLocaleCookie(next);
  router.refresh();
}
