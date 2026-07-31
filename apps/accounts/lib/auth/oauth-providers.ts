import type { OAuthProviderId } from "@/components/auth/auth-oauth"

const DEFAULT_ENABLED: Record<OAuthProviderId, boolean> = {
  google: true,
  linkedin: true,
  github: true,
  facebook: false,
}

function parseEnabledFlag(
  value: string | undefined,
  fallback: boolean,
): boolean {
  if (value === undefined || value.trim() === "") return fallback
  const normalized = value.trim().toLowerCase()
  if (["1", "true", "yes", "on"].includes(normalized)) return true
  if (["0", "false", "no", "off"].includes(normalized)) return false
  return fallback
}

/**
 * Next.js only inlines static `process.env.NEXT_PUBLIC_*` reads in client
 * bundles — dynamic `process.env[key]` always resolves to undefined.
 */
export function isLoginOAuthProviderEnabled(id: OAuthProviderId): boolean {
  switch (id) {
    case "google":
      return parseEnabledFlag(
        process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED,
        DEFAULT_ENABLED.google,
      )
    case "github":
      return parseEnabledFlag(
        process.env.NEXT_PUBLIC_OAUTH_GITHUB_ENABLED,
        DEFAULT_ENABLED.github,
      )
    case "linkedin":
      return parseEnabledFlag(
        process.env.NEXT_PUBLIC_OAUTH_LINKEDIN_ENABLED,
        DEFAULT_ENABLED.linkedin,
      )
    case "facebook":
      return parseEnabledFlag(
        process.env.NEXT_PUBLIC_OAUTH_FACEBOOK_ENABLED,
        DEFAULT_ENABLED.facebook,
      )
    default:
      return false
  }
}

export function getEnabledLoginOAuthProviders(): OAuthProviderId[] {
  return (["google", "github", "linkedin", "facebook"] as const).filter(
    isLoginOAuthProviderEnabled,
  )
}

export function getLinkableOAuthProviders(): OAuthProviderId[] {
  return getEnabledLoginOAuthProviders()
}

/** @deprecated Use getLinkableOAuthProviders() */
export const LINKABLE_OAUTH_PROVIDERS: OAuthProviderId[] =
  getEnabledLoginOAuthProviders()
