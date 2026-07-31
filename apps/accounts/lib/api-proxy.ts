import { NextRequest, NextResponse } from "next/server";

export const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || "http://localhost:3001";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX =
  process.env.NODE_ENV === "development" || process.env.BFF_RATE_LIMIT === "off"
    ? 0
    : 60;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 300_000);

function isRateLimited(ip: string): boolean {
  if (RATE_LIMIT_MAX === 0) return false;

  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

export const FORWARD_REQUEST_HEADERS = [
  "content-type",
  "accept",
  "accept-language",
  "cookie",
  "origin",
  "referer",
  "user-agent",
  "cf-connecting-ip",
  "x-forwarded-for",
  "x-real-ip",
  "x-forwarded-proto",
  "x-request-id",
  "x-csrf-token",
  "x-client-fingerprint",
  "sec-ch-ua",
  "sec-ch-ua-platform",
  "sec-ch-ua-mobile",
  "x-workspace-id",
];

/** Build headers for BFF → API proxying (session fingerprint, CSRF, client IP). */
export function buildProxyRequestHeaders(request: NextRequest): Headers {
  const clientIp = resolveBffClientIp(request);
  const headers = new Headers();

  for (const key of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(key);
    if (value) headers.set(key, value);
  }

  if (clientIp) {
    headers.set("x-forwarded-for", clientIp);
    headers.set("x-real-ip", clientIp);
    headers.set("cf-connecting-ip", clientIp);
  }

  return headers;
}

/** Copy API response headers (content-type, set-cookie, redirects) to the BFF response. */
export function buildProxyResponseHeaders(apiRes: Response): Headers {
  const resHeaders = new Headers();
  const ct = apiRes.headers.get("content-type");
  if (ct) resHeaders.set("content-type", ct);

  for (const cookie of apiRes.headers.getSetCookie()) {
    resHeaders.append("set-cookie", cookie);
  }

  if (apiRes.status >= 300 && apiRes.status < 400) {
    const location = apiRes.headers.get("location");
    if (location) resHeaders.set("location", location);
  }

  return resHeaders;
}

function normalizeIp(ip: string): string {
  return ip.trim().replace(/^::ffff:/i, "");
}

/** Resolve the browser IP for BFF → API proxying (OAuth IP binding, rate limits). */
function resolveBffClientIp(request: NextRequest): string | null {
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return normalizeIp(cfIp);
  const xff = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (xff) return normalizeIp(xff);
  const xri = request.headers.get("x-real-ip")?.trim();
  if (xri) return normalizeIp(xri);
  const reqIp = (request as NextRequest & { ip?: string }).ip;
  if (reqIp) return normalizeIp(reqIp);
  // Local dev: browser → Next often has no forwarded IP headers.
  // Prefer loopback so API IP binding matches the OAuth callback (::1 / 127.0.0.1).
  if (process.env.NODE_ENV !== "production") {
    return "127.0.0.1";
  }
  return null;
}

export interface ProxyConfig {
  /** Backend path prefix, e.g. "auth" → /api/v1/auth/... */
  apiPrefix: string;
  /** First path segment allow-list */
  allowedPrefixes: string[];
}

export async function proxyToBackend(
  request: NextRequest,
  pathSegments: string[],
  config: ProxyConfig,
): Promise<NextResponse> {
  const clientIp = resolveBffClientIp(request);

  if (isRateLimited(clientIp ?? "unknown")) {
    return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "content-type": "application/json", "retry-after": "60" },
    });
  }

  const path = pathSegments.join("/");
  const firstSegment = pathSegments[0]?.toLowerCase();

  if (!firstSegment || !config.allowedPrefixes.includes(firstSegment)) {
    return new NextResponse(JSON.stringify({ error: "Invalid path" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const url = new URL(`/api/v1/${config.apiPrefix}/${path}`, API_BACKEND_URL);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers = buildProxyRequestHeaders(request);

  const init: RequestInit = { method: request.method, headers, redirect: "manual" };
  if (request.method !== "GET" && request.method !== "HEAD") {
    const contentType = request.headers.get("content-type") || "";
    init.body = contentType.includes("multipart/form-data")
      ? await request.arrayBuffer()
      : await request.text();
  }

  const apiRes = await fetch(url.toString(), init);

  const resHeaders = buildProxyResponseHeaders(apiRes);

  if (apiRes.status >= 300 && apiRes.status < 400) {
    return new NextResponse(null, { status: apiRes.status, headers: resHeaders });
  }

  const body = await apiRes.arrayBuffer();
  return new NextResponse(body, { status: apiRes.status, headers: resHeaders });
}
