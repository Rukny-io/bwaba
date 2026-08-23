import { sessionFetch } from "@/lib/api-client";
import type { MailMailboxView } from "@/lib/mail-mailboxes-client";

async function readJson<T>(
  response: Response,
): Promise<T & { message?: string | string[]; error?: string; code?: string }> {
  return (await response.json().catch(() => ({}))) as T & {
    message?: string | string[];
    error?: string;
    code?: string;
  };
}

function errorMessage(
  data: { message?: string | string[]; error?: string },
  fallback: string,
) {
  const raw = data.message ?? data.error;
  if (Array.isArray(raw)) return raw[0] || fallback;
  return raw || fallback;
}

function sessionBase(appId: string) {
  return `/api/mail/apps/${encodeURIComponent(appId)}/mailbox-session`;
}

export async function getMailMailboxSession(
  appId: string,
): Promise<{ mailbox: MailMailboxView | null }> {
  const response = await sessionFetch(sessionBase(appId));
  const data = await readJson<{ mailbox?: MailMailboxView | null }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not check mailbox sign-in."));
  }
  return { mailbox: data.mailbox ?? null };
}

export async function unlockMailMailbox(
  appId: string,
  input: { address: string; password: string; totp?: string },
): Promise<
  | { needsTotp: true; address: string; mailbox?: undefined }
  | { needsTotp: false; mailbox: MailMailboxView }
> {
  const response = await sessionFetch(sessionBase(appId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address: input.address.trim().toLowerCase(),
      password: input.password,
      ...(input.totp ? { totp: input.totp } : {}),
    }),
  });
  const data = await readJson<{
    needsTotp?: boolean;
    address?: string;
    mailbox?: MailMailboxView;
  }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not sign in to this mailbox."));
  }
  if (data.needsTotp) {
    return {
      needsTotp: true,
      address: data.address || input.address.trim().toLowerCase(),
    };
  }
  if (!data.mailbox) {
    throw new Error("Could not sign in to this mailbox.");
  }
  return { needsTotp: false, mailbox: data.mailbox };
}

export async function lockMailMailbox(appId: string): Promise<void> {
  const response = await sessionFetch(sessionBase(appId), { method: "DELETE" });
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not sign out of this mailbox."));
  }
}
