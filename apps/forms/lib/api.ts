/**
 * Auth API client — uses same-origin BFF `/api/auth/*` when possible.
 */

import { resolveMediaUrl } from '@/lib/media-url';
import { createExchangeCodeOnce } from '@rukny/auth/client/oauth-exchange';

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
  requiresLinking?: boolean;
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
    const rawMessage = (data as { message?: string | string[] }).message;
    const message = Array.isArray(rawMessage)
      ? rawMessage[0]
      : rawMessage || 'Request failed';
    const error = new Error(message) as Error & {
      status: number;
      data: unknown;
    };
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

/**
 * Deduplicate one-time code exchange across React Strict Mode remounts /
 * concurrent effects. The Redis code is single-use; a second POST always 400s.
 */
export const exchangeCodeOnce = createExchangeCodeOnce(exchangeCode);

export async function logout(): Promise<void> {
  await authFetch('logout', { method: 'POST' });
}
