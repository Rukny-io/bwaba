/**
 * API Client لتطبيق Accounts
 * يتصل مباشرةً بـ API backend عبر Next.js proxy أو direct URL
 */

import { resolveCrossAppForwardNext } from "./oauth-callback";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

async function apiFetch<T = unknown>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { body, headers: extraHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  if (typeof document !== "undefined" && !headers["X-Workspace-Id"]) {
    const match = document.cookie.match(
      /(?:^|; )active_workspace_id=([^;]+)/,
    );
    if (match) {
      const decoded = decodeURIComponent(match[1] ?? "");
      if (decoded && /^[A-Za-z0-9_-]+$/.test(decoded)) {
        headers["X-Workspace-Id"] = decoded;
      }
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // إرسال الكوكيز مع كل طلب
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "An unexpected error occurred") as Error & {
      status: number;
      data: typeof data;
    };
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

// ── QuickSign API ─────────────────────────────────────────────────────

export interface QuickSignRequestResponse {
  success: boolean;
  message: string;
  type: "LOGIN" | "SIGNUP";
  expiresIn: number;
}

export async function requestMagicLink(email: string): Promise<QuickSignRequestResponse> {
  return apiFetch<QuickSignRequestResponse>("/auth/quicksign/request", {
    method: "POST",
    body: { email },
  });
}

export async function resendMagicLink(email: string): Promise<QuickSignRequestResponse> {
  return apiFetch<QuickSignRequestResponse>("/auth/quicksign/resend", {
    method: "POST",
    body: { email },
  });
}

// ── OAuth Code Exchange ───────────────────────────────────────────────

export interface ExchangeCodeResponse {
  success: boolean;
  csrf_token?: string;
  expires_in?: number;
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
    username?: string;
    avatar?: string;
    profileCompleted?: boolean;
  };
  needsProfileCompletion?: boolean;
  requiresLinking?: boolean;
  requires2FA?: boolean;
  pendingSessionId?: string;
  message?: string;
}

/** sessionStorage key for magic-link signup token (never keep in URL) */
export const PROFILE_QUICKSIGN_KEY = "profile_quicksign_token";

/** Hint written after OAuth exchange when profile completion is required */
export const PROFILE_OAUTH_HINT_KEY = "profile_oauth_hint";

export type ProfileOAuthHint = { email: string; ts: number };

/** QuickSign magic-link tokens are JWTs (three dot-separated segments). */
export function isQuickSignJwt(token: string): boolean {
  return token.split(".").length === 3;
}

export async function issueOAuthCode(): Promise<{ success: boolean; code: string }> {
  const response = await fetch("/api/auth/oauth/issue-code", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      (data as { message?: string }).message || "تعذر إنشاء رمز التحويل",
    ) as Error & { status: number; data: typeof data };
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data as { success: boolean; code: string };
}

/**
 * Redirect to another app origin with a fresh one-time OAuth code (localhost / multi-app).
 */
export async function redirectToAppCallback(
  targetOrigin: string,
  nextPath: string,
): Promise<void> {
  const { code } = await issueOAuthCode();
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  let apiOrigin: string | null = null;
  try {
    apiOrigin = apiBase ? new URL(apiBase).origin : null;
  } catch {
    apiOrigin = null;
  }
  const callbackPath =
    apiOrigin && targetOrigin === apiOrigin
      ? '/api/v1/oauth/callback'
      : '/callback';
  const callback = new URL(callbackPath, targetOrigin);
  callback.searchParams.set('code', code);
  callback.searchParams.set(
    'next',
    resolveCrossAppForwardNext(nextPath, targetOrigin),
  );
  window.location.href = callback.toString();
}

export async function exchangeCode(code: string): Promise<ExchangeCodeResponse> {
  const response = await fetch("/api/auth/oauth/exchange", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      (data as { message?: string }).message || "حدث خطأ أثناء تسجيل الدخول",
    ) as Error & { status: number; data: typeof data };
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as ExchangeCodeResponse;
}

// ── 2FA API ───────────────────────────────────────────────────────────

export interface StartVerifyIdentityResponse {
  success: boolean;
  availableMethods: {
    email: boolean;
    authenticator: boolean;
    recovery: boolean;
    whatsapp?: boolean;
  };
  pendingSessionId: string | null;
  message?: string;
}

export async function startVerifyIdentity(
  email: string
): Promise<StartVerifyIdentityResponse> {
  return apiFetch<StartVerifyIdentityResponse>("/auth/2fa/start-verify-identity", {
    method: "POST",
    body: { email },
  });
}

export interface Verify2FALoginResponse {
  success: boolean;
  csrf_token?: string;
  expires_in?: number;
  user?: {
    id: string;
    email: string;
    role?: string;
    name?: string;
    username?: string;
    avatar?: string;
  };
  error?: string;
  expired?: boolean;
  blocked?: boolean;
  usedBackupCode?: boolean;
  attemptsLeft?: number;
  message?: string;
}

export async function verify2FALogin(
  pendingSessionId: string,
  token: string,
  rememberDevice?: boolean
): Promise<Verify2FALoginResponse> {
  return apiFetch<Verify2FALoginResponse>("/auth/2fa/verify-login", {
    method: "POST",
    body: { pendingSessionId, token, rememberDevice },
  });
}

export async function sendWhatsappOtp(
  pendingSessionId: string
): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>(
    "/auth/2fa/whatsapp/send-otp",
    {
      method: "POST",
      body: { pendingSessionId },
    }
  );
}


