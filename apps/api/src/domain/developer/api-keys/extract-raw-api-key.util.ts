/**
 * Extract a Rukny developer API key from common integration headers.
 * Supports X-API-Key, Bearer rk_* tokens, and raw Authorization: rk_* (no Bearer prefix).
 */
export function extractRawApiKey(request: {
  headers: Record<string, string | string[] | undefined>;
}): string | undefined {
  const headerKey = request.headers['x-api-key'];
  if (typeof headerKey === 'string' && headerKey.trim()) {
    return headerKey.trim();
  }

  const auth = request.headers['authorization'];
  if (typeof auth !== 'string') {
    return undefined;
  }

  const trimmed = auth.trim();
  if (!trimmed) {
    return undefined;
  }

  const token = trimmed.startsWith('Bearer ')
    ? trimmed.slice(7).trim()
    : trimmed;

  if (
    token.startsWith('rk_live_') ||
    token.startsWith('rk_test_')
  ) {
    return token;
  }

  return undefined;
}
