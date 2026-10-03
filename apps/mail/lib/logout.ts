import { clearCsrfToken } from "@rukny/auth/client/csrf-cookie";
import { clearMailClientCookie } from "@/lib/mail-cookies";
import {
  MAIL_BOUND_DOMAIN_COOKIE,
  MAIL_DOMAIN_MAP_COOKIE,
  MAIL_READY_APP_COOKIE,
  MAIL_READY_COOKIE,
  MAIL_SHELL_COOKIE,
} from "@/lib/ses";
import { clearMailAppIdCookie } from "@/lib/mail-app-id";

function clearCookie(name: string) {
  clearMailClientCookie(name);
}

function clearMailSessionCookies() {
  clearMailAppIdCookie();
  clearCookie(MAIL_READY_COOKIE);
  clearCookie(MAIL_READY_APP_COOKIE);
  clearCookie(MAIL_SHELL_COOKIE);
  clearCookie(MAIL_DOMAIN_MAP_COOKIE);
  clearCookie(MAIL_BOUND_DOMAIN_COOKIE);
  clearCsrfToken();
}

/**
 * Signs out via API BFF, clears Mail session cookies, then hard-redirects to login.
 */
export async function logoutAndRedirect(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Still clear local session and leave the app.
  }

  clearMailSessionCookies();
  window.location.assign("/login?session=logout");
}
