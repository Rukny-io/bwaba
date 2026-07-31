'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_DEVELOPER_PREFS,
  readDeveloperUserPrefs,
  writeDeveloperUserPrefs,
  type DeveloperUserPreferences,
  type NotificationPreferences,
} from '@/lib/developer-user-prefs';

export function useDeveloperUserPrefs() {
  const [prefs, setPrefs] = useState<DeveloperUserPreferences>(
    DEFAULT_DEVELOPER_PREFS,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPrefs(readDeveloperUserPrefs());
    setHydrated(true);
  }, []);

  useEffect(() => {
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<DeveloperUserPreferences>).detail;
      if (detail) setPrefs(detail);
    };
    window.addEventListener('rukny-dev-user-prefs', onChange);
    return () => window.removeEventListener('rukny-dev-user-prefs', onChange);
  }, []);

  const persist = useCallback((next: DeveloperUserPreferences) => {
    setPrefs(next);
    writeDeveloperUserPrefs(next);
  }, []);

  const setDefaultEnvironment = useCallback(
    (defaultApiKeyEnvironment: DeveloperUserPreferences['defaultApiKeyEnvironment']) => {
      persist({ ...prefs, defaultApiKeyEnvironment });
    },
    [persist, prefs],
  );

  const setNotification = useCallback(
    (key: keyof NotificationPreferences, value: boolean) => {
      persist({
        ...prefs,
        notifications: { ...prefs.notifications, [key]: value },
      });
    },
    [persist, prefs],
  );

  return {
    prefs,
    hydrated,
    setDefaultEnvironment,
    setNotification,
  };
}
