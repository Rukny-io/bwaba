import { sessionFetch } from "@/lib/api-client";

export type MailAutoReplyView = {
  mailboxId: string;
  mailboxAddress: string;
  enabled: boolean;
  subject: string;
  bodyText: string;
  startsAt: string | null;
  endsAt: string | null;
  updatedAt: string | null;
};

export type MailAutoReplyListResponse = {
  allowed: boolean;
  replies: MailAutoReplyView[];
};

export type MailAutoReplySaveInput = {
  enabled: boolean;
  subject: string;
  bodyText: string;
  startsAt: string | null;
  endsAt: string | null;
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

function autoReplyBase(appId: string) {
  return `/api/v1/mail/apps/${encodeURIComponent(appId)}/auto-replies`;
}

export async function listMailAutoReplies(
  appId: string,
): Promise<MailAutoReplyListResponse> {
  const response = await sessionFetch(autoReplyBase(appId));
  const data = await readJson<MailAutoReplyListResponse>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load automatic replies."));
  }
  return {
    allowed: Boolean(data.allowed),
    replies: data.replies ?? [],
  };
}

export async function saveMailAutoReply(
  appId: string,
  mailboxId: string,
  input: MailAutoReplySaveInput,
): Promise<{ allowed: boolean; reply: MailAutoReplyView }> {
  const response = await sessionFetch(
    `${autoReplyBase(appId)}/${encodeURIComponent(mailboxId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const data = await readJson<{ allowed?: boolean; reply?: MailAutoReplyView }>(
    response,
  );
  if (!response.ok || !data.reply) {
    throw new Error(errorMessage(data, "Could not save automatic reply."));
  }
  return {
    allowed: Boolean(data.allowed),
    reply: data.reply,
  };
}
