import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_COOKIE_NAMES } from './auth-cookies';

export interface MiddlewareAuthUser {
  id: string;
  email: string;
}

export interface MiddlewareAuthResult {
  isAuthenticated: boolean;
  user: MiddlewareAuthUser | null;
  tokenExpired: boolean;
}

function getAccessToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get(AUTH_COOKIE_NAMES.accessToken)?.value ||
    request.cookies.get('access_token')?.value
  );
}

function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString(),
    ) as { exp?: number };
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/**
 * Verifies JWT validity only (sub, email, exp).
 * Role (ADMIN) is not stored in the JWT — it is fetched from /auth/me in getDashboardUser.
 */
export async function checkHqAuth(
  request: NextRequest,
): Promise<MiddlewareAuthResult> {
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return { isAuthenticated: false, user: null, tokenExpired: false };
  }

  if (isExpired(accessToken)) {
    return { isAuthenticated: false, user: null, tokenExpired: true };
  }

  try {
    const secretValue = process.env.JWT_SECRET;
    if (!secretValue && process.env.NODE_ENV === 'production') {
      console.error('[hq middleware] JWT_SECRET is required in production');
      return { isAuthenticated: false, user: null, tokenExpired: true };
    }
    const secret = new TextEncoder().encode(
      secretValue || 'fallback-secret-min-32-chars-for-e2e-tests!!',
    );
    const { payload } = await jwtVerify(accessToken, secret);
    return {
      isAuthenticated: true,
      user: {
        id: String(payload.sub),
        email: String(payload.email ?? ''),
      },
      tokenExpired: false,
    };
  } catch {
    return { isAuthenticated: false, user: null, tokenExpired: true };
  }
}
