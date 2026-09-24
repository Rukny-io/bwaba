import { sessionFetch } from "@/lib/api-client";

export type MailAppPasswordView = {
  id: string;
  label: string;
  lastUsedAt: string | null;
  createdAt: string;
};

export type CreatedMailAppPassword = MailAppPasswordView & {
  secret: string;
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

export async function listMailAppPasswords(
  appId: string,
  mailboxId: string,
): Promise<MailAppPasswordView[]> {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/mailboxes/${encodeURIComponent(mailboxId)}/app-passwords`,
  );
  const data = await readJson<{ passwords?: MailAppPasswordView[] }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load app passwords."));
  }
  return data.passwords ?? [];
}

export async function createMailAppPassword(
  appId: string,
  mailboxId: string,
  label: string,
): Promise<CreatedMailAppPassword> {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/mailboxes/${encodeURIComponent(mailboxId)}/app-passwords`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    },
  );
  const data = await readJson<{ password?: CreatedMailAppPassword }>(response);
  if (!response.ok || !data.password) {
    throw new Error(errorMessage(data, "Could not create app password."));
  }
  return data.password;
}

export async function revokeMailAppPassword(
  appId: string,
  mailboxId: string,
  passwordId: string,
): Promise<void> {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/mailboxes/${encodeURIComponent(mailboxId)}/app-passwords/${encodeURIComponent(passwordId)}`,
    { method: "DELETE" },
  );
  const data = await readJson<Record<string, never>>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not revoke app password."));
  }
}
