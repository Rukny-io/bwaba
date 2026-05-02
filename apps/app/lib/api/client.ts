/**
 * 🔌 Client-side API Client
 *
 * Cookie-only model — NO bearer tokens, NO localStorage.
 * Auth endpoints route through /api/auth/* (BFF Route Handler)
 * for reliable Set-Cookie forwarding.
 * All other /api/v1/* requests go through next.config.ts rewrites.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isUnauthorized(): boolean { return this.status === 401; }
  get isRateLimited(): boolean { return this.status === 429; }
  get isNotFound(): boolean { return this.status === 404; }
}

type FetchOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

/**
 * Resolve the correct URL for an endpoint.
 * /auth/* → /api/auth/* (BFF Route Handler)
 * everything else → /api/v1/*
 */
function resolveUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized.startsWith('/auth/') || normalized === '/auth') {
    return `/api${normalized}`;
  }
  // BFF Route Handlers (Next.js API routes)
  if (normalized.startsWith('/users/') || normalized === '/users') {
    return `/api${normalized}`;
  }
  return `/api/v1${normalized}`;
}

/**
 * Get the CSRF token from the cookie (readable by JS — not httpOnly).
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)(?:_xid|__Secure-_xid)=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { body, method = body ? 'POST' : 'GET', headers: extraHeaders, ...rest } = options;

  const headers = new Headers(extraHeaders as HeadersInit);

  if (body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  // 🔒 Forward CSRF token for mutating requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    const csrf = getCsrfToken();
    if (csrf) headers.set('x-csrf-token', csrf);
  }

  const res = await fetch(resolveUrl(path), {
    method,
    headers,
    credentials: 'include', // always send cookies
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    ...rest,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const json = await res.json();
      message = Array.isArray(json.message) ? json.message[0] : (json.message ?? message);
    } catch {
      // ignore parse error
    }
    throw new ApiError(res.status, message);
  }

  // 204 No Content — return empty object
  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}
