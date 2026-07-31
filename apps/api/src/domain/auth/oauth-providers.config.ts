import { ForbiddenException } from '@nestjs/common';

export type OAuthProviderName = 'google' | 'github' | 'linkedin' | 'facebook';

const PROVIDER_ENV_KEYS: Record<OAuthProviderName, string> = {
  google: 'OAUTH_GOOGLE_ENABLED',
  github: 'OAUTH_GITHUB_ENABLED',
  linkedin: 'OAUTH_LINKEDIN_ENABLED',
  facebook: 'OAUTH_FACEBOOK_ENABLED',
};

const DEFAULT_ENABLED: Record<OAuthProviderName, boolean> = {
  google: true,
  linkedin: true,
  github: false,
  facebook: false,
};

function parseEnabledFlag(
  value: string | undefined,
  fallback: boolean,
): boolean {
  if (value === undefined || value.trim() === '') return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

export function isOAuthProviderEnabled(provider: OAuthProviderName): boolean {
  const envKey = PROVIDER_ENV_KEYS[provider];
  return parseEnabledFlag(process.env[envKey], DEFAULT_ENABLED[provider]);
}

export function assertOAuthProviderEnabled(provider: OAuthProviderName): void {
  if (!isOAuthProviderEnabled(provider)) {
    throw new ForbiddenException(
      `تسجيل الدخول عبر ${provider} غير متاح حالياً.`,
    );
  }
}

export function isGitHubOAuthConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_CLIENT_ID?.trim() &&
      process.env.GITHUB_CLIENT_SECRET?.trim(),
  );
}
