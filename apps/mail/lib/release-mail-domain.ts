import { deleteMailDomainBinding } from "@/lib/mail-domain-bindings";
import { syncMailAppDomainToNest } from "@/lib/sync-mail-app-domain";
import {
  mailAppOwnerKey,
  mailSetupCacheKey,
  redisDel,
} from "@/lib/redis";

export async function releaseMailDomain(
  appId: string,
  domain: string,
  userId?: string,
) {
  const normalized = domain.trim().toLowerCase();
  await deleteMailDomainBinding(appId);
  const keys = [mailSetupCacheKey(appId)];
  if (userId) {
    keys.push(`${mailAppOwnerKey(appId)}:${userId}`);
  }
  await redisDel(...keys);
  await syncMailAppDomainToNest(appId, {
    primaryDomain: null,
    domainStatus: "NONE",
    domainOwnershipToken: null,
    domainOwnershipVerifiedAt: null,
  });
}
