const STORAGE_KEY = "rukny-mail-pending-mailbox";

export type PendingMailboxDraft = {
  appId: string;
  domain: string;
  localPart: string;
  displayName: string;
  password: string;
};

export function writePendingMailbox(draft: PendingMailboxDraft) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Ignore quota / private mode.
  }
}

export function readPendingMailbox(appId?: string | null): PendingMailboxDraft | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingMailboxDraft;
    if (!parsed?.localPart || !parsed?.password || !parsed?.displayName) return null;
    if (appId && parsed.appId && parsed.appId !== appId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingMailbox() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export async function fulfillPendingMailbox(appId: string): Promise<boolean> {
  const pending = readPendingMailbox(appId);
  if (!pending) return false;
  const { createMailMailbox } = await import("@/lib/mail-mailboxes-client");
  await createMailMailbox(appId, {
    localPart: pending.localPart,
    password: pending.password,
    displayName: pending.displayName,
  });
  clearPendingMailbox();
  return true;
}
