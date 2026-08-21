import {
  isAllowedRedirectHost,
  LOCAL_SERVICE_URLS,
  resolveAccountsUrl,
  resolveApiBaseUrl,
  resolveMailUrl,
  resolvePageOrigin,
} from "@rukny/auth/client/env-urls";

export const DEFAULT_APP_PATH = "/apps";

/** Bind / wildcard hosts that must never appear in browser redirects. */
function isUnusablePublicHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return !host || host === "0.0.0.0" || host === "::" || host === "::0";
}

/**
 * Absolute origin for server-side redirects.
 *
 * Next standalone listens on HOSTNAME=0.0.0.0; using `request.url` as the base
 * then produces Location: https://0.0.0.0:3009/... Prefer forwarded Host /
 * NEXT_PUBLIC_MAIL_URL instead.
 */
export function resolveMailRequestOrigin(request: Request): string {
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const hostHeader = request.headers.get("host")?.trim();

  let requestUrl: URL | null = null;
  try {
    requestUrl = new URL(request.url);
  } catch {
    requestUrl = null;
  }

  const proto =
    forwardedProto ||
    requestUrl?.protocol.replace(/:$/, "") ||
    "https";

  for (const candidate of [forwardedHost, hostHeader]) {
    if (!candidate) continue;
    const hostname = candidate.split(":")[0] || candidate;
    if (isUnusablePublicHost(hostname)) continue;
    return `${proto}://${candidate}`;
  }

  const configured = process.env.NEXT_PUBLIC_MAIL_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      /* ignore invalid env */
    }
  }

  if (requestUrl && !isUnusablePublicHost(requestUrl.hostname)) {
    return requestUrl.origin;
  }

  return LOCAL_SERVICE_URLS.mail;
}

export function getMailOrigin(): string {
  return resolvePageOrigin(LOCAL_SERVICE_URLS.mail, "NEXT_PUBLIC_MAIL_URL");
}

export function buildMailCallbackUrl(nextPath: string): string {
  const origin = getMailOrigin();
  const callback = new URL("/callback", origin);
  callback.searchParams.set(
    "next",
    nextPath.startsWith("/") ? nextPath : `/${nextPath}`,
  );
  return callback.toString();
}

export function getAccountsLoginUrl(nextPath = DEFAULT_APP_PATH): string {
  const returnTo = buildMailCallbackUrl(nextPath);
  const url = new URL("/login", resolveAccountsUrl());
  url.searchParams.set("next", returnTo);
  return url.toString();
}

export function getGoogleOAuthUrl(nextPath = DEFAULT_APP_PATH): string {
  const accountsOrigin = new URL(resolveAccountsUrl()).origin;
  const callbackUrl = buildMailCallbackUrl(nextPath);
  const params = new URLSearchParams({
    redirect_origin: accountsOrigin,
    next: callbackUrl,
  });
  return `${resolveApiBaseUrl()}/auth/google?${params.toString()}`;
}

export function getFacebookOAuthUrl(nextPath = DEFAULT_APP_PATH): string {
  const accountsOrigin = new URL(resolveAccountsUrl()).origin;
  const callbackUrl = buildMailCallbackUrl(nextPath);
  const params = new URLSearchParams({
    redirect_origin: accountsOrigin,
    next: callbackUrl,
  });
  return `${resolveApiBaseUrl()}/auth/facebook?${params.toString()}`;
}

export function resolveClientNext(
  nextParam: string | null,
  fallback = DEFAULT_APP_PATH,
): string {
  if (!nextParam) return fallback;
  try {
    if (nextParam.startsWith("/")) {
      if (nextParam.startsWith("/callback")) {
        const inner = new URL(nextParam, getMailOrigin()).searchParams.get("next");
        if (inner) return resolveClientNext(inner, fallback);
      }
      return nextParam;
    }
    const url = new URL(nextParam);
    if (isAllowedRedirectHost(url.hostname)) {
      if (url.pathname === "/callback") {
        const inner = url.searchParams.get("next");
        if (inner) return resolveClientNext(inner, fallback);
        return fallback;
      }
      return url.pathname + url.search;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export function resolveSafeNext(
  nextParam: string | null,
  baseUrl: string,
): string | null {
  if (!nextParam) return null;
  try {
    if (nextParam.startsWith("/")) return nextParam;
    const url = new URL(nextParam);
    const base = new URL(baseUrl);
    const host = url.hostname;
    const allowed = host === base.hostname || isAllowedRedirectHost(host);
    if (!allowed) return null;
    return url.pathname + url.search;
  } catch {
    return null;
  }
}

export { resolveMailUrl };
