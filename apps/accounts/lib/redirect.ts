// التوجيه الذكي بناءً على صلاحية المستخدم

export type UserRole = "ADMIN" | "PREMIUM" | "BASIC" | "GUEST" | "STORE_OWNER" | "DEVELOPER"

/**
 * إرجاع الرابط المناسب بناءً على الصلاحية
 */
export function getRedirectUrlByRole(role?: string): string {
  // الروابط الافتراضية
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const businessUrl = process.env.NEXT_PUBLIC_BUSINESS_URL || "http://localhost:3003"
  const developersUrl = process.env.NEXT_PUBLIC_DEVELOPERS_URL || "http://localhost:3004"
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3002"

  if (!role) return appUrl

  const upperRole = role.toUpperCase()

  if (upperRole === "STORE_OWNER" || upperRole === "PREMIUM") {
    return businessUrl
  }

  if (upperRole === "DEVELOPER") {
    return developersUrl
  }

  if (upperRole === "ADMIN") {
    return adminUrl
  }

  // الافتراضي (BASIC, GUEST، وغيرها)
  return appUrl
}

/**
 * التحقق من أمان رابط الوجهة (Open Redirect Protection)
 */
export function getSafeRedirectUrl(nextUrl: string | null | undefined, role?: string): string {
  const fallbackUrl = getRedirectUrlByRole(role)
  if (!nextUrl) return fallbackUrl

  try {
    // If it's a relative URL, it's safe and we return it as is
    if (nextUrl.startsWith('/')) return nextUrl

    const url = new URL(nextUrl)
    const hostname = url.hostname

    // القائمة البيضاء للنطاقات المسموحة
    const isAllowedDomain = 
      hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.endsWith('.rukny.io') ||
      hostname === 'rukny.io'

    if (isAllowedDomain) {
      return url.toString()
    }
  } catch (e) {
    // خطأ في تحليل الرابط
  }

  return fallbackUrl
}
