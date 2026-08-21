/**
 * Environment-aware service URL resolution.
 *
 * The monorepo root `.env` often contains production URLs. When a frontend runs
 * on loopback, we must use local service URLs instead of those baked-in values.
 */

export const LOCAL_SERVICE_URLS = {
  accounts: 'http://localhost:3005',
  apiBase: 'http://localhost:3001/api/v1',
  apiOrigin: 'http://localhost:3001',
  app: 'http://localhost:3000',
  hq: 'http://localhost:3002',
  business: 'http://localhost:3003',
  developer: 'http://localhost:3004',
  forms: 'http://localhost:3007',
  mail: 'http://localhost:3009',
  publicSite: 'http://localhost:3006',
} as const;

export type ResolveUrlOptions = {
  /** Request or window hostname; loopback forces local service URLs. */
  hostname?: string | null;
};

export function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/** Allowed redirect hostnames across dev and staging. */
export function isAllowedRedirectHost(hostname: string): boolean {
  return (
    isLoopbackHost(hostname) ||
    hostname.endsWith('.rukny.io') ||
    hostname === 'rukny.io' ||
    hostname === 'rukny.work'
  );
}

/**
 * Prefer local service URLs when the UI is served from loopback, even if env
 * vars point at production.
 */
export function shouldUseLocalServiceUrls(options?: ResolveUrlOptions): boolean {
  const hostname = options?.hostname;
  if (hostname) return isLoopbackHost(hostname);
  if (typeof window !== 'undefined') {
    return isLoopbackHost(window.location.hostname);
  }
  return process.env.NODE_ENV === 'development';
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

export function resolveAccountsUrl(options?: ResolveUrlOptions): string {
  if (shouldUseLocalServiceUrls(options)) return LOCAL_SERVICE_URLS.accounts;
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_ACCOUNTS_URL || LOCAL_SERVICE_URLS.accounts,
  );
}

export function resolveApiBaseUrl(options?: ResolveUrlOptions): string {
  if (shouldUseLocalServiceUrls(options)) return LOCAL_SERVICE_URLS.apiBase;
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_API_EXTERNAL_URL ||
      LOCAL_SERVICE_URLS.apiBase,
  );
}

export function resolveAppUrl(options?: ResolveUrlOptions): string {
  if (shouldUseLocalServiceUrls(options)) return LOCAL_SERVICE_URLS.app;
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_APP_URL || LOCAL_SERVICE_URLS.app,
  );
}

export function resolveHqUrl(options?: ResolveUrlOptions): string {
  if (shouldUseLocalServiceUrls(options)) return LOCAL_SERVICE_URLS.hq;
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_HQ_URL ||
      process.env.NEXT_PUBLIC_ADMIN_URL ||
      LOCAL_SERVICE_URLS.hq,
  );
}

export function resolveBusinessUrl(options?: ResolveUrlOptions): string {
  if (shouldUseLocalServiceUrls(options)) return LOCAL_SERVICE_URLS.business;
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_BUSINESS_URL || LOCAL_SERVICE_URLS.business,
  );
}

export function resolveDeveloperUrl(options?: ResolveUrlOptions): string {
  if (shouldUseLocalServiceUrls(options)) return LOCAL_SERVICE_URLS.developer;
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_DEVELOPERS_URL ||
      process.env.NEXT_PUBLIC_DEVELOPER_URL ||
      LOCAL_SERVICE_URLS.developer,
  );
}

export function resolveFormsUrl(options?: ResolveUrlOptions): string {
  if (shouldUseLocalServiceUrls(options)) return LOCAL_SERVICE_URLS.forms;
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_FORMS_URL || LOCAL_SERVICE_URLS.forms,
  );
}

export function resolveMailUrl(options?: ResolveUrlOptions): string {
  if (shouldUseLocalServiceUrls(options)) return LOCAL_SERVICE_URLS.mail;
  return trimTrailingSlash(
    process.env.NEXT_PUBLIC_MAIL_URL || LOCAL_SERVICE_URLS.mail,
  );
}

/** Current page origin in the browser; configured origin on SSR. */
export function resolvePageOrigin(
  localDefault: string,
  envVar?: string,
  options?: ResolveUrlOptions,
): string {
  if (typeof window !== 'undefined') return window.location.origin;

  const fromEnv = envVar ? process.env[envVar]?.trim() : undefined;
  if (fromEnv && shouldUseLocalServiceUrls(options)) {
    try {
      if (isLoopbackHost(new URL(fromEnv).hostname)) {
        return trimTrailingSlash(fromEnv);
      }
    } catch {
      /* ignore invalid env URL */
    }
  }

  if (shouldUseLocalServiceUrls(options)) return localDefault;
  return trimTrailingSlash(fromEnv || localDefault);
}
