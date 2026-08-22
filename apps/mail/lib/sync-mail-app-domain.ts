import type { MailDomainStatus } from "@/lib/mail-domain";
import { apiFetchJson } from "@/lib/server-api";

export type NestMailDomainStatus = MailDomainStatus | "NONE";

export async function syncMailAppDomainToNest(
  appId: string,
  input: {
    primaryDomain: string | null;
    domainStatus: NestMailDomainStatus;
  },
) {
  await apiFetchJson(`/mail/apps/${encodeURIComponent(appId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      primaryDomain: input.primaryDomain,
      domainStatus: input.domainStatus,
      domainCheckedAt: new Date().toISOString(),
    }),
  });
}
