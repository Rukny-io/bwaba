import { sessionFetch } from "@/lib/api-client";

export type MailMailboxView = {
  id: string;
  appId: string;
  localPart: string;
  domain: string;
  address: string;
  displayName: string | null;
  avatarUrl: string | null;
  hasPassword: boolean;
  totpEnabled: boolean;
  storageUsedBytes: number;
  status: "ACTIVE" | "DISABLED" | "DELETED";
  createdAt: string;
  updatedAt: string;
};

async function readJson<T>(response: Response): Promise<T & { message?: string | string[]; error?: string }> {
  return (await response.json().catch(() => ({}))) as T & {
    message?: string | string[];
    error?: string;
  };
}

function errorMessage(data: { message?: string | string[]; error?: string }, fallback: string) {
  const raw = data.message ?? data.error;
  if (Array.isArray(raw)) return raw[0] || fallback;
  return raw || fallback;
}

export async function listMailMailboxes(appId: string): Promise<MailMailboxView[]> {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/mailboxes`,
  );
  const data = await readJson<{ mailboxes?: MailMailboxView[] }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load mailboxes."));
  }
  return data.mailboxes ?? [];
}

export async function createMailMailbox(
  appId: string,
  input: { localPart: string; password: string; enable2fa?: boolean; displayName?: string },
): Promise<MailMailboxView> {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/mailboxes`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const data = await readJson<{ mailbox?: MailMailboxView }>(response);
  if (!response.ok || !data.mailbox) {
    throw new Error(errorMessage(data, "Could not create mailbox."));
  }
  return data.mailbox;
}

export async function changeMailMailboxPassword(
  appId: string,
  mailboxId: string,
  password: string,
): Promise<MailMailboxView> {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/mailboxes/${encodeURIComponent(mailboxId)}/password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    },
  );
  const data = await readJson<{ mailbox?: MailMailboxView }>(response);
  if (!response.ok || !data.mailbox) {
    throw new Error(errorMessage(data, "Could not change password."));
  }
  return data.mailbox;
}

export type MailMailboxTotpSetup = {
  qrCodeUrl: string;
  manualEntryKey: string;
};

export async function setMailMailbox2fa(
  appId: string,
  mailboxId: string,
  enabled: boolean,
): Promise<{ mailbox: MailMailboxView; setup?: MailMailboxTotpSetup }> {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/mailboxes/${encodeURIComponent(mailboxId)}/2fa`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    },
  );
  const data = await readJson<{
    mailbox?: MailMailboxView;
    setup?: MailMailboxTotpSetup;
  }>(response);
  if (!response.ok || !data.mailbox) {
    throw new Error(errorMessage(data, "Could not update 2FA."));
  }
  return { mailbox: data.mailbox, setup: data.setup };
}

export async function confirmMailMailbox2fa(
  appId: string,
  mailboxId: string,
  code: string,
): Promise<MailMailboxView> {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/mailboxes/${encodeURIComponent(mailboxId)}/2fa/confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    },
  );
  const data = await readJson<{ mailbox?: MailMailboxView }>(response);
  if (!response.ok || !data.mailbox) {
    throw new Error(errorMessage(data, "Could not confirm 2FA."));
  }
  return data.mailbox;
}

export async function deleteMailMailbox(appId: string, mailboxId: string): Promise<void> {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/mailboxes/${encodeURIComponent(mailboxId)}`,
    { method: "DELETE" },
  );
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not delete mailbox."));
  }
}

export async function uploadMailMailboxAvatar(
  appId: string,
  mailboxId: string,
  file: File,
): Promise<MailMailboxView> {
  const body = new FormData();
  body.append("file", file);
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/mailboxes/${encodeURIComponent(mailboxId)}/avatar`,
    { method: "POST", body },
  );
  const data = await readJson<{ mailbox?: MailMailboxView }>(response);
  if (!response.ok || !data.mailbox) {
    throw new Error(errorMessage(data, "Could not upload photo."));
  }
  return data.mailbox;
}

export async function removeMailMailboxAvatar(
  appId: string,
  mailboxId: string,
): Promise<MailMailboxView> {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/mailboxes/${encodeURIComponent(mailboxId)}/avatar`,
    { method: "DELETE" },
  );
  const data = await readJson<{ mailbox?: MailMailboxView }>(response);
  if (!response.ok || !data.mailbox) {
    throw new Error(errorMessage(data, "Could not remove photo."));
  }
  return data.mailbox;
}
