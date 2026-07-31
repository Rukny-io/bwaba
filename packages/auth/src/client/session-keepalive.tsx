'use client';

import { useEffect } from 'react';

/** Proactive refresh before the 30-minute access token expires. */
const REFRESH_INTERVAL_MS = 25 * 60 * 1000;

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

    void refresh();

    const timer = window.setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [pathPrefix, refresh]);

  return null;
}
