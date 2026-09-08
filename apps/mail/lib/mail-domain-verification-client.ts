import { sessionFetch } from "@/lib/api-client";
import type { MailBimiSetupStatus } from "@/lib/mail-domain";

export type MailDomainTrustStatus =
  | "UNVERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "REVOKED";

export type MailDomainVerificationRequest = {
  id: string;
  domain: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  mailApp: {
    domainStatus: "NONE" | "PENDING_DNS" | "VERIFYING" | "ACTIVE" | "FAILED";
    domainTrustStatus: MailDomainTrustStatus;
    domainVerifiedAt: string | null;
    domainTrustReason: string | null;
  };
};

async function parse<T>(response: Response): Promise<T> {
  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string | string[];
  };
  if (!response.ok) {
    const raw = data.message;
    throw new Error(Array.isArray(raw) ? raw[0] : raw || "Request failed");
  }
  return data;
}

export async function listDomainVerificationRequests(appId: string) {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/domain-verification`,
  );
  return parse<{ requests: MailDomainVerificationRequest[] }>(response);
}

export async function requestDomainVerification(appId: string) {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/domain-verification`,
    { method: "POST" },
  );
  return parse<{ request: MailDomainVerificationRequest }>(response);
}

export async function getBimiSetupStatus(appId: string) {
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/domain-verification/bimi`,
  );
  return parse<MailBimiSetupStatus>(response);
}

export async function uploadBimiLogo(appId: string, file: File) {
  const body = new FormData();
  body.append("file", file, file.name || "logo.png");
  const response = await sessionFetch(
    `/api/mail/apps/${encodeURIComponent(appId)}/bimi-logo`,
    { method: "POST", body },
  );
  return parse<MailBimiSetupStatus>(response);
}
