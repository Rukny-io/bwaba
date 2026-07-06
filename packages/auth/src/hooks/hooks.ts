// Hooks - React hooks for authentication
'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { User, UserRoleType } from '../types';
import {
  getRedirectUrlByRole,
  APP_URLS,
} from '../config';
import { isTokenExpired, getTokenExpiry } from '../utils';

// ============================================================================
// Types
// ============================================================================

export interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  clearError: () => void;
  hasRole: (role: UserRoleType) => boolean;
  hasAnyRole: (roles: UserRoleType[]) => boolean;
}

export interface UseSessionReturn {
  isValid: boolean;
  expiresAt: number | null;
  timeRemaining: number | null;
  isExpiringSoon: boolean;
  refresh: () => Promise<boolean>;
  invalidate: () => void;
}

export interface UseRedirectReturn {
  getLoginUrl: (returnUrl?: string) => string;
  getLogoutUrl: (redirectUrl?: string) => string;
  getRegisterUrl: (returnUrl?: string) => string;
  getHomeUrl: (role: UserRoleType) => string;
  getDashboardUrl: (role: UserRoleType) => string;
  navigateToApp: (app: keyof typeof APP_URLS, path?: string) => string;
}

// ============================================================================
// useAuth Hook
// ============================================================================

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<{
    user: User | null;
    isLoading: boolean;
    error: string | null;
  }>({
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setState({
            user: data.user,
            isLoading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        setState({
          user: null,
          isLoading: false,
          error: null,
        });
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setState({
        user: data.user,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore errors
    }

    setState({
      user: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const userResponse = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (userResponse.ok) {
          const data = await userResponse.json();
          setState({
            user: data,
            isLoading: false,
            error: null,
          });
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const hasRole = useCallback(
    (role: UserRoleType): boolean => {
      return state.user?.role === role;
    },
    [state.user]
  );

  const hasAnyRole = useCallback(
    (roles: UserRoleType[]): boolean => {
      return state.user ? roles.includes(state.user.role) : false;
    },
    [state.user]
  );

  return {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: !!state.user,
    error: state.error,
    login,
    logout,
    refreshSession,
    clearError,
    hasRole,
    hasAnyRole,
  };
}

// ============================================================================
// useSession Hook
// ============================================================================

export function useSession(refreshInterval: number = 60000): UseSessionReturn {
  const [state, setState] = useState<{
    isValid: boolean;
    expiresAt: number | null;
    timeRemaining: number | null;
  }>({
    isValid: false,
    expiresAt: null,
    timeRemaining: null,
  });

  useEffect(() => {
    const checkSession = async () => {
      const cookies = document.cookie;
      const tokenMatch = cookies.match(/access_token=([^;]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;

      if (!token) {
        setState({
          isValid: false,
          expiresAt: null,
          timeRemaining: null,
        });
        return;
      }

      const expired = isTokenExpired(token);
      const expiry = getTokenExpiry(token);

      if (expired || !expiry) {
        setState({
          isValid: false,
          expiresAt: expiry,
          timeRemaining: 0,
        });
        return;
      }

      const now = Date.now();
      const timeRemaining = Math.max(0, expiry - now);

      setState({
        isValid: true,
        expiresAt: expiry,
        timeRemaining,
      });
    };

    checkSession();

    const interval = setInterval(checkSession, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const isExpiringSoon = useMemo(() => {
    if (!state.timeRemaining) return false;
    return state.timeRemaining < 5 * 60 * 1000;
  }, [state.timeRemaining]);

  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        window.location.reload();
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, []);

  const invalidate = useCallback(() => {
    setState({
      isValid: false,
      expiresAt: null,
      timeRemaining: null,
    });
  }, []);

  return {
    isValid: state.isValid,
    expiresAt: state.expiresAt,
    timeRemaining: state.timeRemaining,
    isExpiringSoon,
    refresh,
    invalidate,
  };
}

// ============================================================================
// useRedirect Hook
// ============================================================================

export function useRedirect(): UseRedirectReturn {
  const getLoginUrl = useCallback((returnUrl?: string): string => {
    const baseUrl = APP_URLS.accounts;
    const url = new URL('/login', baseUrl);
    if (returnUrl) {
      url.searchParams.set('next', returnUrl);
    }
    return url.toString();
  }, []);

  const getLogoutUrl = useCallback((redirectUrl?: string): string => {
    const baseUrl = APP_URLS.accounts;
    const url = new URL('/login', baseUrl);
    url.searchParams.set('session', 'expired');
    if (redirectUrl) {
      url.searchParams.set('next', redirectUrl);
    }
    return url.toString();
  }, []);

  const getRegisterUrl = useCallback((returnUrl?: string): string => {
    return getLoginUrl(returnUrl);
  }, [getLoginUrl]);

  const getHomeUrl = useCallback((role: UserRoleType): string => {
    return getRedirectUrlByRole(role);
  }, []);

  const getDashboardUrl = useCallback((role: UserRoleType): string => {
    return getRedirectUrlByRole(role, { defaultUrl: '/dashboard' });
  }, []);

  const navigateToApp = useCallback((app: keyof typeof APP_URLS, path: string = '/'): string => {
    const baseUrl = APP_URLS[app];
    return new URL(path, baseUrl).toString();
  }, []);

  return {
    getLoginUrl,
    getLogoutUrl,
    getRegisterUrl,
    getHomeUrl,
    getDashboardUrl,
    navigateToApp,
  };
}

// ============================================================================
// Export all
// ============================================================================

export default {
  useAuth,
  useSession,
  useRedirect,
};
