import {
  isAllowedRedirectHost,
  resolveAppUrl,
  resolveBusinessUrl,
  resolveDeveloperUrl,
  resolveHqUrl,
} from '@/lib/env-urls';

export type UserRole = "ADMIN" | "PREMIUM" | "BASIC" | "GUEST" | "STORE_OWNER" | "DEVELOPER"

/**
 * إرجاع الرابط المناسب بناءً على الصلاحية
 */
export function getRedirectUrlByRole(role?: string, hostname?: string | null): string {
  const opts = { hostname };
  const appUrl = resolveAppUrl(opts);
  const businessUrl = resolveBusinessUrl(opts);
  const developersUrl = resolveDeveloperUrl(opts);
  const adminUrl = resolveHqUrl(opts);

  if (!role) return `${appUrl.replace(/\/$/, '')}/app/links`;

  const upperRole = role.toUpperCase();

  if (upperRole === "STORE_OWNER" || upperRole === "PREMIUM") {
    return businessUrl;
  }

  if (upperRole === "DEVELOPER") {
    return `${developersUrl.replace(/\/$/, "")}/apps`;
  }

  if (upperRole === "ADMIN") {
    return adminUrl;
  }

  return `${appUrl.replace(/\/$/, '')}/app/links`;
}

/**
 * التحقق من أمان رابط الوجهة (Open Redirect Protection)
 */
export function getSafeRedirectUrl(
  nextUrl: string | null | undefined,
  role?: string,
  hostname?: string | null,
): string {
  const fallbackUrl = getRedirectUrlByRole(role, hostname);
  if (!nextUrl) return fallbackUrl;

  try {
    if (nextUrl.startsWith('/')) return nextUrl;

    const url = new URL(nextUrl);
    if (isAllowedRedirectHost(url.hostname)) {
      return url.toString();
    }
  } catch {
    /* ignore */
  }

  return fallbackUrl;
}
