export const ALL_API_KEY_SCOPES = [
  'whatsapp:send',
  'whatsapp:read',
  'templates:read',
  'templates:write',
  'contacts:read',
  'contacts:write',
  'webhooks:manage',
  'media:upload',
  'forms:read',
  'forms:write',
  'forms:webhooks',
] as const;

export type ApiKeyScope = (typeof ALL_API_KEY_SCOPES)[number];

export const DEFAULT_API_KEY_SCOPES: ApiKeyScope[] = [
  'whatsapp:send',
  'whatsapp:read',
  'templates:read',
  'contacts:read',
];

/** Scopes that modify data — show a warning when combined with live environment */
export const WRITE_API_KEY_SCOPES: ApiKeyScope[] = [
  'whatsapp:send',
  'templates:write',
  'contacts:write',
  'webhooks:manage',
  'media:upload',
  'forms:write',
  'forms:webhooks',
];

export type ApiKeyExpirationPreset = 'never' | '30d' | '90d' | '365d';

export function computeExpiresAt(
  preset: ApiKeyExpirationPreset,
): string | undefined {
  if (preset === 'never') return undefined;

  const date = new Date();
  const days = preset === '30d' ? 30 : preset === '90d' ? 90 : 365;
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(23, 59, 59, 999);
  return date.toISOString();
}

export function hasWriteScopes(scopes: string[]): boolean {
  return scopes.some((scope) =>
    WRITE_API_KEY_SCOPES.includes(scope as ApiKeyScope),
  );
}

export function toggleScope(scopes: string[], scope: string): string[] {
  return scopes.includes(scope)
    ? scopes.filter((item) => item !== scope)
    : [...scopes, scope];
}
