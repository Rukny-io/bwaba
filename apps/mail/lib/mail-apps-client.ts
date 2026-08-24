import { sessionFetch } from "@/lib/api-client";

export type MailAppStatus = "ACTIVE" | "ARCHIVED";
export type MailAppType = "BUSINESS" | "CONSUMER";

export type MailApp = {
  id: string;
  appId: string;
  /** Stable per-user URL slot (/u0, /u1, …). */
  slotIndex: number;
  name: string;
  contactEmail: string | null;
  appType: MailAppType;
  description: string | null;
  status: MailAppStatus;
  primaryDomain: string | null;
  domainStatus?: "NONE" | "PENDING_DNS" | "VERIFYING" | "ACTIVE" | "FAILED";
  domainCheckedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  subscription: {
    plan: string;
    status: string;
    mailboxCount: number;
  } | null;
};

async function readJson<T>(response: Response): Promise<T & { message?: string | string[] }> {
  return (await response.json().catch(() => ({}))) as T & {
    message?: string | string[];
  };
}

function errorMessage(data: { message?: string | string[] }, fallback: string) {
  const raw = data.message;
  if (Array.isArray(raw)) return raw[0] || fallback;
  return raw || fallback;
}

export async function listMailApps(): Promise<MailApp[]> {
  const response = await sessionFetch("/api/v1/mail/apps");
  const data = await readJson<{ apps?: MailApp[] }>(response);
  if (!response.ok) throw new Error(errorMessage(data, "Could not load workspaces."));
  return data.apps ?? [];
}

export async function sendMailAppOtp(input: {
  phoneNumber: string;
}): Promise<{ sent: boolean; expiresInSeconds: number }> {
  const response = await sessionFetch("/api/v1/mail/apps/otp/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ sent?: boolean; expiresInSeconds?: number }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not send verification code"));
  }
  return {
    sent: Boolean(data.sent),
    expiresInSeconds: data.expiresInSeconds ?? 300,
  };
}

export async function verifyMailAppOtp(input: {
  phoneNumber: string;
  code: string;
}): Promise<{ verified: boolean }> {
  const response = await sessionFetch("/api/v1/mail/apps/otp/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ verified?: boolean }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Invalid verification code"));
  }
  return { verified: Boolean(data.verified) };
}

export async function createMailApp(input: {
  name: string;
  contactEmail: string;
  appType: MailAppType;
  otpCode: string;
  description?: string;
}): Promise<MailApp> {
  const response = await sessionFetch("/api/v1/mail/apps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ app?: MailApp }>(response);
  if (!response.ok || !data.app) {
    throw new Error(errorMessage(data, "Could not create this workspace."));
  }
  return data.app;
}

export async function getMailApp(appId: string): Promise<MailApp> {
  const response = await sessionFetch(`/api/v1/mail/apps/${encodeURIComponent(appId)}`);
  const data = await readJson<{ app?: MailApp }>(response);
  if (!response.ok || !data.app) {
    throw new Error(errorMessage(data, "Workspace not found."));
  }
  return data.app;
}

export async function updateMailApp(
  appId: string,
  input: {
    name?: string;
    description?: string;
    contactEmail?: string;
    primaryDomain?: string | null;
  },
): Promise<MailApp> {
  const response = await sessionFetch(`/api/v1/mail/apps/${encodeURIComponent(appId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ app?: MailApp }>(response);
  if (!response.ok || !data.app) {
    throw new Error(errorMessage(data, "Could not update this workspace."));
  }
  return data.app;
}

export async function archiveMailApp(appId: string): Promise<void> {
  const response = await sessionFetch(`/api/v1/mail/apps/${encodeURIComponent(appId)}`, {
    method: "DELETE",
  });
  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not archive this workspace."));
  }
}
