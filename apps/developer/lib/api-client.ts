import { notifySessionExpiredAndRedirect } from '@/lib/auth-notify';

let csrfToken: string | null = null;

export function getCsrfToken(): string | null {
  if (typeof window === 'undefined') return null;
  if (csrfToken) return csrfToken;
  const match = document.cookie.match(/(?:^|; )(?:__Secure-)?csrf_token=([^;]*)/);
  if (match) {
    csrfToken = match[1];
    return csrfToken;
  }
  return null;
}

export function setCsrfToken(token: string): void {
  if (!token) return;
  csrfToken = token;
  if (typeof window === 'undefined') return;
  const isSecure = window.location.protocol === 'https:';
  const parts = [
    `csrf_token=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${24 * 60 * 60}`,
    'SameSite=Lax',
  ];
  if (isSecure) parts.push('Secure');
  document.cookie = parts.join('; ');
}

export function clearCsrfToken(): void {
  csrfToken = null;
  if (typeof window === 'undefined') return;
  document.cookie = 'csrf_token=; Path=/; Max-Age=0; SameSite=Lax';
}

const REFRESH_STATE_KEY = '__dev_refresh_state__';

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

function handleAuthFailure(): void {
  const state = getGlobalRefreshState();
  clearCsrfToken();
  state.refreshFailed = true;
  state.refreshPromise = null;
  notifySessionExpiredAndRedirect();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function postRefresh(maxAttempts = 3): Promise<Response> {
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

    if (lastResponse.status === 401 || lastResponse.status === 403) {
      return lastResponse;
    }

    const body = await lastResponse.clone().json().catch(() => ({}));
    const message =
      typeof body?.message === 'string'
        ? body.message
        : typeof body?.error === 'string'
          ? body.error
          : '';

    if (!message.includes('TOKEN_REFRESH_IN_PROGRESS') || attempt === maxAttempts - 1) {
      return lastResponse;
    }

    await sleep(500 * (attempt + 1));
  }

  return lastResponse ?? new Response(null, { status: 500 });
}

export async function refreshOnce(): Promise<RefreshResult> {
  const state = getGlobalRefreshState();
  if (state.refreshFailed) return { success: false };
  if (state.refreshPromise) return state.refreshPromise;

  state.refreshPromise = (async (): Promise<RefreshResult> => {
    try {
      const response = await postRefresh();
      if (!response.ok) {
        if (response.status === 401) {
          handleAuthFailure();
        }
        return { success: false };
      }
      const data = await response.json();
      if (data.success && data.csrf_token) {
        setCsrfToken(data.csrf_token);
        state.refreshFailed = false;
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

  let response = await fetch(url, {
    ...rest,
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (response.status === 401) {
    const refreshed = await refreshOnce();
    if (refreshed.success) {
      const newCsrf = getCsrfToken();
      if (newCsrf && method !== 'GET') headers['X-CSRF-Token'] = newCsrf;
      response = await fetch(url, {
        ...rest,
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      });
    }
  }

  if (response.status === 401) {
    handleAuthFailure();
  }

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const raw = responseData.message;
    let errorMessage = 'حدث خطأ';
    if (Array.isArray(raw)) {
      errorMessage = raw.filter(Boolean).join(', ') || errorMessage;
    } else if (typeof raw === 'string') {
      errorMessage = raw;
    } else if (raw && typeof raw === 'object' && 'message' in raw) {
      const nested = (raw as { message?: unknown }).message;
      errorMessage =
        typeof nested === 'string'
          ? nested
          : Array.isArray(nested)
            ? nested.join(', ')
            : errorMessage;
    }
    throw new ApiException(response.status, errorMessage);
  }

  return { data: responseData as T, status: response.status };
}

async function apiMultipart<T>(
  endpoint: string,
  formData: FormData,
  method = 'POST',
): Promise<ApiResponse<T>> {
  const url = buildUrl(endpoint);
  const headers: Record<string, string> = {};
  const csrf = getCsrfToken();
  if (csrf) headers['X-CSRF-Token'] = csrf;

  let response = await fetch(url, {
    method,
    headers,
    body: formData,
    credentials: 'include',
  });

  if (response.status === 401) {
    const refreshed = await refreshOnce();
    if (refreshed.success) {
      const newCsrf = getCsrfToken();
      if (newCsrf) headers['X-CSRF-Token'] = newCsrf;
      response = await fetch(url, {
        method,
        headers,
        body: formData,
        credentials: 'include',
      });
    }
  }

  if (response.status === 401) {
    handleAuthFailure();
  }

  const responseData = await response.json().catch(() => ({}));

  if (!response.ok) {
    const raw = responseData.message;
    let errorMessage = 'حدث خطأ';
    if (Array.isArray(raw)) {
      errorMessage = raw.filter(Boolean).join(', ') || errorMessage;
    } else if (typeof raw === 'string') {
      errorMessage = raw;
    }
    throw new ApiException(response.status, errorMessage);
  }

  return { data: responseData as T, status: response.status };
}

export const api = {
  get: <T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
  ) => apiClient<T>(endpoint, { method: 'GET', params }),
  post: <T>(
    endpoint: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>,
  ) => apiClient<T>(endpoint, { method: 'POST', body, params }),
  put: <T>(
    endpoint: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>,
  ) => apiClient<T>(endpoint, { method: 'PUT', body, params }),
  patch: <T>(
    endpoint: string,
    body?: unknown,
    params?: Record<string, string | number | boolean | undefined>,
  ) => apiClient<T>(endpoint, { method: 'PATCH', body, params }),
  delete: <T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>,
  ) => apiClient<T>(endpoint, { method: 'DELETE', params }),
  postForm: <T>(endpoint: string, formData: FormData) =>
    apiMultipart<T>(endpoint, formData, 'POST'),
};
