import { sessionFetch } from "@/lib/api-client";

export type MailCatchAllView = {
  id: string;
  enabled: boolean;
  mailboxId: string;
  mailboxAddress: string;
  updatedAt: string;
};

export type MailCatchAllResponse = {
  domain: string | null;
  catchAll: MailCatchAllView | null;
};

async function readJson<T>(
  response: Response,
): Promise<T & { message?: string | string[]; error?: string }> {
  return (await response.json().catch(() => ({}))) as T & {
    message?: string | string[];
    error?: string;
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

function catchAllBase(appId: string) {
  return `/api/v1/mail/apps/${encodeURIComponent(appId)}/catch-all`;
}

export async function getMailCatchAll(appId: string): Promise<MailCatchAllResponse> {
  const response = await sessionFetch(catchAllBase(appId));
  const data = await readJson<MailCatchAllResponse>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load catch-all settings."));
  }
  return {
    domain: data.domain ?? null,
    catchAll: data.catchAll ?? null,
  };
}

export async function saveMailCatchAll(
  appId: string,
  input: { enabled: boolean; mailboxId?: string },
): Promise<MailCatchAllResponse> {
  const response = await sessionFetch(catchAllBase(appId), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<MailCatchAllResponse>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not save catch-all settings."));
  }
  return {
    domain: data.domain ?? null,
    catchAll: data.catchAll ?? null,
  };
}
