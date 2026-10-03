import { createHmac, timingSafeEqual } from 'crypto';

const STATE_TTL_MS = 10 * 60 * 1000;

type SignedPayload = Record<string, unknown> & { exp: number };

/**
 * Sign integration OAuth `state` with HMAC-SHA256 to prevent CSRF / tampering.
 * Format: base64url(json).base64url(hmac)
 */
export function signIntegrationOAuthState(
  payload: Record<string, unknown>,
  secret: string,
): string {
  const body: SignedPayload = {
    ...payload,
    exp: Date.now() + STATE_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString('base64url');
  const signature = createHmac('sha256', secret)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

/**
 * Verify signed integration OAuth state. Returns payload without `exp`, or null.
 */
export function verifyIntegrationOAuthState<T extends Record<string, unknown>>(
  state: string,
  secret: string,
): T | null {
  const dot = state.lastIndexOf('.');
  if (dot <= 0) return null;

  const encoded = state.slice(0, dot);
  const providedSig = state.slice(dot + 1);
  const expectedSig = createHmac('sha256', secret)
    .update(encoded)
    .digest('base64url');

  const providedBuf = Buffer.from(providedSig);
  const expectedBuf = Buffer.from(expectedSig);
  if (
    providedBuf.length !== expectedBuf.length ||
    !timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    ) as SignedPayload;
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    const { exp: _exp, ...rest } = parsed;
    return rest as T;
  } catch {
    return null;
  }
}

/** Legacy unsigned state (base64 JSON or raw userId). Dev / migration only. */
export function parseLegacyIntegrationOAuthState(
  state: string,
): Record<string, unknown> | string | null {
  try {
    const decoded = Buffer.from(state, 'base64url').toString('utf8');
    try {
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return decoded;
    }
  } catch {
    try {
      const decoded = Buffer.from(state, 'base64').toString('utf8');
      try {
        return JSON.parse(decoded) as Record<string, unknown>;
      } catch {
        return decoded;
      }
    } catch {
      return null;
    }
  }
}

export function integrationOAuthStateLegacyAllowed(): boolean {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.INTEGRATION_OAUTH_STATE_LEGACY === 'true'
  );
}
