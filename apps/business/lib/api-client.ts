/**
 * API client — cookies + CSRF + refresh via Business BFF
 */

import { notifySessionExpiredAndRedirect } from '@/lib/auth-notify';
import {
  clearCsrfToken,
  getCsrfToken,
  setCsrfToken,
} from '@rukny/auth/client/csrf-cookie';

export { clearCsrfToken, getCsrfToken, setCsrfToken };

const REFRESH_STATE_KEY = '__business_refresh_state__';
const REFRESH_BLOCK_KEY = 'rukny_business_auth_block';

interface RefreshState {
  refreshFailed: boolean;
  refreshPromise: Promise<RefreshResult> | null;
}

function getGlobalRefreshState(): RefreshState {
  if (typeof window === 'undefined') {
    return { refreshFailed: false, refreshPromise: null };
  }
  const w = window as unknown as Record<string, RefreshState>;
  if (!w[REFRESH_STATE_KEY]) {
    w[REFRESH_STATE_KEY] = { refreshFailed: false, refreshPromise: null };
  }
  return w[REFRESH_STATE_KEY];
}

export interface RefreshResult {
  success: boolean;
  csrfToken?: string;
}

/** Reset client auth state after a fresh login (login page / callback). */
export function resetAuthClientState(): void {
  if (typeof window === 'undefined') return;
  clearCsrfToken();
  try {
    localStorage.removeItem(REFRESH_BLOCK_KEY);
  } catch {
    /* ignore */
  }
  const state = getGlobalRefreshState();
  state.refreshFailed = false;
  state.refreshPromise = null;
  try {
    delete (window as unknown as Record<string, unknown>)[
      '__business_auth_redirect_lock__'
    ];
  } catch {
    /* ignore */
  }
}

function isRefreshBlocked(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(REFRESH_BLOCK_KEY) === '1';
  } catch {
    return false;
  }
}

function blockRefreshAttempts(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REFRESH_BLOCK_KEY, '1');
  } catch {
    /* ignore */
  }
}

function handleAuthFailure(): void {
  const state = getGlobalRefreshState();
  clearCsrfToken();
  state.refreshFailed = true;
  state.refreshPromise = null;
  blockRefreshAttempts();
  notifySessionExpiredAndRedirect();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function extractErrorMessage(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const record = body as { message?: string | string[]; error?: string };
  const raw = record.message ?? record.error ?? '';
  return Array.isArray(raw) ? raw[0] ?? '' : raw;
}

function isTerminalSessionMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('session has been revoked') ||
    m.includes('session has expired') ||
    m.includes('session not found') ||
    m.includes('invalid token type') ||
    m.includes('missing session id') ||
    m.includes('please login again')
  );
}

async function postRefresh(maxAttempts = 2): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const csrf = getCsrfToken();
  if (csrf) headers['X-CSRF-Token'] = csrf;

  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    lastResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers,
    });

    if (lastResponse.ok) return lastResponse;

    if (
      lastResponse.status === 401 ||
      lastResponse.status === 403 ||
      lastResponse.status === 429
    ) {
      return lastResponse;
    }

    const body = await lastResponse.clone().json().catch(() => ({}));
    const message = extractErrorMessage(body);

    if (!message.includes('TOKEN_REFRESH_IN_PROGRESS') || attempt === maxAttempts - 1) {
      return lastResponse;
    }

    await sleep(500 * (attempt + 1));
  }

  return lastResponse ?? new Response(null, { status: 500 });
}

export async function refreshOnce(): Promise<RefreshResult> {
  const state = getGlobalRefreshState();
  if (state.refreshFailed || isRefreshBlocked()) return { success: false };
  if (state.refreshPromise) return state.refreshPromise;

  state.refreshPromise = (async (): Promise<RefreshResult> => {
    try {
      const response = await postRefresh();
      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403 ||
          response.status === 429
        ) {
          handleAuthFailure();
        }
        return { success: false };
      }
      const data = await response.json();
      if (data.success && data.csrf_token) {
        setCsrfToken(data.csrf_token);
        state.refreshFailed = false;
        try {
          localStorage.removeItem(REFRESH_BLOCK_KEY);
        } catch {
          /* ignore */
        }
        return { success: true, csrfToken: data.csrf_token };
      }
      handleAuthFailure();
      return { success: false };
    } catch {
      return { success: false };
    } finally {
      getGlobalRefreshState().refreshPromise = null;
    }
  })();

  return state.refreshPromise;
}

export class ApiException extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

function buildUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullPath = `/api/v1${path}`;
  if (!params || Object.keys(params).length === 0) return fullPath;
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${fullPath}?${qs}` : fullPath;
}

interface RequestConfig extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

interface ApiResponse<T> {
  data: T;
  status: number;
}

const FETCH_TIMEOUT_MS = 30_000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiException(
        408,
        'انتهت مهلة الطلب — تحقق من الاتصال وحاول مجدداً',
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function apiClient<T>(
  endpoint: string,
  config: RequestConfig = {},
): Promise<ApiResponse<T>> {
  const { body, params, headers: customHeaders, method = 'GET', ...rest } = config;
  const url = buildUrl(endpoint, params);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  const csrf = getCsrfToken();
  if (csrf && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    headers['X-CSRF-Token'] = csrf;
  }

  let response = await fetchWithTimeout(url, {
    method,
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (response.status === 401) {
    const errorBody = await response.clone().json().catch(() => null);
    const sessionMessage = extractErrorMessage(errorBody);

    if (isTerminalSessionMessage(sessionMessage)) {
      handleAuthFailure();
      throw new ApiException(401, sessionMessage || 'Session has been revoked');
    }

    if (isRefreshBlocked() || getGlobalRefreshState().refreshFailed) {
      handleAuthFailure();
      throw new ApiException(401, sessionMessage || 'Unauthorized');
    }

    const refreshed = await refreshOnce();
    if (refreshed.success) {
      const retryCsrf = getCsrfToken();
      if (retryCsrf && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
        headers['X-CSRF-Token'] = retryCsrf;
      }
      response = await fetchWithTimeout(url, {
        method,
        credentials: 'include',
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        ...rest,
      });
    } else {
      throw new ApiException(401, sessionMessage || 'Unauthorized');
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const rawMessage =
      (data as { message?: string | string[] } | null)?.message ??
      'حدث خطأ غير متوقع';
    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
    throw new ApiException(response.status, message || 'حدث خطأ غير متوقع');
  }

  return { data: data as T, status: response.status };
}

export const api = {
  get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
  ) {
    return apiClient<T>(endpoint, { method: 'GET', params });
  },
  post<T>(endpoint: string, body?: unknown) {
    return apiClient<T>(endpoint, { method: 'POST', body });
  },
  put<T>(endpoint: string, body?: unknown) {
    return apiClient<T>(endpoint, { method: 'PUT', body });
  },
  delete<T>(endpoint: string) {
    return apiClient<T>(endpoint, { method: 'DELETE' });
  },
};
