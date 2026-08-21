/**
 * Session expiry / logout redirects for Mail.
 */

import {
  MAIL_BOUND_DOMAIN_COOKIE,
  MAIL_DOMAIN_MAP_COOKIE,
  MAIL_READY_APP_COOKIE,
  MAIL_READY_COOKIE,
  MAIL_SHELL_COOKIE,
} from "@/lib/ses";
import { MAIL_APP_ID_COOKIE } from "@/lib/mail-app-id";

const AUTH_REDIRECT_LOCK_KEY = "__mail_auth_redirect_lock__";

function isRedirectLocked(): boolean {
  if (typeof window === "undefined") return true;
  return Boolean(
    (window as unknown as Record<string, boolean>)[AUTH_REDIRECT_LOCK_KEY],
  );
}

function lockRedirect(): void {
  if (typeof window === "undefined") return;
  (window as unknown as Record<string, boolean>)[AUTH_REDIRECT_LOCK_KEY] = true;
}

function clearClientMailCookies() {
  const names = [
    MAIL_APP_ID_COOKIE,
    MAIL_READY_COOKIE,
    MAIL_READY_APP_COOKIE,
    MAIL_SHELL_COOKIE,
    MAIL_BOUND_DOMAIN_COOKIE,
    MAIL_DOMAIN_MAP_COOKIE,
  ];
  for (const name of names) {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

const REDIRECT_DELAY_MS = 400;

export function notifySessionExpiredAndRedirect(): void {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (path.startsWith("/login") || path.startsWith("/callback")) return;
  if (isRedirectLocked()) return;
  lockRedirect();

  clearClientMailCookies();

  const next = `${window.location.pathname}${window.location.search}`;
  window.setTimeout(() => {
    window.location.href = `/login?session=expired&next=${encodeURIComponent(next)}`;
  }, REDIRECT_DELAY_MS);
}
