import { sessionFetch } from "@/lib/api-client";
import type { DnsRecordStatus, MailDomainSetup } from "@/lib/mail-domain";

export type DomainVerifyResponse = {
  domain: string;
  verified: boolean;
  waiting?: boolean;
  results: { id: string; status: DnsRecordStatus }[];
  error?: string;
};

async function readApiJson<T extends { error?: string }>(
  response: Response,
): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    const hint =
      response.status === 502 || response.status === 503 || response.status === 504
        ? "Mail service or SES is unavailable. Check mail container logs and AWS credentials."
        : response.status === 401 || response.status === 403
          ? "Please login again, then open your Mail app."
          : `Unexpected server response (${response.status}).`;
    throw new Error(hint);
  }
}

export async function createDomainRequest(domain: string): Promise<MailDomainSetup> {
  const response = await sessionFetch("/api/mail/domains", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ domain }),
  });
  const data = await readApiJson<{ setup?: MailDomainSetup; error?: string }>(response);
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
    const response = await sessionFetch("/api/mail/setup", {
      headers: { Accept: "application/json" },
    });
    const data = await readApiJson<{ setup?: MailDomainSetup | null; error?: string }>(
      response,
    );
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
  const response = await sessionFetch(`/api/mail/domains?domain=${encodeURIComponent(domain)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  const data = await readApiJson<{ error?: string }>(response);
  if (!response.ok) {
    throw new Error(data.error || "Could not remove this domain.");
  }
}

export async function verifyDomainRequest(
  domain: string,
  tokens: string[] = [],
): Promise<DomainVerifyResponse> {
  const response = await sessionFetch("/api/mail/verify-domain", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ domain, tokens }),
  });
  const data = await readApiJson<DomainVerifyResponse & { error?: string }>(response);
  if (!response.ok) {
    throw new Error(data.error || "Could not check DNS.");
  }
  return data;
}
