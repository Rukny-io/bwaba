'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { fetchCurrentUser, type AuthUser } from '@/lib/api';
import { logoutWithNotification } from '@/lib/auth-notify';

interface FormsAuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const FormsAuthContext = createContext<FormsAuthContextValue | null>(null);

export function FormsAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const me = await fetchCurrentUser();
    setUser(me);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetchCurrentUser();
      if (!cancelled) {
        setUser(me);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await logoutWithNotification();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      logout,
      refreshUser,
    }),
    [user, isLoading, logout, refreshUser],
  );

  return (
    <FormsAuthContext.Provider value={value}>{children}</FormsAuthContext.Provider>
  );
}

export function useFormsAuth(): FormsAuthContextValue {
  const ctx = useContext(FormsAuthContext);
  if (!ctx) {
    throw new Error('useFormsAuth must be used within FormsAuthProvider');
  }
  return ctx;
}
