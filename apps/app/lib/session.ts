import { cookies } from 'next/headers';
import { cache } from 'react';

const API_BACKEND_URL = process.env.API_BACKEND_URL || 'http://localhost:3001';

/**
 * Verify the current session by calling /auth/me on the backend.
 *
 * 🔒 Cookie-forwarding model — no bearer tokens.
 * Returns `true` if the backend confirms the session is valid.
 * Fails closed (returns false) if the backend is unreachable.
 */
export const verifySession = cache(async (): Promise<boolean> => {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get('__Secure-access_token') ?? cookieStore.get('access_token');

  // Fast-path: no access_token cookie → not authenticated
  if (!accessToken?.value) return false;

  try {
    const res = await fetch(`${API_BACKEND_URL}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        Cookie: cookieStore
          .getAll()
          .map((c) => `${c.name}=${c.value}`)
          .join('; '),
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    return res.ok;
  } catch {
    // Backend unreachable — deny access (fail closed)
    return false;
  }
});

/**
 * Returns true if the request has a refresh_token (not necessarily a valid session).
 * Used in the DAL to decide whether to attempt server-side refresh before redirecting.
 */
export async function hasRefreshTokenCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return !!(
    cookieStore.get('__Secure-refresh_token')?.value ||
    cookieStore.get('refresh_token')?.value
  );
}
