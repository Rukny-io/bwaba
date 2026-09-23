import { sessionFetch } from "@/lib/api-client";
import type { DnsRecordStatus, MailDomainSetup } from "@/lib/mail-domain";

export type DomainVerifyResponse = {
  domain: string;
  verified: boolean;
  waiting?: boolean;
  results: { id: string; status: DnsRecordStatus }[];
  error?: string;
  needsCheckout?: boolean;
  checkoutUrl?: string;
  checkoutSessionId?: string;
};

function apiErrorMessage(
  data: { error?: unknown; message?: unknown } | null,
  fallback: string,
): string {
  if (!data || typeof data !== "object") return fallback;
  const raw = data.error ?? data.message;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (Array.isArray(raw) && typeof raw[0] === "string" && raw[0].trim()) {
    return raw[0].trim();
  }
  return fallback;
}

async function readApiJson<T extends { error?: string; message?: string }>(
  response: Response,
): Promise<{ data: T; raw: string }> {
  const raw = await response.text();
  try {
    return { data: JSON.parse(raw) as T, raw };
  } catch {
    const hint =
      response.status === 502 || response.status === 503 || response.status === 504
        ? "Mail service or SES is unavailable. Check mail container logs and AWS credentials."
        : response.status === 401 || response.status === 403
          ? "Please login again, then open your workspace."
          : `Unexpected server response (${response.status}).`;
    const snippet = raw.replace(/\s+/g, " ").trim().slice(0, 180);
    throw new Error(snippet ? `${hint} ${snippet}` : hint);
  }
}

export async function createDomainRequest(domain: string): Promise<MailDomainSetup> {
  const response = await sessionFetch("/api/mail/domains", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ domain }),
  });
  const { data, raw } = await readApiJson<{
    setup?: MailDomainSetup;
    error?: string;
    message?: string;
  }>(response);
  if (!response.ok || !data.setup) {
    const fromApi = apiErrorMessage(data, "");
    if (fromApi) throw new Error(fromApi);
    const snippet = raw.replace(/\s+/g, " ").trim().slice(0, 180);
    throw new Error(
      snippet
        ? `Could not add this domain (HTTP ${response.status}): ${snippet}`
        : `Could not add this domain (HTTP ${response.status}).`,
    );
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
    const { data } = await readApiJson<{ setup?: MailDomainSetup | null; error?: string }>(
      response,
    );
    if (response.status === 200 && (data.setup === null || data.setup === undefined)) {
      return null;
    }
    if (!response.ok || !data.setup) {
      throw new Error(apiErrorMessage(data, "Could not restore this domain."));
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
  const { data } = await readApiJson<{ error?: string; message?: string }>(response);
  if (!response.ok) {
    throw new Error(apiErrorMessage(data, "Could not remove this domain."));
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
  const { data } = await readApiJson<
    DomainVerifyResponse & { error?: string; message?: string }
  >(response);
  if (!response.ok) {
    throw new Error(apiErrorMessage(data, "Could not check DNS."));
  }
  return data;
}
