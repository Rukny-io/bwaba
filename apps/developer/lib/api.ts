import { resolveMediaUrl } from '@/lib/media-url';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name?: string;
  username?: string;
  avatar?: string;
  profileCompleted?: boolean;
}

export interface ExchangeCodeResponse {
  success: boolean;
  user?: AuthUser;
  needsProfileCompletion?: boolean;
  requires2FA?: boolean;
  pendingSessionId?: string;
  message?: string;
}

async function authFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      (data as { message?: string }).message || 'Request failed',
    ) as Error & { status: number; data: unknown };
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const data = await authFetch<AuthUser | { user: AuthUser }>('me');
    const user =
      data && typeof data === 'object' && 'user' in data
        ? (data as { user: AuthUser }).user
        : (data as AuthUser);
    return {
      ...user,
      avatar: resolveMediaUrl(user.avatar) ?? undefined,
    };
  } catch {
    return null;
  }
}

export async function exchangeCode(code: string): Promise<ExchangeCodeResponse> {
  return authFetch<ExchangeCodeResponse>('oauth/exchange', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function logout(): Promise<void> {
  await authFetch('logout', { method: 'POST' });
}

// ── QuickSign (Magic Link) ───────────────────────────────────────────

export interface QuickSignRequestResponse {
  success: boolean;
  message: string;
  type: 'LOGIN' | 'SIGNUP';
  expiresIn: number;
}

const API_V1 = '/api/v1';

async function publicApiFetch<T>(
  endpoint: string,
  options: Omit<RequestInit, 'body'> & { body?: unknown } = {},
): Promise<T> {
  const { body, ...rest } = options;
  const response = await fetch(`${API_V1}${endpoint}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      (data as { message?: string }).message || 'حدث خطأ غير متوقع',
    ) as Error & { status: number; data: unknown };
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

export async function requestMagicLink(
  email: string,
): Promise<QuickSignRequestResponse> {
  return publicApiFetch<QuickSignRequestResponse>('/auth/quicksign/request', {
    method: 'POST',
    body: { email },
  });
}

export async function resendMagicLink(
  email: string,
): Promise<QuickSignRequestResponse> {
  return publicApiFetch<QuickSignRequestResponse>('/auth/quicksign/resend', {
    method: 'POST',
    body: { email },
  });
}
