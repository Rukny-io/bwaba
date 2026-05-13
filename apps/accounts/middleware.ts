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
const PROTECTED_PATHS = ["/onboarding"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // السماح بالملفات الثابتة والـ API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // favicon, images, etc.
  ) {
    return NextResponse.next();
  }

  // الصفحة الرئيسية → /login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ── حماية صفحة check-email ──
  // يجب أن يكون هناك email في الجلسة (يتم التحقق من الـ client side)
  // لكن هنا نتأكد من عدم الوصول المباشر بدون referrer
  if (pathname === "/check-email") {
    // نسمح بالوصول دائماً لأن الـ client سيتعامل مع الحماية
    return NextResponse.next();
  }

  // ── حماية صفحة choose-method ──
  if (pathname === "/choose-method") {
    return NextResponse.next();
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

  // ── حماية صفحة complete-profile ──
  if (pathname === "/complete-profile") {
    const email = request.nextUrl.searchParams.get("email");
    const token = request.nextUrl.searchParams.get("token");
    if (!email || !token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // ── حماية صفحة callback ──
  if (pathname === "/callback") {
    const code = request.nextUrl.searchParams.get("code");
    if (!code) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // المسارات العامة
  const isAuthPage = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // المسارات المحمية → تحقق من الكوكي
  const accessToken =
    request.cookies.get("__Secure-access_token")?.value ||
    request.cookies.get("access_token")?.value;

  if (accessToken && isAuthPage) {
    let role = "USER";
    try {
      const payload = accessToken.split('.')[1];
      if (payload) {
        // Base64 decoding in edge runtime
        const decodedStr = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        const decoded = JSON.parse(decodedStr);
        role = decoded.role || "USER";
      }
    } catch(e) {}

    // استيراد بسيط لدالة التوجيه هنا (لأن Edge runtime لا يدعم كل المكتبات)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const businessUrl = process.env.NEXT_PUBLIC_BUSINESS_URL || "http://localhost:3003";
    const developersUrl = process.env.NEXT_PUBLIC_DEVELOPERS_URL || "http://localhost:3004";
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002";
    
    let redirectUrl = appUrl;
    const upperRole = role.toUpperCase();
    if (upperRole === "STORE_OWNER" || upperRole === "PREMIUM") redirectUrl = businessUrl;
    else if (upperRole === "DEVELOPER") redirectUrl = developersUrl;
    else if (upperRole === "ADMIN") redirectUrl = adminUrl;

    // ── حماية وتوجيه (Open Redirect Protection) للعودة للتطبيق ──
    const nextParam = request.nextUrl.searchParams.get("next");
    if (nextParam) {
      try {
        if (nextParam.startsWith('/')) {
          redirectUrl = new URL(nextParam, request.url).toString();
        } else {
          const url = new URL(nextParam);
          const hostname = url.hostname;
          if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.rukny.io') || hostname === 'rukny.io') {
            redirectUrl = url.toString();
          }
        }
      } catch (e) {
        // Fallback to role-based url
      }
    }

    return NextResponse.redirect(new URL(redirectUrl));
  }

  if (isAuthPage) {
    return NextResponse.next();
  }

  // المسارات المحمية → تحقق من الكوكي
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    if (!accessToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
