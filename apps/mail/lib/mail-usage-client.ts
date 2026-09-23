import { sessionFetch } from "@/lib/api-client";
import { isValidMailAppId, readMailAppIdFromDocument } from "@/lib/mail-app-id";

export type MailOutboundUsageView = {
  plan: string;
  planId: string;
  status: string;
  included: number;
  used: number;
  packCredits: number;
  allowance: number;
  remaining: number;
  percentUsed: number;
  periodStart: string | null;
  periodEnd: string | null;
  packsAvailable: boolean;
  packEmails: number;
  packPriceIqd: number | null;
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

export async function fetchMailOutboundUsage(
  appId = readMailAppIdFromDocument(),
): Promise<{
  usage: MailOutboundUsageView | null;
  canManageBilling: boolean;
}> {
  if (!isValidMailAppId(appId)) {
    return { usage: null, canManageBilling: false };
  }

  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/usage`,
  );
  const data = await readJson<{
    usage?: MailOutboundUsageView | null;
    canManageBilling?: boolean;
  }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load usage."));
  }
  return {
    usage: data.usage ?? null,
    canManageBilling: Boolean(data.canManageBilling),
  };
}
