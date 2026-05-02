'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  getCurrentUser,
  logout as apiLogout,
  refreshTokens,
  type AuthUser,
  ApiError,
} from '@/lib/api/auth';

// ─── State Model ──────────────────────────────────────────────

export type AuthStatus =
  | 'loading'
  | 'unauthenticated'
  | 'pending_2fa'
  | 'pending_profile'
  | 'authenticated';

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'pending_2fa'; pendingSessionId: string; email: string }
  | { status: 'pending_profile' }
  | { status: 'authenticated'; user: AuthUser };

// ─── Actions ─────────────────────────────────────────────────

type AuthAction =
  | { type: 'SET_LOADING' }
  | { type: 'SET_USER'; user: AuthUser }
  | { type: 'SET_UNAUTHENTICATED' }
  | { type: 'SET_PENDING_2FA'; pendingSessionId: string; email: string }
  | { type: 'SET_PENDING_PROFILE' };

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { status: 'loading' };
    case 'SET_USER':
      return { status: 'authenticated', user: action.user };
    case 'SET_UNAUTHENTICATED':
      return { status: 'unauthenticated' };
    case 'SET_PENDING_2FA':
      return {
        status: 'pending_2fa',
        pendingSessionId: action.pendingSessionId,
        email: action.email,
      };
    case 'SET_PENDING_PROFILE':
      return { status: 'pending_profile' };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────

interface AuthContextValue {
  state: AuthState;
  setUser: (user: AuthUser) => void;
  setPending2FA: (pendingSessionId: string, email: string) => void;
  setPendingProfile: () => void;
  setUnauthenticated: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { status: 'loading' });
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    try {
      const { user } = await getCurrentUser();
      if (!user.profileCompleted) {
        dispatch({ type: 'SET_PENDING_PROFILE' });
        if (pathname !== '/complete-profile') {
          router.replace('/complete-profile');
        }
        return;
      }
      dispatch({ type: 'SET_USER', user });
    } catch (err) {
      if (err instanceof ApiError && err.isUnauthorized) {
        // Try refreshing the token once
        try {
          await refreshTokens();
          const { user } = await getCurrentUser();
          if (!user.profileCompleted) {
            dispatch({ type: 'SET_PENDING_PROFILE' });
            if (pathname !== '/complete-profile') {
              router.replace('/complete-profile');
            }
            return;
          }
          dispatch({ type: 'SET_USER', user });
        } catch {
          dispatch({ type: 'SET_UNAUTHENTICATED' });
        }
      } else {
        dispatch({ type: 'SET_UNAUTHENTICATED' });
      }
    }
  }, [router, pathname]);

  // Load user on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const setUser = useCallback((user: AuthUser) => {
    dispatch({ type: 'SET_USER', user });
  }, []);

  const setPending2FA = useCallback((pendingSessionId: string, email: string) => {
    dispatch({ type: 'SET_PENDING_2FA', pendingSessionId, email });
  }, []);

  const setPendingProfile = useCallback(() => {
    dispatch({ type: 'SET_PENDING_PROFILE' });
  }, []);

  const setUnauthenticated = useCallback(() => {
    dispatch({ type: 'SET_UNAUTHENTICATED' });
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      dispatch({ type: 'SET_UNAUTHENTICATED' });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        state,
        setUser,
        setPending2FA,
        setPendingProfile,
        setUnauthenticated,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}

export function useAuthUser(): AuthUser | null {
  const { state } = useAuth();
  return state.status === 'authenticated' ? state.user : null;
}
