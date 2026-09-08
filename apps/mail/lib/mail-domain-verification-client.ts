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

async function fileToBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
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
  if (!file.size) {
    throw new Error("Selected file is empty.");
  }
  const contentBase64 = await fileToBase64(file);
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/domain-verification/bimi/logo`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contentBase64,
        fileName: file.name || "logo.png",
        mimeType: file.type || "application/octet-stream",
      }),
    },
  );
  return parse<MailBimiSetupStatus>(response);
}
