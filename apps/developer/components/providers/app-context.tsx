'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { DeveloperApp } from '@/lib/api/types';

interface AppContextValue {
  app: DeveloperApp;
  appId: string;
  patchApp: (partial: Partial<DeveloperApp>) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  app,
  children,
}: {
  app: DeveloperApp;
  children: ReactNode;
}) {
  const [appState, setAppState] = useState(app);

  useEffect(() => {
    setAppState(app);
  }, [app]);

  const patchApp = useCallback((partial: Partial<DeveloperApp>) => {
    setAppState((prev) => ({ ...prev, ...partial }));
  }, []);

  return (
    <AppContext.Provider
      value={{ app: appState, appId: appState.appId, patchApp }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useCurrentApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useCurrentApp must be used within AppProvider');
  }
  return ctx;
}

export function useOptionalCurrentApp(): AppContextValue | null {
  return useContext(AppContext);
}
