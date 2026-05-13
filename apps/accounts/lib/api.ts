/**
 * API Client لتطبيق Accounts
 * يتصل مباشرةً بـ API backend عبر Next.js proxy أو direct URL
 */

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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // إرسال الكوكيز مع كل طلب
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "حدث خطأ غير متوقع") as Error & {
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

export async function exchangeCode(code: string): Promise<ExchangeCodeResponse> {
  return apiFetch<ExchangeCodeResponse>("/auth/oauth/exchange", {
    method: "POST",
    body: { code },
  });
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
  country?: string;
}): Promise<CompleteProfileResponse> {
  return apiFetch<CompleteProfileResponse>("/auth/quicksign/complete-profile", {
    method: "POST",
    body: data,
  });
}

export async function checkUsername(
  username: string
): Promise<{ available: boolean; username: string }> {
  return apiFetch(`/auth/quicksign/check-username/${encodeURIComponent(username)}`);
}

// ── Auth Check ────────────────────────────────────────────────────────

export async function checkAuth(): Promise<{
  authenticated: boolean;
  user?: ExchangeCodeResponse["user"];
}> {
  try {
    const user = await apiFetch<ExchangeCodeResponse["user"]>("/auth/me");
    return { authenticated: true, user };
  } catch {
    return { authenticated: false };
  }
}
