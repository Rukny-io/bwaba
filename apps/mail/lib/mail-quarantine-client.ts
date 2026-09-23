import { sessionFetch } from "@/lib/api-client";

export type MailQuarantineMessageView = {
  id: string;
  mailboxId: string;
  mailboxAddress: string;
  fromAddress: string;
  fromName: string | null;
  subject: string;
  snippet: string | null;
  quarantineReason: string | null;
  quarantineExpiresAt: string | null;
  receivedAt: string;
};

export type MailQuarantineAuditLogView = {
  id: string;
  messageId: string | null;
  action: "RELEASE" | "SPAM" | "DELETE" | "EXPIRED";
  fromAddress: string;
  subject: string;
  mailboxAddress: string;
  actor: { id: string; email: string; name?: string | null };
  createdAt: string;
};

export type MailQuarantineListResponse = {
  total: number;
  messages: MailQuarantineMessageView[];
  nextCursor: string | null;
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

function quarantineBase(appId: string) {
  return `/api/v1/mail/apps/${encodeURIComponent(appId)}/quarantine`;
}

export async function listMailQuarantine(
  appId: string,
  opts: { take?: number; cursor?: string; mailboxId?: string } = {},
): Promise<MailQuarantineListResponse> {
  const params = new URLSearchParams();
  if (opts.take) params.set("take", String(opts.take));
  if (opts.cursor) params.set("cursor", opts.cursor);
  if (opts.mailboxId) params.set("mailboxId", opts.mailboxId);
  const query = params.toString();
  const response = await sessionFetch(
    `${quarantineBase(appId)}${query ? `?${query}` : ""}`,
  );
  const data = await readJson<MailQuarantineListResponse>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load quarantine."));
  }
  return {
    total: Number(data.total) || 0,
    messages: data.messages ?? [],
    nextCursor: data.nextCursor ?? null,
  };
}

export async function listMailQuarantineAudit(
  appId: string,
  opts: { take?: number; cursor?: string } = {},
): Promise<{ logs: MailQuarantineAuditLogView[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (opts.take) params.set("take", String(opts.take));
  if (opts.cursor) params.set("cursor", opts.cursor);
  const query = params.toString();
  const response = await sessionFetch(
    `${quarantineBase(appId)}/audit${query ? `?${query}` : ""}`,
  );
  const data = await readJson<{
    logs?: MailQuarantineAuditLogView[];
    nextCursor?: string | null;
  }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load quarantine audit logs."));
  }
  return {
    logs: data.logs ?? [],
    nextCursor: data.nextCursor ?? null,
  };
}

export async function countMailQuarantine(appId: string): Promise<number> {
  const response = await sessionFetch(`${quarantineBase(appId)}/count`);
  const data = await readJson<{ total?: number }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load quarantine count."));
  }
  return Number(data.total) || 0;
}

export async function releaseQuarantineMessage(
  appId: string,
  messageId: string,
): Promise<void> {
  const response = await sessionFetch(
    `${quarantineBase(appId)}/${encodeURIComponent(messageId)}/release`,
    { method: "POST" },
  );
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not release message."));
  }
}

export async function spamQuarantineMessage(
  appId: string,
  messageId: string,
): Promise<void> {
  const response = await sessionFetch(
    `${quarantineBase(appId)}/${encodeURIComponent(messageId)}/spam`,
    { method: "POST" },
  );
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not mark message as spam."));
  }
}

export async function deleteQuarantineMessage(
  appId: string,
  messageId: string,
): Promise<void> {
  const response = await sessionFetch(
    `${quarantineBase(appId)}/${encodeURIComponent(messageId)}`,
    { method: "DELETE" },
  );
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not delete message."));
  }
}

export async function bulkQuarantineAction(
  appId: string,
  input: {
    messageIds: string[];
    action: "release" | "spam" | "delete";
  },
): Promise<{ processed: number; requested: number }> {
  const response = await sessionFetch(`${quarantineBase(appId)}/bulk`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<{
    processed?: number;
    requested?: number;
  }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not process bulk action."));
  }
  return {
    processed: Number(data.processed) || 0,
    requested: Number(data.requested) || input.messageIds.length,
  };
}
