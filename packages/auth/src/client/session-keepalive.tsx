'use client';

import { useEffect } from 'react';

/** Re-check session health on this interval (access token TTL is ~30 min). */
const SESSION_PROBE_INTERVAL_MS = 5 * 60 * 1000;

async function accessSessionExpired(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
      cache: 'no-store',
    });
    return response.status === 401;
  } catch {
    return false;
  }
}

export function SessionKeepAlive({
  pathPrefix,
  refresh,
}: {
  /** Only run on protected routes, e.g. `/app` or `/apps`. */
  pathPrefix: string;
  refresh: () => Promise<{ success: boolean }>;
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.location.pathname.startsWith(pathPrefix)) return;

    const probe = async () => {
      if (await accessSessionExpired()) {
        await refresh();
      }
    };

    const timer = window.setInterval(() => {
      void probe();
    }, SESSION_PROBE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [pathPrefix, refresh]);

  return null;
}
