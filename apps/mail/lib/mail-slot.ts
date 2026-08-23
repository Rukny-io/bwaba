/**
 * Per-user stable URL slots: /u0/app, /u1/inbox, …
 * Slot is NOT a secret — security is session ownership of the mapped appId.
 */

export const MAIL_SLOT_PATH_RE = /^\/u(\d+)(?=\/|$)/;

export function parseMailSlot(pathname: string): number | null {
  const match = pathname.match(MAIL_SLOT_PATH_RE);
  if (!match) return null;
  const slot = Number(match[1]);
  if (!Number.isInteger(slot) || slot < 0 || slot > 10_000) return null;
  return slot;
}

export function stripMailSlotPrefix(pathname: string): string {
  const stripped = pathname.replace(MAIL_SLOT_PATH_RE, "") || "/";
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

export function mailSlotBase(slotIndex: number): string {
  return `/u${slotIndex}`;
}

export function mailSlotPath(slotIndex: number, path = "/app"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${mailSlotBase(slotIndex)}${normalized === "/" ? "/app" : normalized}`;
}

export function isMailMarketingPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/getting-started" ||
    pathname.startsWith("/getting-started/") ||
    pathname === "/faqs" ||
    pathname.startsWith("/faqs/")
  );
}

export function withMailSlot(pathname: string, slotIndex: number | null | undefined): string {
  if (slotIndex === null || slotIndex === undefined || !Number.isInteger(slotIndex)) {
    return pathname;
  }
  if (MAIL_SLOT_PATH_RE.test(pathname)) return pathname;
  // Picker / billing / marketing stay global (not under /uN).
  if (
    isMailMarketingPath(pathname) ||
    pathname === "/apps" ||
    pathname.startsWith("/apps/") ||
    pathname === "/pricing" ||
    pathname.startsWith("/pricing/")
  ) {
    return pathname;
  }
  return mailSlotPath(slotIndex, pathname);
}
