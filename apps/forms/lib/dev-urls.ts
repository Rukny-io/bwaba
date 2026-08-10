export {
  isLoopbackHost,
  LOCAL_SERVICE_URLS,
  resolveAccountsUrl,
  resolveApiBaseUrl,
  resolveFormsUrl,
  shouldUseLocalServiceUrls,
} from '@rukny/auth/client/env-urls';

import {
  LOCAL_SERVICE_URLS,
  resolveFormsUrl,
  shouldUseLocalServiceUrls,
} from '@rukny/auth/client/env-urls';

/** @deprecated Use `shouldUseLocalServiceUrls` */
export function isFormsLocalDev(hostname?: string | null): boolean {
  return shouldUseLocalServiceUrls({ hostname });
}

export const LOCAL_ACCOUNTS_URL = LOCAL_SERVICE_URLS.accounts;
export const LOCAL_API_BASE_URL = LOCAL_SERVICE_URLS.apiBase;
export const LOCAL_FORMS_URL = LOCAL_SERVICE_URLS.forms;

export function resolveFormsOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  if (shouldUseLocalServiceUrls()) return LOCAL_SERVICE_URLS.forms;
  return resolveFormsUrl();
}
