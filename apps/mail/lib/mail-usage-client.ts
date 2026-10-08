import { sessionFetch } from "@/lib/api-client";
import { isValidMailAppId, readMailAppIdFromDocument } from "@/lib/mail-app-id";

export type MailOutboundUsageView = {
  plan: string;
  planId: string;
  planName?: string;
  status: string;
  unified?: boolean;
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

export type MailUsageActiveLimits = {
  planId: string;
  plan: string;
  mailboxCount: number;
  unified?: boolean;
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
  activeLimits: MailUsageActiveLimits | null;
  canManageBilling: boolean;
}> {
  if (!isValidMailAppId(appId)) {
    return { usage: null, activeLimits: null, canManageBilling: false };
  }

  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/usage`,
  );
  const data = await readJson<{
    usage?: MailOutboundUsageView | null;
    activeLimits?: {
      planId?: string;
      plan?: string;
      mailboxCount?: number;
      unified?: boolean;
    } | null;
    canManageBilling?: boolean;
  }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load usage."));
  }
  const limits = data.activeLimits;
  return {
    usage: data.usage ?? null,
    activeLimits: limits
      ? {
          planId: String(limits.planId || ""),
          plan: String(limits.plan || ""),
          mailboxCount:
            typeof limits.mailboxCount === "number" ? limits.mailboxCount : 0,
          unified: Boolean(limits.unified),
        }
      : null,
    canManageBilling: Boolean(data.canManageBilling),
  };
}
