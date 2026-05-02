import { cache } from 'react';
import { redirect } from 'next/navigation';
import { apiServer } from './api/server';
import { verifySession, hasRefreshTokenCookie } from './session';
import type { AuthUser } from './api/auth';

/**
 * Data Access Layer (DAL)
 *
 * Server-only data-fetching functions.
 * React cache() ensures each function runs at most once per request.
 */

// ─── Helpers ──────────────────────────────────────────────────

async function tryServerSideRefresh(): Promise<boolean> {
  const { status } = await apiServer('/auth/refresh', { method: 'POST' });
  return status === 200;
}

// ─── Auth ──────────────────────────────────────────────────────

/**
 * Get the currently authenticated user.
 * Redirects to /login if no valid session can be established.
 *
 * Refresh flow:
 *   access_token missing, refresh_token present → try server-side refresh
 *   refresh fails → redirect to /login?session=expired
 */
export const getUser = cache(async (): Promise<AuthUser> => {
  const hasSession = await verifySession();

  if (!hasSession) {
    const canRefresh = await hasRefreshTokenCookie();
    if (!canRefresh) {
      redirect('/login?session=expired');
    }

    const refreshed = await tryServerSideRefresh();
    if (!refreshed) {
      redirect('/login?session=expired');
    }
  }

  const { data, error, status } = await apiServer<AuthUser>('/auth/me');

  if (status === 401 || error || !data?.id) {
    redirect('/login?session=expired');
  }

  return data!;
});
