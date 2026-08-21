import type { DnsRecordStatus, MailDomainSetup } from "@/lib/mail-domain";

export type DomainVerifyResponse = {
  domain: string;
  verified: boolean;
  waiting?: boolean;
  results: { id: string; status: DnsRecordStatus }[];
  error?: string;
};

export async function createDomainRequest(domain: string): Promise<MailDomainSetup> {
  const response = await fetch("/api/mail/domains", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ domain }),
  });
  const data = (await response.json()) as { setup?: MailDomainSetup; error?: string };
  if (!response.ok || !data.setup) {
    throw new Error(data.error || "Could not add this domain.");
  }
  return data.setup;
}

let restoreInflight: Promise<MailDomainSetup | null> | null = null;

/** Dedupes concurrent remounts (e.g. React Strict Mode) onto one network call. */
export async function restoreDomainSetupRequest(): Promise<MailDomainSetup | null> {
  if (restoreInflight) return restoreInflight;

  restoreInflight = (async () => {
    const response = await fetch("/api/mail/setup", { credentials: "include" });
    const data = (await response.json()) as { setup?: MailDomainSetup | null; error?: string };
    if (response.status === 200 && (data.setup === null || data.setup === undefined)) {
      return null;
    }
    if (!response.ok || !data.setup) {
      throw new Error(data.error || "Could not restore this domain.");
    }
    return data.setup;
  })().finally(() => {
    restoreInflight = null;
  });

  return restoreInflight;
}

export async function deleteDomainRequest(domain: string) {
  const response = await fetch(`/api/mail/domains?domain=${encodeURIComponent(domain)}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Could not remove this domain.");
  }
}

export async function verifyDomainRequest(
  domain: string,
  tokens: string[] = [],
): Promise<DomainVerifyResponse> {
  const response = await fetch("/api/mail/verify-domain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ domain, tokens }),
  });
  const data = (await response.json()) as DomainVerifyResponse & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Could not check DNS.");
  }
  return data;
}
