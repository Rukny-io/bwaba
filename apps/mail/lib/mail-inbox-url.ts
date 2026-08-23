import { withMailSlot } from "@/lib/mail-slot";

export function mailInboxHref(
  slot: number | null | undefined,
  mailboxId?: string | null,
) {
  const path = withMailSlot("/inbox", slot);
  if (!mailboxId) return path;
  return `${path}?mailbox=${encodeURIComponent(mailboxId)}`;
}

export function readMailboxQueryId(): string | null {
  if (typeof window === "undefined") return null;
  const id = new URLSearchParams(window.location.search).get("mailbox")?.trim();
  return id || null;
}

export function writeMailboxQueryId(mailboxId: string | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (mailboxId) url.searchParams.set("mailbox", mailboxId);
  else url.searchParams.delete("mailbox");
  const next = `${url.pathname}${url.search}${url.hash}`;
  if (`${url.pathname}${window.location.search}${window.location.hash}` === next) {
    return;
  }
  window.history.replaceState(null, "", next);
}
