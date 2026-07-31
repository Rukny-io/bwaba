// Providers - Shared authentication provider for React
'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User, UserRoleType, AuthResponse } from '../types';

// ============================================================================
// Context Types
// ============================================================================

interface AuthContextState {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  clearError: () => void;

  // Helpers
  hasRole: (role: UserRoleType) => boolean;
  hasAnyRole: (roles: UserRoleType[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

interface SharedAuthProviderProps {
  children: ReactNode;
  /**
   * API base URL
   * @default '/api'
   */
  apiBaseUrl?: string;
  /**
   * Enable automatic session refresh
   * @default true
   */
  enableAutoRefresh?: boolean;
  /**
   * Refresh interval in milliseconds
   * @default 5 minutes
   */
  refreshInterval?: number;
  /**
   * Callback when session expires
   */
  onSessionExpired?: () => void;
  /**
   * Callback when user logs in
   */
  onLogin?: (user: User) => void;
  /**
   * Callback when user logs out
   */
  onLogout?: () => void;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextState | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export function SharedAuthProvider({
  children,
  apiBaseUrl = '/api',
  enableAutoRefresh = true,
  refreshInterval = 5 * 60 * 1000, // 5 minutes
  onSessionExpired,
  onLogin,
  onLogout,
}: SharedAuthProviderProps) {
  const [state, setState] = useState<{
    user: User | null;
    isLoading: boolean;
    error: string | null;
  }>({
    user: null,
    isLoading: true,
    error: null,
  });

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Fetch current user
   */
  const fetchUser = useCallback(async (): Promise<User | null> => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return data.user || data;
      }

      return null;
    } catch {
      return null;
    }
  }, [apiBaseUrl]);

  /**
   * Initialize auth state
   */
  const initialize = useCallback(async () => {
    try {
      const user = await fetchUser();
      setState({
        user,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Initialization failed',
      });
    }
  }, [fetchUser]);

  /**
   * Login
   */
  const login = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`${apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });

        const data: AuthResponse = await response.json();

        if (data.requires2FA && data.pendingSessionId) {
          const err = new Error(
            data.message || 'Two-factor authentication required',
          ) as Error & {
            requires2FA: boolean;
            pendingSessionId: string;
            email?: string;
          };
          err.requires2FA = true;
          err.pendingSessionId = data.pendingSessionId;
          err.email = data.email;
          setState((prev) => ({ ...prev, isLoading: false }));
          throw err;
        }

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Login failed');
        }

        if (!data.user) {
          throw new Error('User data not received');
        }

        setState({
          user: data.user,
          isLoading: false,
          error: null,
        });

        onLogin?.(data.user);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Login failed',
        }));
        throw error;
      }
    },
    [apiBaseUrl, onLogin]
  );

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

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
      error: null,
    });

    onLogout?.();
  }, [apiBaseUrl, onLogout]);

  /**
   * Refresh session
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Re-fetch user after refresh
        const user = await fetchUser();
        setState((prev) => ({ ...prev, user }));
        return true;
      }

      // Session expired
      setState({
        user: null,
        isLoading: false,
        error: null,
      });

      onSessionExpired?.();
      return false;
    } catch {
      return false;
    }
  }, [apiBaseUrl, fetchUser, onSessionExpired]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback(
    (role: UserRoleType): boolean => {
      return state.user?.role === role;
    },
    [state.user]
  );

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = useCallback(
    (roles: UserRoleType[]): boolean => {
      return state.user ? roles.includes(state.user.role) : false;
    },
    [state.user]
  );

  /**
   * Check if user has specific permission
   */
  const hasPermission = useCallback(
    (permission: string): boolean => {
      // This is a placeholder - implement based on your permission system
      if (!state.user) return false;

      // Admin has all permissions
      if (state.user.role === 'ADMIN') return true;

      // Add custom permission logic here
      return false;
    },
    [state.user]
  );

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Auto-refresh session
  useEffect(() => {
    if (!enableAutoRefresh || !state.user) return;

    const interval = setInterval(() => {
      refreshSession();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enableAutoRefresh, refreshInterval, refreshSession, state.user]);

  const contextValue = useMemo(
    () => ({
      // State
      user: state.user,
      isLoading: state.isLoading,
      isAuthenticated: !!state.user,
      error: state.error,

      // Actions
      login,
      logout,
      refreshSession,
      clearError,

      // Helpers
      hasRole,
      hasAnyRole,
      hasPermission,
    }),
    [
      state.user,
      state.isLoading,
      state.error,
      login,
      logout,
      refreshSession,
      clearError,
      hasRole,
      hasAnyRole,
      hasPermission,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useAuthContext(): AuthContextState {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuthContext must be used within a SharedAuthProvider');
  }

  return context;
}

// ============================================================================
// HOC
// ============================================================================

/**
 * Higher-order component for protected routes
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRole?: UserRoleType;
    requiredRoles?: UserRoleType[];
    fallback?: React.ReactNode;
    redirectTo?: string;
  }
): React.FC<P> {
  return function WithAuthComponent(props: P) {
    const { user, isLoading, isAuthenticated, hasRole, hasAnyRole } = useAuthContext();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        const returnUrl = encodeURIComponent(window.location.href);
        window.location.href = `/login?next=${returnUrl}`;
      }
      return null;
    }

    // Check role requirements
    if (options?.requiredRole && !hasRole(options.requiredRole)) {
      return options?.fallback ? (
        <>{options.fallback}</>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold mb-2">غير مصرح</h1>
          <p className="text-muted-foreground">
            ليس لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة
          </p>
        </div>
      );
    }

    if (options?.requiredRoles && !hasAnyRole(options.requiredRoles)) {
      return options?.fallback ? (
        <>{options.fallback}</>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold mb-2">غير مصرح</h1>
          <p className="text-muted-foreground">
            ليس لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة
          </p>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// ============================================================================
// Export all
// ============================================================================

export default {
  SharedAuthProvider,
  useAuthContext,
  withAuth,
};
