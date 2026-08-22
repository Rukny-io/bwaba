import { sessionFetch } from "@/lib/api-client";

export type MailForwarderView = {
  id: string;
  mailboxId: string;
  mailboxAddress: string;
  toAddress: string;
  keepCopy: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MailForwarderListResponse = {
  domain: string | null;
  limit: number;
  used: number;
  forwarders: MailForwarderView[];
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

function forwarderBase(appId: string) {
  return `/api/v1/mail/apps/${encodeURIComponent(appId)}/forwarders`;
}

export async function listMailForwarders(
  appId: string,
): Promise<MailForwarderListResponse> {
  const response = await sessionFetch(forwarderBase(appId));
  const data = await readJson<MailForwarderListResponse>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load forwarders."));
  }
  return {
    domain: data.domain ?? null,
    limit: Number(data.limit) || 0,
    used: Number(data.used) || 0,
    forwarders: data.forwarders ?? [],
  };
}

export async function createMailForwarder(
  appId: string,
  input: { mailboxId: string; toAddress: string; keepCopy?: boolean },
): Promise<MailForwarderView> {
  const response = await sessionFetch(forwarderBase(appId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ forwarder?: MailForwarderView }>(response);
  if (!response.ok || !data.forwarder) {
    throw new Error(errorMessage(data, "Could not create forwarder."));
  }
  return data.forwarder;
}

export async function updateMailForwarder(
  appId: string,
  forwarderId: string,
  input: {
    enabled?: boolean;
    keepCopy?: boolean;
    mailboxId?: string;
    toAddress?: string;
  },
): Promise<MailForwarderView> {
  const response = await sessionFetch(
    `${forwarderBase(appId)}/${encodeURIComponent(forwarderId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const data = await readJson<{ forwarder?: MailForwarderView }>(response);
  if (!response.ok || !data.forwarder) {
    throw new Error(errorMessage(data, "Could not update forwarder."));
  }
  return data.forwarder;
}

export async function deleteMailForwarder(
  appId: string,
  forwarderId: string,
): Promise<void> {
  const response = await sessionFetch(
    `${forwarderBase(appId)}/${encodeURIComponent(forwarderId)}`,
    { method: "DELETE" },
  );
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not delete forwarder."));
  }
}
