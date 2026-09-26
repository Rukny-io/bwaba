import { sessionFetch } from "@/lib/api-client";
import { isValidMailAppId } from "@/lib/mail-app-id";

export type MailDomainQuota = {
  used: number;
  limit: number;
  remaining: number;
  planId: string;
  marketingNameEn: string;
  domains: string[];
  canAttach?: boolean;
};

function errorMessage(
  data: { message?: string | string[]; error?: string },
  fallback: string,
) {
  const raw = data.message ?? data.error;
  if (Array.isArray(raw)) return raw[0] || fallback;
  return raw || fallback;
}

export async function fetchMailDomainQuotaClient(
  appId: string,
  domain?: string,
): Promise<MailDomainQuota | null> {
  if (!isValidMailAppId(appId)) return null;

  const qs = domain ? `?domain=${encodeURIComponent(domain)}` : "";
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/domain-quota${qs}`,
    { headers: { Accept: "application/json" } },
  );
  const data = (await response.json().catch(() => ({}))) as MailDomainQuota & {
    message?: string;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load domain quota."));
  }
  return data;
}
