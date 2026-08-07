/** Local service URLs when running the Forms app on loopback. */
export const LOCAL_ACCOUNTS_URL = 'http://localhost:3005';
export const LOCAL_API_BASE_URL = 'http://localhost:3001/api/v1';
export const LOCAL_FORMS_URL = 'http://localhost:3007';

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * True when Forms is served from localhost (browser) or in `next dev` (SSR).
 * Root `.env` often points at production; loopback must use local API/Accounts.
 */
export function isFormsLocalDev(hostname?: string | null): boolean {
  if (hostname) return isLoopbackHost(hostname);
  if (typeof window !== 'undefined') {
    return isLoopbackHost(window.location.hostname);
  }
  return process.env.NODE_ENV === 'development';
}

export function resolveAccountsUrl(): string {
  if (isFormsLocalDev()) return LOCAL_ACCOUNTS_URL;
  return process.env.NEXT_PUBLIC_ACCOUNTS_URL || LOCAL_ACCOUNTS_URL;
}

export function resolveApiBaseUrl(): string {
  if (isFormsLocalDev()) return LOCAL_API_BASE_URL;
  return process.env.NEXT_PUBLIC_API_URL || LOCAL_API_BASE_URL;
}

export function resolveFormsOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  if (isFormsLocalDev()) return LOCAL_FORMS_URL;
  return process.env.NEXT_PUBLIC_FORMS_URL || LOCAL_FORMS_URL;
}
