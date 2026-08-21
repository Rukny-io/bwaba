import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_APP_PATH, resolveClientNext, resolveSafeNext } from "@/lib/auth-redirect";
import { isValidMailAppId, MAIL_APP_ID_COOKIE } from "@/lib/mail-app-id";
import { checkMailAuth } from "@/lib/middleware-auth";
import { MAIL_READY_COOKIE } from "@/lib/ses";
import {
  mailSlotPath,
  parseMailSlot,
  stripMailSlotPrefix,
} from "@/lib/mail-slot";
import {
  buildSlotMap,
  getCachedUserSlotMap,
  resolveAppIdFromSlot,
  setCachedUserSlotMap,
  type MailSlotMap,
} from "@/lib/mail-slot-map";

const AUTH_PAGES = ["/login", "/callback"];
const PUBLIC_PREFIXES = ["/login", "/callback"];
const APP_PICKER_PREFIXES = ["/apps"];
const BILLING_PREFIXES = ["/pricing"];

const DOMAIN_GATED_PREFIXES = [
  "/inbox",
  "/mailboxes",
  "/forwarders",
  "/aliases",
  "/catch-all",
  "/auto-reply",
  "/domain",
  "/devices",
  "/logs",
  "/dkim",
  "/import",
  "/ai",
  "/workflows",
  "/instagram",
  "/messenger",
];

/** Product paths that live under /u{N}/… */
const SLOTTED_PRODUCT_PREFIXES = [
  "/app",
  "/inbox",
  "/mailboxes",
  "/forwarders",
  "/aliases",
  "/catch-all",
  "/auto-reply",
  "/domain",
  "/devices",
  "/logs",
  "/dkim",
  "/import",
  "/ai",
  "/workflows",
  "/instagram",
  "/messenger",
  "/settings",
  "/tutorials",
  "/developers",
];

function matchesPrefix(pathname: string, prefixes: string[]) {
  const path = pathname.toLowerCase();
  return prefixes.some(
    (prefix) => path === prefix.toLowerCase() || path.startsWith(`${prefix.toLowerCase()}/`),
  );
}

