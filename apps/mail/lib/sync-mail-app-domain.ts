import type { MailDomainStatus } from "@/lib/mail-domain";
import { apiFetchJson } from "@/lib/server-api";

export type NestMailDomainStatus = MailDomainStatus | "NONE";

export type SyncMailAppDomainResult = {
  needsCheckout?: boolean;
  checkoutUrl?: string;
  checkoutSessionId?: string;
};

export async function syncMailAppDomainToNest(
  appId: string,
  input: {
    primaryDomain: string | null;
    domainStatus: NestMailDomainStatus;
    dkimTokens?: string[];
  },
): Promise<SyncMailAppDomainResult> {
  const result = await apiFetchJson<{
    needsCheckout?: boolean;
    checkoutUrl?: string;
    checkoutSessionId?: string;
  }>(`/mail/apps/${encodeURIComponent(appId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      primaryDomain: input.primaryDomain,
      domainStatus: input.domainStatus,
      domainCheckedAt: new Date().toISOString(),
      ...(input.dkimTokens?.length ? { dkimTokens: input.dkimTokens } : {}),
    }),
  });

  if (!result.ok) {
    throw new Error(result.error);
  }

  return {
    needsCheckout: Boolean(result.data.needsCheckout),
    checkoutUrl:
      typeof result.data.checkoutUrl === "string"
        ? result.data.checkoutUrl
        : undefined,
    checkoutSessionId:
      typeof result.data.checkoutSessionId === "string"
        ? result.data.checkoutSessionId
        : undefined,
  };
}

export async function fetchMailDomainQuota(
  appId: string,
  domain?: string,
): Promise<{
  used: number;
  limit: number;
  remaining: number;
  planId: string;
  marketingNameEn: string;
  domains: string[];
  canAttach?: boolean;
}> {
  const path = domain
    ? `/mail/apps/${encodeURIComponent(appId)}/domain-quota?domain=${encodeURIComponent(domain)}`
    : `/mail/apps/${encodeURIComponent(appId)}/domain-quota`;
  const result = await apiFetchJson<{
    used: number;
    limit: number;
    remaining: number;
    planId: string;
    marketingNameEn: string;
    domains: string[];
    canAttach?: boolean;
  }>(path);

  if (!result.ok) {
    throw new Error(result.error);
  }

  return result.data;
}
