import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
const PROTECTED_PATHS = ["/onboarding", "/manage"];

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

  // المسارات العامة
  const isAuthPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // المسارات المحمية → تحقق من الكوكي
  const accessToken =
    request.cookies.get("__Secure-access_token")?.value ||
    request.cookies.get("access_token")?.value;

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
      // فحص صلاحية التوكن قبل حذفه
      try {
        const { decodeJwt } = await import("jose");
        const decoded = decodeJwt(accessToken);
        const nowInSeconds = Math.floor(Date.now() / 1000);
        const exp =
          typeof decoded.exp === "number" && Number.isFinite(decoded.exp)
            ? decoded.exp
            : null;

        if (exp !== null && exp > nowInSeconds) {
          // التوكن صالح! → توجيه إلى next URL أو الوجهة الافتراضية
          const nextParam = request.nextUrl.searchParams.get("next");
          if (nextParam) {
            try {
              const nextUrl = new URL(nextParam);
              const hostname = nextUrl.hostname;
              const isAllowed =
                hostname === "localhost" ||
                hostname === "127.0.0.1" ||
                hostname.endsWith(".rukny.io") ||
                hostname === "rukny.io";
              if (isAllowed) {
                return NextResponse.redirect(nextUrl.toString());
              }
            } catch {
              // رابط next غير صالح → تجاهل والتوجيه حسب الدور
            }
          }
          // لا يوجد next صالح → توجيه حسب الدور
          const role = (decoded.role as string) || "USER";
          return NextResponse.redirect(getRedirectByRole(role));
        }
      } catch {
        // التوكن فاسد → سيتم حذفه أدناه
      }
    }

    // لا يوجد توكن أو التوكن منتهي/فاسد → حذف الكوكيز وعرض صفحة الدخول
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

      // إذا كانت صلاحية التوكن منتهية، لا نعيد التوجيه خارج صفحة الدخول
      // ونزيل الكوكيز القديمة حتى يتمكن المستخدم من تسجيل الدخول من جديد.
      if (exp !== null && exp <= nowInSeconds) {
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

    return NextResponse.redirect(getRedirectByRole(role));
  }

  // حماية المسارات المحمية
  const isProtected = PROTECTED_PATHS.some((p) =>
    pathname.startsWith(p)
  );

  if (isProtected && !accessToken) {
    const accountsUrl = process.env.NEXT_PUBLIC_ACCOUNTS_URL || "http://localhost:3005";
    const loginUrl = new URL("/login", accountsUrl);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// ── دالة مساعدة: التوجيه حسب الدور ──
function getRedirectByRole(role: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const businessUrl = process.env.NEXT_PUBLIC_BUSINESS_URL || "http://localhost:3003";
  const developersUrl = process.env.NEXT_PUBLIC_DEVELOPERS_URL || "http://localhost:3004";
  const formsUrl = process.env.NEXT_PUBLIC_FORMS_URL || "http://localhost:3007";

  switch (role) {
    case "ADMIN":
      return appUrl;
    case "DEVELOPER":
      return developersUrl;
    case "BUSINESS":
      return businessUrl;
    case "FORMS":
      return formsUrl;
    default:
      return appUrl;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|images|assets).*)",
  ],
};
