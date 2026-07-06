// Providers - Shared authentication providers
'use client';

import React, { createContext, useContext, useCallback, useMemo, ReactNode, useRef } from 'react';
import type { User, UserRoleType, AuthResponse } from '../types';
import { getRedirectUrlByRole } from '../config';

// ============================================================================
// Types
// ============================================================================

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  hasRole: (role: UserRoleType) => boolean;
  hasAnyRole: (roles: UserRoleType[]) => boolean;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export interface SharedAuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
  apiBaseUrl?: string;
}

// ============================================================================
// Context
// ============================================================================

const SharedAuthContext = createContext<AuthContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

export function SharedAuthProvider({
  children,
  initialUser = null,
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
}: SharedAuthProviderProps) {
  const [state, setState] = React.useState<AuthState>({
    user: initialUser,
    isLoading: !initialUser,
    isAuthenticated: !!initialUser,
    error: null,
  });

  const initAttempted = useRef(false);

  // Initialize auth on mount
  React.useEffect(() => {
    if (initialUser || initAttempted.current) {
      return;
    }

    initAttempted.current = true;

    const initAuth = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/auth/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setState({
            user: data,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } else {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          });
        }
      } catch (error) {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    };

    initAuth();
  }, [initialUser, apiBaseUrl]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
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
        isAuthenticated: true,
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
  }, [apiBaseUrl]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore errors
    }

    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
  }, [apiBaseUrl]);

  // Refresh session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const userResponse = await fetch(`${apiBaseUrl}/auth/me`, {
          credentials: 'include',
        });

        if (userResponse.ok) {
          const data = await userResponse.json();
          setState({
            user: data,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
          return true;
        }
      }

      return false;
    } catch {
      return false;
    }
  }, [apiBaseUrl]);

  // Helpers
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

  const setUser = useCallback((user: User | null) => {
    setState((prev) => ({
      ...prev,
      user,
      isAuthenticated: !!user,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      refreshSession,
      hasRole,
      hasAnyRole,
      setUser,
      clearError,
    }),
    [
      state,
      login,
      logout,
      refreshSession,
      hasRole,
      hasAnyRole,
      setUser,
      clearError,
    ]
  );

  return (
    <SharedAuthContext.Provider value={value}>
      {children}
    </SharedAuthContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useSharedAuth(): AuthContextValue {
  const context = useContext(SharedAuthContext);

  if (!context) {
    throw new Error('useSharedAuth must be used within a SharedAuthProvider');
  }

  return context;
}

// ============================================================================
// Export
// ============================================================================

export default SharedAuthProvider;