// ── Complete Profile API ──────────────────────────────────────────────

export interface CompleteProfileResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    role?: string;
    name?: string;
    username?: string;
  };
  store?: {
    id: string;
    name: string;
    slug: string;
  };
  csrf_token?: string;
  message?: string;
}

export async function completeProfile(data: {
  quickSignToken: string;
  name: string;
  username: string;
  storeCategory?: string;
  storeDescription?: string;
  employeesCount?: string;
  country?: string;
}): Promise<CompleteProfileResponse> {
  const response = await fetch("/api/auth/quicksign/complete-profile", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      (result as { message?: string }).message || "حدث خطأ",
    ) as Error & { status: number; data: typeof result };
    error.status = response.status;
    error.data = result;
    throw error;
  }
  return result as CompleteProfileResponse;
}

export async function updateProfile(data: {
  name: string;
  username: string;
  storeCategory?: string;
  storeDescription?: string;
  employeesCount?: string;
  country?: string;
}): Promise<CompleteProfileResponse> {
  // Use the Next.js proxy to ensure auth cookies are sent correctly
  const response = await fetch("/api/auth/update-profile", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      (result as { message?: string }).message || "حدث خطأ",
    ) as Error & { status: number; data: typeof result };
    error.status = response.status;
    error.data = result;
    throw error;
  }

  return result as CompleteProfileResponse;
}

export async function checkUsername(
  username: string
): Promise<{ available: boolean; username: string }> {
  return apiFetch(`/auth/quicksign/check-username/${encodeURIComponent(username)}`);
}

// ── Auth Check ────────────────────────────────────────────────────────

export interface QuickSignTokenCheck {
  valid: boolean;
  used?: boolean;
  expired?: boolean;
  type?: string | null;
  email?: string | null;
}

export async function checkQuickSignToken(
  token: string,
): Promise<QuickSignTokenCheck> {
  const response = await fetch(
    `/api/auth/quicksign/check-token?token=${encodeURIComponent(token)}`,
    { credentials: "include" },
  );
  return (await response.json().catch(() => ({
    valid: false,
  }))) as QuickSignTokenCheck;
}

export async function checkAuth(): Promise<{
  authenticated: boolean;
  rateLimited?: boolean;
  user?: ExchangeCodeResponse["user"] & { profileCompleted?: boolean };
}> {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    });
    if (response.status === 429) {
      return { authenticated: false, rateLimited: true };
    }
    if (!response.ok) {
      return { authenticated: false };
    }
    const user = (await response.json()) as ExchangeCodeResponse["user"] & {
      profileCompleted?: boolean;
    };
    return { authenticated: true, user };
  } catch {
    return { authenticated: false };
  }
}

