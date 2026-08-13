import type { NextRequest } from 'next/server';
import { decodeJwt, jwtVerify } from 'jose';
import { COOKIE_NAMES } from '../config';

export interface EdgeAuthUser {
  id: string;
  email: string;
  role: string;
}

export interface EdgeAuthResult {
  isAuthenticated: boolean;
  user: EdgeAuthUser | null;
  tokenExpired: boolean;
}

function getAccessToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get(COOKIE_NAMES.accessToken)?.value ||
    request.cookies.get('access_token')?.value
  );
}

function getRefreshToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get(COOKIE_NAMES.refreshToken)?.value ||
    request.cookies.get('refresh_token')?.value
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

function userFromPayload(
  payload: ReturnType<typeof decodeJwt>,
): EdgeAuthUser | null {
  if (!payload.sub) return null;
  return {
    id: String(payload.sub),
    email: String(payload.email ?? ''),
    role: String(payload.role ?? 'BASIC'),
  };
}

let loggedMissingJwtSecret = false;

function logMissingJwtSecretOnce(): void {
  if (loggedMissingJwtSecret) return;
  loggedMissingJwtSecret = true;
  console.error(
    '[edge auth] JWT_SECRET is required in production (set it on the Next.js container)',
  );
}

/**
 * Edge-runtime JWT check with refresh-cookie awareness.
 * Never uses hardcoded JWT secrets — JWT_SECRET is required in production.
 */
export async function checkEdgeAuth(
  request: NextRequest,
): Promise<EdgeAuthResult> {
  const accessToken = getAccessToken(request);
  const refreshToken = getRefreshToken(request);

  if (!accessToken) {
    if (refreshToken) {
      return { isAuthenticated: true, user: null, tokenExpired: true };
    }
    return { isAuthenticated: false, user: null, tokenExpired: false };
  }

  if (isExpired(accessToken)) {
    if (refreshToken) {
      try {
        const user = userFromPayload(decodeJwt(accessToken));
        if (user) {
          return { isAuthenticated: true, user, tokenExpired: true };
        }
      } catch {
        /* fall through */
      }
      return { isAuthenticated: true, user: null, tokenExpired: true };
    }
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
      /* fall through to dev decode-only when secret mismatches locally */
    }
  }

  if (process.env.NODE_ENV === 'production') {
    logMissingJwtSecretOnce();
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
