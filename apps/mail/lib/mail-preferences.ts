/**
 * Browser-local mail UI preferences (Settings / Billing).
 * Workspace identity stays on the API; these customize the console chrome.
 */

export type MailThemePreference = "light" | "dark" | "system";
export type MailDensityPreference = "comfortable" | "compact";
export type MailLocalePreference = "en" | "ar";

export type MailUiPreferences = {
  density: MailDensityPreference;
  locale: MailLocalePreference;
  notifyNewMail: boolean;
  notifyDesktop: boolean;
  notifySound: boolean;
  defaultSignature: string;
};

export type MailBillingPreferences = {
  billingAlerts: boolean;
  receiptEmails: boolean;
  renewReminders: boolean;
};

const UI_KEY = "rukny_mail_ui_prefs_v1";
const BILLING_KEY = "rukny_mail_billing_prefs_v1";
const SIGNATURE_DEFAULT_KEY = "rukny_mail_signature_default";

const DEFAULT_UI: MailUiPreferences = {
  density: "comfortable",
  locale: "en",
  notifyNewMail: true,
  notifyDesktop: false,
  notifySound: false,
  defaultSignature: "",
};

const DEFAULT_BILLING: MailBillingPreferences = {
  billingAlerts: true,
  receiptEmails: true,
  renewReminders: true,
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function readMailUiPreferences(): MailUiPreferences {
  const prefs = readJson(UI_KEY, DEFAULT_UI);
  if (canUseStorage() && !prefs.defaultSignature) {
    try {
      const legacy = window.localStorage.getItem(SIGNATURE_DEFAULT_KEY);
      if (legacy) prefs.defaultSignature = legacy;
    } catch {
      /* ignore */
    }
  }
  return prefs;
}

export function writeMailUiPreferences(next: MailUiPreferences) {
  writeJson(UI_KEY, next);
  if (canUseStorage()) {
    try {
      if (next.defaultSignature.trim()) {
        window.localStorage.setItem(SIGNATURE_DEFAULT_KEY, next.defaultSignature.trim());
      } else {
        window.localStorage.removeItem(SIGNATURE_DEFAULT_KEY);
      }
    } catch {
      /* ignore */
    }
  }
  applyMailUiPreferences(next);
}

export function readMailBillingPreferences(): MailBillingPreferences {
  return readJson(BILLING_KEY, DEFAULT_BILLING);
}

export function writeMailBillingPreferences(next: MailBillingPreferences) {
  writeJson(BILLING_KEY, next);
}

export function applyMailUiPreferences(prefs: MailUiPreferences = readMailUiPreferences()) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.mailDensity = prefs.density;
  root.dataset.mailLocale = prefs.locale;
  // Prefer lang only — full RTL chrome lands with Arabic copy.
  root.lang = prefs.locale === "ar" ? "ar" : "en";
}