/** Retry /me — cookies from oauth/exchange may land after the first paint */
export async function checkAuthWithRetry(
  attempts = 4,
  delayMs = 120,
): Promise<{
  authenticated: boolean;
  user?: ExchangeCodeResponse["user"] & { profileCompleted?: boolean };
}> {
  for (let i = 0; i < attempts; i++) {
    const session = await checkAuth();
    if (session.authenticated) return session;
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return { authenticated: false };
}

/** Refresh access token using the httpOnly refresh cookie (BFF proxy). */
export async function refreshSession(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Ensure a browser session exists before protected onboarding actions (e.g. 2FA).
 * Retries /me and attempts refresh once cookies may still be settling.
 */
export async function ensureAuthSession(
  attempts = 6,
  delayMs = 150,
): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    const session = await checkAuth();
    if (session.authenticated) return true;

    if (i === 2) {
      await refreshSession();
    }

    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return false;
}

export function readProfileOAuthHint(): ProfileOAuthHint | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PROFILE_OAUTH_HINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProfileOAuthHint;
    if (!parsed.email || !parsed.ts) return null;
    if (Date.now() - parsed.ts > 10 * 60 * 1000) {
      sessionStorage.removeItem(PROFILE_OAUTH_HINT_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearProfileOAuthHint(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(PROFILE_OAUTH_HINT_KEY);
  }
}

export function saveProfileOAuthHint(email: string): void {
  if (typeof window === "undefined") return;
  const payload: ProfileOAuthHint = { email, ts: Date.now() };
  sessionStorage.setItem(PROFILE_OAUTH_HINT_KEY, JSON.stringify(payload));
}

// ── 2FA Setup (Onboarding) ────────────────────────────────────────────

const TWO_FA_SETUP_CACHE_KEY = "rukny:2fa:setup";
const TWO_FA_SETUP_CACHE_TTL_MS = 25 * 60 * 1000;

interface CachedSetup2FA {
  qrCodeUrl: string;
  secret: string;
  manualEntryKey: string;
  cachedAt: number;
}

export function readCachedSetup2FA(): Pick<
  Setup2FAResponse,
  "qrCodeUrl" | "secret" | "manualEntryKey"
> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(TWO_FA_SETUP_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedSetup2FA;
    if (Date.now() - parsed.cachedAt > TWO_FA_SETUP_CACHE_TTL_MS) {
      sessionStorage.removeItem(TWO_FA_SETUP_CACHE_KEY);
      return null;
    }
    return {
      qrCodeUrl: parsed.qrCodeUrl,
      secret: parsed.secret,
      manualEntryKey: parsed.manualEntryKey,
    };
  } catch {
    return null;
  }
}

export function cacheSetup2FA(
  data: Pick<Setup2FAResponse, "qrCodeUrl" | "secret" | "manualEntryKey">,
): void {
  if (typeof window === "undefined") return;
  const payload: CachedSetup2FA = { ...data, cachedAt: Date.now() };
  sessionStorage.setItem(TWO_FA_SETUP_CACHE_KEY, JSON.stringify(payload));
}

export function clearSetup2FACache(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TWO_FA_SETUP_CACHE_KEY);
}

export interface Setup2FAResponse {
  qrCodeUrl: string;
  secret: string;
  manualEntryKey: string;
  backupCodes: string[];
}

export async function setup2FA(options?: {
  /** Skip sessionStorage cache — required for /manage so QR matches server secret */
  forceRefresh?: boolean;
}): Promise<Setup2FAResponse> {
  if (!options?.forceRefresh) {
    const cached = readCachedSetup2FA();
    if (cached?.qrCodeUrl) {
      return { ...cached, backupCodes: [] };
    }
  }

  const authed = await ensureAuthSession();
  if (!authed) {
    const error = new Error("Unauthorized") as Error & { status: number };
    error.status = 401;
    throw error;
  }

  const response = await fetch("/api/auth/2fa/setup", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      (result as { message?: string }).message || "Setup failed",
    ) as Error & { status: number; data: unknown };
    error.status = response.status;
    error.data = result;
    throw error;
  }

  const data = result as Setup2FAResponse & { qrCodeDataUrl?: string };
  const normalized = {
    qrCodeUrl: data.qrCodeUrl || data.qrCodeDataUrl || "",
    secret: data.secret,
    manualEntryKey: data.manualEntryKey || data.secret,
    backupCodes: data.backupCodes ?? [],
  };

  if (normalized.qrCodeUrl) {
    cacheSetup2FA({
      qrCodeUrl: normalized.qrCodeUrl,
      secret: normalized.secret,
      manualEntryKey: normalized.manualEntryKey,
    });
  }

  return normalized;
}

export interface Enable2FAResponse {
  success: boolean;
  backupCodes: string[];
  message: string;
}

