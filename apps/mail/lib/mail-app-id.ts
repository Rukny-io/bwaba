import { clearMailClientCookie, setMailClientCookie } from "@/lib/mail-cookies";

export const MAIL_APP_ID_COOKIE = "rukny_mail_app_id";
export const MAIL_APP_ID_PATTERN = /^\d{16}$/;

export function isValidMailAppId(value: string | null | undefined): value is string {
  return Boolean(value && MAIL_APP_ID_PATTERN.test(value));
}

export function readMailAppIdFromDocument(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${MAIL_APP_ID_COOKIE}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.split("=").slice(1).join("="));
  return isValidMailAppId(value) ? value : null;
}

export function writeMailAppIdCookie(appId: string) {
  if (typeof document === "undefined") return;
  if (!isValidMailAppId(appId)) return;
  setMailClientCookie(MAIL_APP_ID_COOKIE, appId, 60 * 60 * 24 * 90);
}

export function clearMailAppIdCookie() {
  clearMailClientCookie(MAIL_APP_ID_COOKIE);
}
