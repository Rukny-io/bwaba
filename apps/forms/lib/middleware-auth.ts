import type { NextRequest } from 'next/server';
import { decodeJwt, jwtVerify } from 'jose';
import { AUTH_COOKIE_NAMES } from './auth-cookies';

export interface MiddlewareAuthUser {
  id: string;
  email: string;
  role: string;
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
    const payload = decodeJwt(token);
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function userFromPayload(payload: ReturnType<typeof decodeJwt>): MiddlewareAuthUser | null {
  if (!payload.sub) return null;
  return {
    id: String(payload.sub),
    email: String(payload.email ?? ''),
    role: String(payload.role ?? 'BASIC'),
  };
}

export async function checkFormsAuth(
  request: NextRequest,
): Promise<MiddlewareAuthResult> {
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return { isAuthenticated: false, user: null, tokenExpired: false };
  }

  if (isExpired(accessToken)) {
    return { isAuthenticated: false, user: null, tokenExpired: true };
  }

  const secretValue = process.env.JWT_SECRET;

  if (secretValue) {
    try {
      const { payload } = await jwtVerify(
        accessToken,
        new TextEncoder().encode(secretValue),
      );
      const user = userFromPayload(payload);
      if (!user) {
        return { isAuthenticated: false, user: null, tokenExpired: true };
      }
      return { isAuthenticated: true, user, tokenExpired: false };
    } catch {
      // Fall through to dev decode-only when secret mismatches locally
    }
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('[forms middleware] JWT_SECRET is required in production');
    return { isAuthenticated: false, user: null, tokenExpired: true };
  }

  try {
    const user = userFromPayload(decodeJwt(accessToken));
    if (!user) {
      return { isAuthenticated: false, user: null, tokenExpired: true };
    }
    return { isAuthenticated: true, user, tokenExpired: false };
  } catch {
    return { isAuthenticated: false, user: null, tokenExpired: true };
  }
}