export async function enable2FA(token: string): Promise<Enable2FAResponse> {
  const authed = await ensureAuthSession();
  if (!authed) {
    const error = new Error("Unauthorized") as Error & { status: number };
    error.status = 401;
    throw error;
  }

  const response = await fetch("/api/auth/2fa/enable", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      (result as { message?: string }).message || "Enable failed",
    ) as Error & { status: number; data: unknown };
    error.status = response.status;
    error.data = result;
    throw error;
  }

  clearSetup2FACache();
  return result as Enable2FAResponse;
}

// ── Password Auth API ─────────────────────────────────────────────────

export interface PasswordAuthResponse {
  success: boolean;
  csrf_token?: string;
  expires_in?: number;
  user?: {
    id: string;
    email: string;
    role: string;
    name?: string;
    username?: string;
    avatar?: string;
    profileCompleted?: boolean;
    emailVerified?: boolean;
  };
  needsProfileCompletion?: boolean;
  needsEmailVerification?: boolean;
  requires2FA?: boolean;
  pendingSessionId?: string;
  email?: string;
  message?: string;
}

async function passwordAuthFetch(
  path: string,
  body: unknown,
): Promise<PasswordAuthResponse> {
  const response = await fetch(`/api/auth/${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      (data as { message?: string }).message || "Request failed",
    ) as Error & { status: number; data: typeof data };
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data as PasswordAuthResponse;
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<PasswordAuthResponse> {
  return passwordAuthFetch("login", { email, password });
}

export async function registerWithPassword(
  email: string,
  password: string,
): Promise<PasswordAuthResponse> {
  return passwordAuthFetch("register", { email, password });
}

export async function forgotPassword(
  email: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      (data as { message?: string }).message || "Request failed",
    ) as Error & { status: number; data: typeof data };
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data as { success: boolean; message: string };
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch("/api/auth/reset-password", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      (data as { message?: string }).message || "Request failed",
    ) as Error & { status: number; data: typeof data };
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data as { success: boolean; message: string };
}

export interface PasswordStatus {
  hasPassword: boolean;
  passwordUpdatedAt: string | null;
  canRemove: boolean;
}

export async function fetchPasswordStatus(): Promise<PasswordStatus> {
  const response = await fetch("/api/auth/password/status", {
    method: "GET",
    credentials: "include",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      (data as { message?: string }).message || "Request failed",
    ) as Error & { status: number; data: typeof data };
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data as PasswordStatus;
}

export async function setPassword(
  password: string,
): Promise<{ success: boolean; message: string }> {
  return passwordAuthFetch("password/set", { password }) as Promise<{
    success: boolean;
    message: string;
  }>;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; message: string }> {
  return passwordAuthFetch("password/change", {
    currentPassword,
    newPassword,
  }) as Promise<{ success: boolean; message: string }>;
}

export async function removePassword(
  currentPassword: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch("/api/auth/password", {
    method: "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      (data as { message?: string }).message || "Request failed",
    ) as Error & { status: number; data: typeof data };
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data as { success: boolean; message: string };
}

export interface EmailVerificationStatus {
  email: string;
  emailVerified: boolean;
  profileCompleted: boolean;
}

export async function fetchEmailVerificationStatus(): Promise<EmailVerificationStatus> {
  const response = await fetch("/api/auth/email/status", {
    method: "GET",
    credentials: "include",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      (data as { message?: string }).message || "Request failed",
    ) as Error & { status: number; data: typeof data };
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data as EmailVerificationStatus;
}

export async function sendEmailVerification(): Promise<{
  success: boolean;
  message: string;
  email: string;
}> {
  const response = await fetch("/api/auth/email/send-verification", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      (data as { message?: string }).message || "Request failed",
    ) as Error & { status: number; data: typeof data };
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data as { success: boolean; message: string; email: string };
}

export async function verifyEmailCode(code: string): Promise<{
  success: boolean;
  message: string;
  emailVerified: boolean;
  needsProfileCompletion: boolean;
}> {
  const response = await fetch("/api/auth/email/verify", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      (data as { message?: string }).message || "Request failed",
    ) as Error & { status: number; data: typeof data };
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data as {
    success: boolean;
    message: string;
    emailVerified: boolean;
    needsProfileCompletion: boolean;
  };
}
