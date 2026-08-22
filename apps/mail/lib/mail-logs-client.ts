import { sessionFetch } from "@/lib/api-client";

export type MailLogDirection = "INBOUND" | "OUTBOUND";
export type MailLogStatus = "QUEUED" | "SENT" | "FAILED" | "RECEIVED";
export type MailLogDays = 1 | 7 | 30;

export type MailLogEntry = {
  id: string;
  mailboxId: string;
  mailboxAddress: string;
  direction: MailLogDirection;
  folder: string;
  status: MailLogStatus;
  fromAddress: string;
  toAddresses: string[];
  subject: string;
  sesMessageId: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  createdAt: string;
};

export type MailLogsQuery = {
  mailboxId?: string;
  direction?: MailLogDirection;
  status?: MailLogStatus;
  q?: string;
  days?: MailLogDays;
  take?: number;
  cursor?: string;
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

export async function listMailLogs(
  appId: string,
  opts: MailLogsQuery = {},
): Promise<{ logs: MailLogEntry[]; nextCursor: string | null; days: MailLogDays }> {
  const params = new URLSearchParams();
  if (opts.mailboxId) params.set("mailboxId", opts.mailboxId);
  if (opts.direction) params.set("direction", opts.direction);
  if (opts.status) params.set("status", opts.status);
  if (opts.q) params.set("q", opts.q);
  if (opts.days) params.set("days", String(opts.days));
  if (opts.take) params.set("take", String(opts.take));
  if (opts.cursor) params.set("cursor", opts.cursor);
  const qs = params.toString();
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/logs${qs ? `?${qs}` : ""}`,
  );
  const data = await readJson<{
    logs?: MailLogEntry[];
    nextCursor?: string | null;
    days?: number;
  }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load email logs."));
  }
  const days: MailLogDays =
    data.days === 1 || data.days === 30 ? data.days : 7;
  return {
    logs: data.logs ?? [],
    nextCursor: data.nextCursor ?? null,
    days,
  };
}
