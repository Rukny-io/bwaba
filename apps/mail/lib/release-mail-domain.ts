import { deleteMailDomainBinding } from "@/lib/mail-domain-bindings";
import { deleteSesDomainIdentity } from "@/lib/ses-admin";
import { syncMailAppDomainToNest } from "@/lib/sync-mail-app-domain";
import {
  mailAppOwnerKey,
  mailSetupCacheKey,
  mailSesStatusKey,
  redisDel,
} from "@/lib/redis";

export async function releaseMailDomain(
  appId: string,
  domain: string,
  userId?: string,
) {
  const normalized = domain.trim().toLowerCase();
  if (normalized) {
    await deleteSesDomainIdentity(normalized);
  }
  await deleteMailDomainBinding(appId);
  const keys = [mailSetupCacheKey(appId)];
  if (normalized) {
    keys.push(mailSesStatusKey(normalized));
  }
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
