import { sessionFetch } from "@/lib/api-client";

export type MailMessageFolderApi =
  | "INBOX"
  | "SENT"
  | "DRAFTS"
  | "TRASH"
  | "SPAM"
  | "ARCHIVE";

export type MailMessageView = {
  id: string;
  mailboxId: string;
  threadId: string;
  messageId: string | null;
  inReplyTo: string | null;
  direction: "INBOUND" | "OUTBOUND";
  folder: MailMessageFolderApi;
  status: "QUEUED" | "SENT" | "FAILED" | "RECEIVED";
  from: { name?: string; email: string };
  fromAddress: string;
  fromName: string | null;
  fromAvatarUrl?: string | null;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  preview: string | null;
  unread: boolean;
  starred: boolean;
  sesMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MailFolderCounts = {
  inbox: number;
  sent: number;
  drafts: number;
  trash: number;
  spam: number;
  archive: number;
  starred: number;
};

export class MailboxLockedError extends Error {
  readonly code = "MAILBOX_LOCKED";
  constructor(message = "Unlock this mailbox to continue.") {
    super(message);
    this.name = "MailboxLockedError";
  }
}

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

function throwIfMailboxLocked(
  response: Response,
  data: { code?: string; message?: string | string[]; error?: string },
) {
  if (response.status === 403 && data.code === "MAILBOX_LOCKED") {
    throw new MailboxLockedError(
      errorMessage(data, "Unlock this mailbox to continue."),
    );
  }
}

function messagesBase(appId: string) {
  return `/api/v1/mail/apps/${encodeURIComponent(appId)}/messages`;
}

export async function listMailMessages(
  appId: string,
  opts: {
    mailboxId?: string;
    folder?: MailMessageFolderApi;
    starred?: boolean;
    take?: number;
    cursor?: string;
  } = {},
): Promise<{ messages: MailMessageView[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (opts.mailboxId) params.set("mailboxId", opts.mailboxId);
  if (opts.folder) params.set("folder", opts.folder);
  if (opts.starred) params.set("starred", "true");
  if (opts.take) params.set("take", String(opts.take));
  if (opts.cursor) params.set("cursor", opts.cursor);
  const qs = params.toString();
  const response = await sessionFetch(
    `${messagesBase(appId)}${qs ? `?${qs}` : ""}`,
  );
  const data = await readJson<{
    messages?: MailMessageView[];
    nextCursor?: string | null;
  }>(response);
  throwIfMailboxLocked(response, data);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load messages."));
  }
  return {
    messages: data.messages ?? [],
    nextCursor: data.nextCursor ?? null,
  };
}

export async function getMailMessageCounts(
  appId: string,
  mailboxId?: string,
): Promise<MailFolderCounts> {
  const params = new URLSearchParams();
  if (mailboxId) params.set("mailboxId", mailboxId);
  const qs = params.toString();
  const response = await sessionFetch(
    `${messagesBase(appId)}/counts${qs ? `?${qs}` : ""}`,
  );
  const data = await readJson<Partial<MailFolderCounts>>(response);
  throwIfMailboxLocked(response, data);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load folder counts."));
  }
  return {
    inbox: data.inbox ?? 0,
    sent: data.sent ?? 0,
    drafts: data.drafts ?? 0,
    trash: data.trash ?? 0,
    spam: data.spam ?? 0,
    archive: data.archive ?? 0,
    starred: data.starred ?? 0,
  };
}

export async function getMailMessage(
  appId: string,
  messageId: string,
): Promise<MailMessageView> {
  const response = await sessionFetch(
    `${messagesBase(appId)}/${encodeURIComponent(messageId)}`,
  );
  const data = await readJson<MailMessageView>(response);
  throwIfMailboxLocked(response, data);
  if (!response.ok || !data.id) {
    throw new Error(errorMessage(data, "Could not load message."));
  }
  return data;
}

export async function sendMailMessage(
  appId: string,
  input: {
    mailboxId: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    bodyText?: string;
    bodyHtml?: string;
    replyToMessageId?: string;
  },
): Promise<MailMessageView> {
  const response = await sessionFetch(`${messagesBase(appId)}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<MailMessageView>(response);
  throwIfMailboxLocked(response, data);
  if (!response.ok || !data.id) {
    throw new Error(errorMessage(data, "Could not send message."));
  }
  return data;
}

export async function updateMailMessage(
  appId: string,
  messageId: string,
  input: {
    isStarred?: boolean;
    isRead?: boolean;
    folder?: MailMessageFolderApi;
  },
): Promise<MailMessageView> {
  const response = await sessionFetch(
    `${messagesBase(appId)}/${encodeURIComponent(messageId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const data = await readJson<MailMessageView>(response);
  throwIfMailboxLocked(response, data);
  if (!response.ok || !data.id) {
    throw new Error(errorMessage(data, "Could not update message."));
  }
  return data;
}

export async function importInboundMailMessages(
  appId: string,
  take = 30,
): Promise<{
  bucket: string;
  stored: number;
  unmatched: number;
  missing: number;
  errors: number;
  total: number;
}> {
  const params = new URLSearchParams({ take: String(take) });
  const response = await sessionFetch(
    `${messagesBase(appId)}/import-inbound?${params.toString()}`,
    { method: "POST" },
  );
  const data = await readJson<{
    bucket?: string;
    stored?: number;
    unmatched?: number;
    missing?: number;
    errors?: number;
    total?: number;
    results?: Array<{ key: string; handled: string }>;
  }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not import inbound mail."));
  }
  // Backward compatible with older API that returned per-key results.
  if (Array.isArray(data.results)) {
    return {
      bucket: data.bucket ?? "",
      stored: data.results.filter((r) => r.handled === "stored_inbound").length,
      unmatched: data.results.filter((r) => r.handled === "no_matching_mailbox")
        .length,
      missing: data.results.filter((r) => r.handled === "s3_not_found").length,
      errors: data.results.filter((r) => r.handled === "error").length,
      total: data.results.length,
    };
  }
  return {
    bucket: data.bucket ?? "",
    stored: data.stored ?? 0,
    unmatched: data.unmatched ?? 0,
    missing: data.missing ?? 0,
    errors: data.errors ?? 0,
    total: data.total ?? 0,
  };
}