function isDomainGated(pathname: string) {
  return DOMAIN_GATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function clearAuthCookies(response: NextResponse) {
  const names = [
    "access_token",
    "refresh_token",
    "csrf_token",
    "__Secure-access_token",
    "__Secure-refresh_token",
    "__Secure-csrf_token",
    "__Host-csrf_token",
  ];
  const domain = process.env.COOKIE_DOMAIN?.trim() || undefined;

  for (const name of names) {
    // Host-only cookies (localhost / code exchange)
    response.cookies.delete({ name, path: "/" });
    // Shared SSO cookies (Domain=.rukny.io in production)
    if (domain && !name.startsWith("__Host-")) {
      response.cookies.delete({ name, path: "/", domain });
    }
  }
  return response;
}

function redirectToApps(request: NextRequest, reason?: string) {
  const url = new URL(DEFAULT_APP_PATH, request.url);
  if (reason) url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
}

const API_BACKEND_URL =
  process.env.API_BACKEND_URL || process.env.API_URL || "http://localhost:3001";

async function loadUserSlotMap(
  request: NextRequest,
  userId: string,
): Promise<MailSlotMap | null> {
  const cached = await getCachedUserSlotMap(userId);
  if (cached) return cached;

  try {
    const res = await fetch(`${API_BACKEND_URL.replace(/\/$/, "")}/api/v1/mail/apps`, {
      headers: {
        cookie: request.headers.get("cookie") || "",
        "user-agent": request.headers.get("user-agent") || "",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      apps?: { appId: string; slotIndex: number }[];
    };
    const apps = (data.apps ?? []).filter(
      (app) => isValidMailAppId(app.appId) && Number.isInteger(app.slotIndex),
    );
    const map = buildSlotMap(apps);
    await setCachedUserSlotMap(userId, map);
    return map;
  } catch {
    return null;
  }
}

/**
 * Gate: auth → /u{N}/… slot ownership → domain ready for tools.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (matchesPrefix(pathname, PUBLIC_PREFIXES)) {
    const auth = await checkMailAuth(request);
    const isAuthPage = matchesPrefix(pathname, AUTH_PAGES);

    if (isAuthPage && auth.isAuthenticated && auth.user && pathname !== "/callback") {
      const session = request.nextUrl.searchParams.get("session");
      const nextParam = request.nextUrl.searchParams.get("next");
      const target = resolveClientNext(nextParam, DEFAULT_APP_PATH);

      if (session === "expired" || session === "invalid") {
        if (auth.tokenExpired) {
          return clearAuthCookies(NextResponse.next());
        }
        return NextResponse.next();
      }

      return NextResponse.redirect(new URL(target, request.url));
    }

    return NextResponse.next();
  }

  const auth = await checkMailAuth(request);

  if (!auth.isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    const nextTarget =
      resolveSafeNext(pathname + request.nextUrl.search, request.url) ||
      DEFAULT_APP_PATH;
    loginUrl.searchParams.set("next", nextTarget);
    if (auth.tokenExpired) {
      loginUrl.searchParams.set("session", "expired");
    }
    return NextResponse.redirect(loginUrl);
  }

  const cookieAppId = request.cookies.get(MAIL_APP_ID_COOKIE)?.value ?? "";
  const hasAppCookie = isValidMailAppId(cookieAppId);
  const isAppsArea = matchesPrefix(pathname, APP_PICKER_PREFIXES);
  const isBillingArea = matchesPrefix(pathname, BILLING_PREFIXES);
  const ready = request.cookies.get(MAIL_READY_COOKIE)?.value === "1";
  const slotFromPath = parseMailSlot(pathname);

  // Resolve /u{N}/… → rewrite to product path + bind cookie to owned appId.
  // Never fall through to Next for /uN/* — there is no filesystem route (would 404).
  if (slotFromPath !== null) {
    if (!auth.user) {
      return redirectToApps(request, "not_found");
    }

    const map = await loadUserSlotMap(request, auth.user.id);
    const appId = map ? resolveAppIdFromSlot(map, slotFromPath) : null;
    if (!appId) {
      return redirectToApps(request, "not_found");
    }

    const innerPath = stripMailSlotPrefix(pathname);
    const rewritePath =
      innerPath === "/" || innerPath === ""
        ? "/app"
        : innerPath;

    if (isDomainGated(rewritePath) && !ready) {
      return NextResponse.redirect(
        new URL(mailSlotPath(slotFromPath, "/app"), request.url),
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = rewritePath;
    const response = NextResponse.rewrite(url);
    response.cookies.set(MAIL_APP_ID_COOKIE, appId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
      sameSite: "lax",
    });
    response.headers.set("x-user-id", auth.user.id);
    response.headers.set("x-user-email", auth.user.email);
    response.headers.set("x-user-role", auth.user.role);
    response.headers.set("x-mail-app-id", appId);
    response.headers.set("x-mail-slot", String(slotFromPath));
    return response;
  }

  // Legacy unscoped product URLs → redirect into the user's slot.
  if (
    auth.user &&
    hasAppCookie &&
    SLOTTED_PRODUCT_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    const map = await loadUserSlotMap(request, auth.user.id);
    const slot = map?.apps[cookieAppId];
    if (typeof slot === "number") {
      return NextResponse.redirect(
        new URL(mailSlotPath(slot, pathname), request.url),
      );
    }
  }

  if (pathname === "/") {
    if (!hasAppCookie) return redirectToApps(request);
    if (auth.user) {
      const map = await loadUserSlotMap(request, auth.user.id);
      const slot = map?.apps[cookieAppId];
      if (typeof slot === "number") {
        return NextResponse.redirect(
          new URL(mailSlotPath(slot, "/app"), request.url),
        );
      }
    }
    return NextResponse.redirect(new URL("/app", request.url));
  }

  if (!hasAppCookie && !isAppsArea && !isBillingArea) {
    return redirectToApps(request, "app_required");
  }

  if (hasAppCookie && !ready && isDomainGated(pathname)) {
    if (auth.user) {
      const map = await loadUserSlotMap(request, auth.user.id);
      const slot = map?.apps[cookieAppId];
      if (typeof slot === "number") {
        return NextResponse.redirect(new URL(mailSlotPath(slot, "/app"), request.url));
      }
    }
    return NextResponse.redirect(new URL("/app", request.url));
  }

  const response = NextResponse.next();
  if (auth.user) {
    response.headers.set("x-user-id", auth.user.id);
    response.headers.set("x-user-email", auth.user.email);
    response.headers.set("x-user-role", auth.user.role);
  }
  if (hasAppCookie) {
    response.headers.set("x-mail-app-id", cookieAppId);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
