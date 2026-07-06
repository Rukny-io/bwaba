/**
 * API client for /manage — all requests go through BFF proxies.
 */

import type {
  AccountSummary,
  DeveloperAppSummary,
  LinkedProvidersStatus,
  IdentityVerificationStatus,
  IdentityDocumentSlot,
  IdentityDocumentType,
  IdentityUploadSession,
  RuknyVerifiedStatus,
  SubmitRuknyVerifiedPayload,
  OAuthProvider,
  SecurityLogsResponse,
  SubscriptionDetails,
  TwoFactorStatus,
  UpdateProfilePayload,
  UsageSummary,
  UserProfile,
  UserSession,
} from "./types";

async function manageFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  jsonBody = true,
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (jsonBody && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      (data as { message?: string }).message || "Request failed",
    ) as Error & { status: number; data: unknown };
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

// ── Profile ───────────────────────────────────────────────────────────

export async function fetchProfile(): Promise<UserProfile> {
  return manageFetch<UserProfile>("/api/user/profile");
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  return manageFetch<UserProfile>("/api/user/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ── 2FA ───────────────────────────────────────────────────────────────

export async function fetch2FAStatus(): Promise<TwoFactorStatus> {
  return manageFetch<TwoFactorStatus>("/api/auth/2fa/status");
}

export async function setup2FA(): Promise<{
  qrCodeUrl: string;
  secret: string;
  manualEntryKey: string;
  backupCodes: string[];
}> {
  return manageFetch("/api/auth/2fa/setup", { method: "POST" });
}

export async function enable2FA(token: string): Promise<{
  success: boolean;
  backupCodes: string[];
  message: string;
}> {
  return manageFetch("/api/auth/2fa/enable", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function disable2FA(token: string): Promise<{ success: boolean; message: string }> {
  return manageFetch("/api/auth/2fa/disable", {
    method: "DELETE",
    body: JSON.stringify({ token }),
  });
}

export async function regenerateBackupCodes(token: string): Promise<{
  backupCodes: string[];
}> {
  return manageFetch("/api/auth/2fa/backup-codes/regenerate", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

// ── Account Linking ───────────────────────────────────────────────────

export async function fetchLinkedProviders(): Promise<LinkedProvidersStatus> {
  return manageFetch<LinkedProvidersStatus>("/api/auth/linking/status");
}

export function initiateProviderLink(provider: OAuthProvider): void {
  const origin = encodeURIComponent(window.location.origin);
  window.location.href = `/api/auth/linking/${provider}?redirect_origin=${origin}`;
}

export async function unlinkProvider(
  provider: OAuthProvider,
): Promise<{ success: boolean; message: string }> {
  return manageFetch(`/api/auth/linking/${provider}`, { method: "DELETE" });
}

// ── Sessions ──────────────────────────────────────────────────────────

export async function fetchSessions(): Promise<UserSession[]> {
  return manageFetch<UserSession[]>("/api/user/sessions");
}

export async function revokeSession(sessionId: string): Promise<{ message: string }> {
  return manageFetch(`/api/user/sessions/${sessionId}`, { method: "DELETE" });
}

export async function revokeOtherSessions(): Promise<{ message: string }> {
  return manageFetch("/api/user/sessions", { method: "DELETE" });
}

// ── Identity (checklist prerequisite) ─────────────────────────────────

export async function fetchIdentityStatus(): Promise<IdentityVerificationStatus> {
  return manageFetch<IdentityVerificationStatus>("/api/auth/identity/status");
}

export async function createIdentityUploadSession(): Promise<IdentityUploadSession> {
  return manageFetch<IdentityUploadSession>("/api/auth/identity/upload/session", {
    method: "POST",
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Failed to read file"));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadIdentityFile(payload: {
  sessionId: string;
  slot: IdentityDocumentSlot;
  file: File;
}): Promise<{ slot: string; key: string; uploaded: boolean }> {
  const image = await readFileAsDataUrl(payload.file);
  return manageFetch("/api/auth/identity/upload/data", {
    method: "POST",
    body: JSON.stringify({
      sessionId: payload.sessionId,
      slot: payload.slot,
      image,
    }),
  });
}

/** @deprecated Browser→S3 presigned PUT blocked by S3 CORS — use uploadIdentityFile */
export async function presignIdentityUpload(payload: {
  sessionId: string;
  slot: IdentityDocumentSlot;
  contentType: string;
  fileName: string;
  fileSize: number;
}): Promise<{ slot: string; key: string; uploadUrl: string; expiresIn: number }> {
  return manageFetch("/api/auth/identity/upload/presign", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** @deprecated Use uploadIdentityFile — direct S3 PUT fails without bucket CORS */
export async function uploadIdentityFileToS3(
  uploadUrl: string,
  file: File,
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) {
    throw new Error("Upload failed");
  }
}

export async function submitIdentityVerification(payload: {
  sessionId: string;
  documentType: IdentityDocumentType;
}): Promise<{ success: boolean; message: string; status: string }> {
  return manageFetch("/api/auth/identity/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** Rukny Verified blue badge status */
export async function fetchRuknyVerifiedStatus(): Promise<RuknyVerifiedStatus> {
  return manageFetch<RuknyVerifiedStatus>("/api/auth/verified/status");
}

export async function submitRuknyVerifiedApplication(
  payload: SubmitRuknyVerifiedPayload,
): Promise<{ success: boolean; message: string; status: string }> {
  return manageFetch("/api/auth/verified/apply", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ── Subscriptions ─────────────────────────────────────────────────────

export async function fetchSubscription(): Promise<SubscriptionDetails> {
  return manageFetch<SubscriptionDetails>("/api/subscriptions/me");
}

export async function fetchUsage(): Promise<UsageSummary> {
  return manageFetch<UsageSummary>("/api/subscriptions/me/usage");
}

export async function uploadAvatar(file: File): Promise<{ key: string; url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  return manageFetch("/api/storage/avatar", { method: "POST", body: formData }, false);
}

// ── Security Logs ─────────────────────────────────────────────────────

export async function fetchSecurityLogs(
  page = 1,
  limit = 20,
): Promise<SecurityLogsResponse> {
  return manageFetch<SecurityLogsResponse>(
    `/api/user/security-logs?page=${page}&limit=${limit}`,
  );
}

export function getSecurityLogsExportUrl(format: "csv" | "json" = "csv"): string {
  return `/api/user/security-logs/export?format=${format}`;
}

export async function downloadSecurityLogsExport(
  format: "csv" | "json" = "csv",
): Promise<void> {
  const response = await fetch(getSecurityLogsExportUrl(format), {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Export failed");

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `security-logs.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── Account Lifecycle ─────────────────────────────────────────────────

export async function deleteAccount(payload: {
  confirmation: string;
  reason?: string;
}): Promise<{ message: string }> {
  return manageFetch("/api/user/account", {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
}

// ── Developer Apps ────────────────────────────────────────────────────

export async function fetchDeveloperApps(): Promise<DeveloperAppSummary[]> {
  return manageFetch<DeveloperAppSummary[]>("/api/developer/apps");
}

// ── Aggregated Summary (for hub badges) ───────────────────────────────

export async function fetchAccountSummary(): Promise<AccountSummary> {
  const [profile, sessions, linking, subscription] = await Promise.allSettled([
    fetchProfile(),
    fetchSessions(),
    fetchLinkedProviders(),
    fetchSubscription(),
  ]);

  const profileData = profile.status === "fulfilled" ? profile.value : null;
  const sessionsData = sessions.status === "fulfilled" ? sessions.value : [];
  const linkingData = linking.status === "fulfilled" ? linking.value : null;
  const subData = subscription.status === "fulfilled" ? subscription.value : null;

  let linkedMethodsCount = 0;
  if (linkingData) {
    if (linkingData.google.linked) linkedMethodsCount++;
    if (linkingData.linkedin.linked) linkedMethodsCount++;
    if (linkingData.facebook.linked) linkedMethodsCount++;
    if (linkingData.quicksign.available) linkedMethodsCount++;
  }

  return {
    twoFactorEnabled: profileData?.twoFactorEnabled ?? false,
    sessionsCount: sessionsData.length,
    linkedMethodsCount,
    plan: subData?.plan ?? "FREE",
    emailVerified: profileData?.emailVerified ?? false,
  };
}
