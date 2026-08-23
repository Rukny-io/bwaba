import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isAllowedRedirectHost,
  resolveAccountsUrl,
} from "@/lib/env-urls";

// المسارات العامة (لا تحتاج حماية)
const PUBLIC_PATHS = [
  "/login",
  "/check-email",
  "/choose-method",
  "/verify-2fa",
  "/callback",
  "/complete-profile",
  "/auth/verify",
];

// المسارات المحمية (تحتاج جلسة)
const PROTECTED_PATHS = ["/onboarding", "/manage", "/continue"];

function getAccessToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get("__Secure-access_token")?.value ||
    request.cookies.get("access_token")?.value
  );
}

function getRefreshToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get("__Secure-refresh_token")?.value ||
    request.cookies.get("refresh_token")?.value
  );
}

function hasSessionCookies(request: NextRequest): boolean {
  return !!(getAccessToken(request) || getRefreshToken(request));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionFlag = request.nextUrl.searchParams.get("session");

  // السماح بالملفات الثابتة والـ API
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") // favicon, images, etc.
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip")?.trim() ||
      (request as NextRequest & { ip?: string }).ip;
    if (clientIp) {
      const normalized = clientIp.replace(/^::ffff:/i, "");
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-forwarded-for", normalized);
      requestHeaders.set("x-real-ip", normalized);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    return NextResponse.next();
  }

  // الصفحة الرئيسية → /login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── حماية صفحة verify-2fa ──
  if (pathname === "/verify-2fa") {
    const sessionId = request.nextUrl.searchParams.get("sessionId");
    if (!sessionId) {
      // بدون sessionId لا يمكن الوصول
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // ── complete-profile: التحقق الفعلي يتم في الصفحة (جلسة أو QuickSign في sessionStorage) ──
  if (pathname === "/complete-profile") {
    const urlToken = request.nextUrl.searchParams.get("token");
    if (urlToken) {
      const isJwt =
        urlToken.split(".").length === 3 && !/^[a-f0-9]{64}$/i.test(urlToken);
      if (!isJwt) {
        const clean = new URL("/complete-profile", request.url);
        return NextResponse.redirect(clean);
      }
    }
    return NextResponse.next();
  }

  // ── callback: code may arrive in #fragment (OAuth) — handled client-side ──
  if (pathname === "/callback") {
    return NextResponse.next();
  }

  const isAuthPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const accessToken = getAccessToken(request);

  // ── session=logout: إجراء مقصود من المستخدم → حذف الكوكيز دائماً ──
  if (isAuthPage && sessionFlag === "logout") {
    const response = NextResponse.next();
    response.cookies.delete("__Secure-access_token");
    response.cookies.delete("access_token");
    response.cookies.delete("__Secure-refresh_token");
    response.cookies.delete("refresh_token");
    return response;
  }

  // ── session=expired أو invalid: التحقق من صلاحية التوكن الحالي أولاً ──
  if (
    isAuthPage &&
    (sessionFlag === "expired" || sessionFlag === "invalid")
  ) {
    if (accessToken) {
      try {
        const { decodeJwt } = await import("jose");
        const decoded = decodeJwt(accessToken);
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const exp =
          typeof decoded.exp === "number" && Number.isFinite(decoded.exp)
            ? decoded.exp
            : null;

        if (exp !== null && exp > nowInSeconds) {
          const nextParam = request.nextUrl.searchParams.get("next");
          if (nextParam) {
            try {
              const nextUrl = new URL(nextParam);
              const hostname = nextUrl.hostname;
              if (isAllowedRedirectHost(hostname)) {
                return NextResponse.redirect(nextUrl.toString());
              }
            } catch {
              // رابط next غير صالح → تجاهل والتوجيه حسب الدور
            }
          }
          const role = (decoded.role as string) || "USER";
          return redirectLoggedInUser(request, role);
        }
      } catch {
        // التوكن فاسد → سيتم حذفه أدناه
      }
    }

    const response = NextResponse.next();
    response.cookies.delete("__Secure-access_token");
    response.cookies.delete("access_token");
    response.cookies.delete("__Secure-refresh_token");
    response.cookies.delete("refresh_token");
    return response;
  }

  if (accessToken && isAuthPage && pathname !== "/callback") {
    let role = "USER";
    try {
      const { decodeJwt } = await import("jose");
      const decoded = decodeJwt(accessToken);
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const exp =
        typeof decoded.exp === "number" && Number.isFinite(decoded.exp)
          ? decoded.exp
          : null;

      if (exp !== null && exp <= nowInSeconds) {
        if (getRefreshToken(request)) {
          return NextResponse.next();
        }
        const response = NextResponse.next();
        response.cookies.delete("__Secure-access_token");
        response.cookies.delete("access_token");
        response.cookies.delete("__Secure-refresh_token");
        response.cookies.delete("refresh_token");
        return response;
      }

      role = (decoded.role as string) || "USER";
    } catch (e) {
      console.error("[Proxy] Failed to decode token:", e);
      const response = NextResponse.next();
      response.cookies.delete("__Secure-access_token");
      response.cookies.delete("access_token");
      response.cookies.delete("__Secure-refresh_token");
      response.cookies.delete("refresh_token");
      return response;
    }

    return redirectLoggedInUser(request, role);
  }

  const isProtected = PROTECTED_PATHS.some((p) =>
    pathname.startsWith(p)
  );

  if (isProtected && !hasSessionCookies(request)) {
    const accountsUrl = resolveAccountsUrl({ hostname: request.nextUrl.hostname });
    const loginUrl = new URL("/login", accountsUrl);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

function getRedirectByRole(_role: string, hostname?: string): string {
  return `${resolveAccountsUrl({ hostname }).replace(/\/$/, "")}/continue`;
}

function redirectLoggedInUser(request: NextRequest, role: string): NextResponse {
  const nextParam = request.nextUrl.searchParams.get("next");
  if (nextParam) {
    try {
      if (nextParam.startsWith("/") && !nextParam.startsWith("//")) {
        return NextResponse.redirect(new URL(nextParam, request.url));
      }
      const nextUrl = new URL(nextParam);
      if (isAllowedRedirectHost(nextUrl.hostname)) {
        return NextResponse.redirect(nextUrl.toString());
      }
    } catch {
      /* fall through */
    }
  }
  return NextResponse.redirect(
    getRedirectByRole(role, request.nextUrl.hostname),
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|images|assets).*)",
  ],
};
