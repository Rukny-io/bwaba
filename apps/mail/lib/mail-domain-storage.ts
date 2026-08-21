import {
  MAIL_DOMAIN_STORAGE_KEY,
  MAIL_READY_APP_COOKIE,
  MAIL_READY_COOKIE,
  MAIL_SHELL_COOKIE,
} from "@/lib/ses";
import { isValidMailAppId, readMailAppIdFromDocument } from "@/lib/mail-app-id";
import type { MailDomainSetup } from "@/lib/mail-domain";

export { MAIL_READY_APP_COOKIE };

function scopedKey(appId: string) {
  return `${MAIL_DOMAIN_STORAGE_KEY}:${appId}`;
}

function wizardDismissedKey(appId: string) {
  return `${MAIL_DOMAIN_STORAGE_KEY}:wizard-dismissed:${appId}`;
}

function resolveAppId(appId?: string | null) {
  return appId || readMailAppIdFromDocument();
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function syncReadyCookies(setup: MailDomainSetup, appId: string | null) {
  if (!isValidMailAppId(appId)) {
    clearCookie(MAIL_READY_COOKIE);
    clearCookie(MAIL_READY_APP_COOKIE);
    clearCookie(MAIL_SHELL_COOKIE);
    return;
  }

  // Any connected domain unlocks the dashboard shell (sidebar + top nav).
  setCookie(MAIL_SHELL_COOKIE, "1", 31536000);

  if (setup.status === "ACTIVE") {
    setCookie(MAIL_READY_COOKIE, "1", 31536000);
    setCookie(MAIL_READY_APP_COOKIE, appId, 31536000);
    return;
  }

  clearCookie(MAIL_READY_COOKIE);
  clearCookie(MAIL_READY_APP_COOKIE);
}

/**
 * Setup is strictly per Mail appId. Never share domain state across apps.
 */
export function readMailDomainSetup(appId?: string | null): MailDomainSetup | null {
  if (typeof window === "undefined") return null;
  try {
    const id = resolveAppId(appId);
    if (!isValidMailAppId(id)) return null;
    const scoped = window.localStorage.getItem(scopedKey(id));
    if (!scoped) return null;
    return JSON.parse(scoped) as MailDomainSetup;
  } catch {
    return null;
  }
}

export function writeMailDomainSetup(
  setup: MailDomainSetup | null,
  appId?: string | null,
) {
  if (typeof window === "undefined") return;
  const id = resolveAppId(appId);
  if (!isValidMailAppId(id)) return;

  const key = scopedKey(id);

  if (!setup) {
    window.localStorage.removeItem(key);
    window.localStorage.removeItem(wizardDismissedKey(id));
    clearCookie(MAIL_READY_COOKIE);
    clearCookie(MAIL_READY_APP_COOKIE);
    clearCookie(MAIL_SHELL_COOKIE);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(setup));
  syncReadyCookies(setup, id);
}

/** User skipped DNS verify — allow dashboard while records still propagate. */
export function isMailWizardDismissed(appId?: string | null): boolean {
  if (typeof window === "undefined") return false;
  const id = resolveAppId(appId);
  if (!isValidMailAppId(id)) return false;
  try {
    return window.localStorage.getItem(wizardDismissedKey(id)) === "1";
  } catch {
    return false;
  }
}

export function setMailWizardDismissed(dismissed: boolean, appId?: string | null) {
  if (typeof window === "undefined") return;
  const id = resolveAppId(appId);
  if (!isValidMailAppId(id)) return;
  try {
    if (dismissed) {
      window.localStorage.setItem(wizardDismissedKey(id), "1");
      setCookie(MAIL_SHELL_COOKIE, "1", 31536000);
    } else {
      window.localStorage.removeItem(wizardDismissedKey(id));
    }
  } catch {
    /* ignore */
  }
}

/** Only returns a domain already stored for this Mail app (no global cookie). */
export function getBoundDomainHint(appId?: string | null): { domain: string } | null {
  const setup = readMailDomainSetup(appId);
  if (setup?.domain) return { domain: setup.domain };
  return null;
}
