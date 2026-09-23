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
    }),
  });

  if (!result.ok) {
    return {};
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
