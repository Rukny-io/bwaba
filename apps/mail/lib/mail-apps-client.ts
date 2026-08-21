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
  createdAt: string;
  updatedAt: string;
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
  const response = await fetch("/api/v1/mail/apps", { credentials: "include" });
  const data = await readJson<{ apps?: MailApp[] }>(response);
  if (!response.ok) throw new Error(errorMessage(data, "Could not load Mail apps."));
  return data.apps ?? [];
}

export async function sendMailAppOtp(input: {
  phoneNumber: string;
}): Promise<{ sent: boolean; expiresInSeconds: number }> {
  const response = await fetch("/api/v1/mail/apps/otp/send", {
    method: "POST",
    credentials: "include",
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
  const response = await fetch("/api/v1/mail/apps/otp/verify", {
    method: "POST",
    credentials: "include",
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
  const response = await fetch("/api/v1/mail/apps", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ app?: MailApp }>(response);
  if (!response.ok || !data.app) {
    throw new Error(errorMessage(data, "Could not create this Mail app."));
  }
  return data.app;
}

export async function getMailApp(appId: string): Promise<MailApp> {
  const response = await fetch(`/api/v1/mail/apps/${encodeURIComponent(appId)}`, {
    credentials: "include",
  });
  const data = await readJson<{ app?: MailApp }>(response);
  if (!response.ok || !data.app) {
    throw new Error(errorMessage(data, "Mail app not found."));
  }
  return data.app;
}

export async function updateMailApp(
  appId: string,
  input: { name?: string; description?: string; primaryDomain?: string | null },
): Promise<MailApp> {
  const response = await fetch(`/api/v1/mail/apps/${encodeURIComponent(appId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await readJson<{ app?: MailApp }>(response);
  if (!response.ok || !data.app) {
    throw new Error(errorMessage(data, "Could not update this Mail app."));
  }
  return data.app;
}
