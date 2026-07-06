// Types - Core authentication types

import { z } from 'zod';

// ============================================================================
// User Types
// ============================================================================

export const UserRole = {
  ADMIN: 'ADMIN',
  PREMIUM: 'PREMIUM',
  BASIC: 'BASIC',
  GUEST: 'GUEST',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

export interface User {
  id: string;
  email: string;
  name?: string | null;
  username?: string | null;
  avatar?: string | null;
  role: UserRoleType;
  emailVerified: boolean;
  profileCompleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const UserSchema: z.ZodType<User> = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  role: z.enum(['ADMIN', 'PREMIUM', 'BASIC', 'GUEST']),
  emailVerified: z.boolean(),
  profileCompleted: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// ============================================================================
// Auth Response Types
// ============================================================================

export interface AuthResponse {
  success: boolean;
  message?: string;
  csrf_token?: string;
  user?: User;
  expires_in?: number;
  needsProfileCompletion?: boolean;
  requiresLinking?: boolean;
  requires2FA?: boolean;
  pendingSessionId?: string;
}

export const AuthResponseSchema: z.ZodType<AuthResponse> = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  csrf_token: z.string().optional(),
  user: UserSchema.optional(),
  expires_in: z.number().optional(),
  needsProfileCompletion: z.boolean().optional(),
  requiresLinking: z.boolean().optional(),
  requires2FA: z.boolean().optional(),
  pendingSessionId: z.string().optional(),
});

// ============================================================================
// QuickSign Types
// ============================================================================

export interface QuickSignRequest {
  email: string;
}

export const QuickSignRequestSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
});

export interface QuickSignResponse {
  success: boolean;
  message: string;
  type: 'LOGIN' | 'SIGNUP';
  expiresIn: number;
}

export const QuickSignResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  type: z.enum(['LOGIN', 'SIGNUP']),
  expiresIn: z.number(),
});

// ============================================================================
// Session Types
// ============================================================================

export interface SessionInfo {
  id: string;
  userId: string;
  createdAt: string;
  lastActivity: string;
  userAgent?: string;
  ipAddress?: string;
  isCurrent?: boolean;
}

export interface SessionListResponse {
  sessions: SessionInfo[];
  currentSessionId: string;
}

// ============================================================================
// Cookie Types
// ============================================================================

export interface CookieOptions {
  name: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  domain?: string;
  path: string;
  maxAge?: number;
}

export interface AuthCookies {
  accessToken: CookieOptions;
  refreshToken: CookieOptions;
  csrfToken: CookieOptions;
}

// ============================================================================
// JWT Types
// ============================================================================

export interface JWTPayload {
  sub: string;
  sid?: string;
  email: string;
  role: UserRoleType;
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

// ============================================================================
// Role & Permission Types
// ============================================================================

export const ROLE_HIERARCHY: Record<UserRoleType, number> = {
  [UserRole.ADMIN]: 100,
  [UserRole.PREMIUM]: 50,
  [UserRole.BASIC]: 10,
  [UserRole.GUEST]: 0,
};

export const hasRequiredRole = (userRole: UserRoleType, requiredRole: UserRoleType): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};
