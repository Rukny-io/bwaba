/**
 * 🔐 Auth API Functions
 *
 * All auth calls go through the BFF route handler (/api/auth/*).
 * No bearer tokens — httpOnly cookies only.
 */

import { apiFetch } from './client';

export { ApiError } from './client';

// ─── Shared Types ──────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  isEmailVerified: boolean;
  hasTwoFactor: boolean;
  profileCompleted: boolean;
  createdAt: string;
}

export interface AuthMeResponse {
  user: AuthUser;
}

// ─── QuickSign ─────────────────────────────────────────────────

export interface RequestQuickSignResponse {
  success: boolean;
  type: 'LOGIN' | 'SIGNUP'; // kept for UX only — do NOT use for account enumeration
}

export async function requestQuickSign(email: string): Promise<RequestQuickSignResponse> {
  return apiFetch('/auth/quicksign/request', {
    method: 'POST',
    body: { email },
  });
}

// ─── OAuth ─────────────────────────────────────────────────────

export interface OAuthExchangeResponse {
  success: boolean;
  needsProfileCompletion?: boolean;
  requires2FA?: boolean;
  pendingSessionId?: string;
  requiresLinking?: boolean;
  user?: AuthUser;
}

export async function exchangeOAuthCode(code: string): Promise<OAuthExchangeResponse> {
  return apiFetch('/auth/oauth/exchange', {
    method: 'POST',
    body: { code },
  });
}

// ─── Session ───────────────────────────────────────────────────

export async function getCurrentUser(): Promise<AuthMeResponse> {
  return apiFetch('/auth/me', { method: 'GET' });
}

export async function refreshTokens(): Promise<{ success: boolean }> {
  return apiFetch('/auth/refresh', { method: 'POST' });
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' });
}

export async function logoutAll(): Promise<void> {
  await apiFetch('/auth/logout-all', { method: 'POST' });
}

// ─── 2FA ───────────────────────────────────────────────────────

export interface StartVerifyIdentityResponse {
  success: boolean;
  pendingSessionId: string | null;
  availableMethods?: {
    email: boolean;
    authenticator: boolean;
    recovery: boolean;
  };
  message?: string;
}

export interface Verify2FARequest {
  pendingSessionId: string;
  token: string;
}

export interface Verify2FAResponse {
  success: boolean;
  user?: AuthUser;
}

export async function startVerifyIdentity(
  email: string,
): Promise<StartVerifyIdentityResponse> {
  return apiFetch('/auth/2fa/start-verify-identity', {
    method: 'POST',
    body: { email },
  });
}

export async function verify2FA(payload: Verify2FARequest): Promise<Verify2FAResponse> {
  return apiFetch('/auth/2fa/verify-login', {
    method: 'POST',
    body: payload,
  });
}

// ─── Profile ───────────────────────────────────────────────────

export interface UpdateProfileRequest {
  name: string;
  username: string;
  phone?: string;
  storeCategory?: string;
  storeDescription?: string;
  employeesCount?: string;
  storeCountry?: string;
  storeCity?: string;
  storeAddress?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  user: AuthUser;
  store?: { slug: string } | null;
}

export async function updateProfile(
  payload: UpdateProfileRequest,
): Promise<UpdateProfileResponse> {
  return apiFetch('/auth/update-profile', {
    method: 'POST',
    body: payload,
  });
}

// ─── Username Check ────────────────────────────────────────────

export async function checkUsernameAvailable(username: string): Promise<{ available: boolean }> {
  return apiFetch(`/profiles/check/${encodeURIComponent(username)}`, { method: 'GET' });
}

// ─── Phone OTP (WhatsApp) ──────────────────────────────────────

export async function sendPhoneOtp(phone: string): Promise<{ success: boolean }> {
  return apiFetch('/profiles/phone/send-otp', { method: 'POST', body: { phone } });
}

export async function verifyPhoneOtp(phone: string, otp: string): Promise<{ success: boolean; verified: boolean }> {
  return apiFetch('/profiles/phone/verify', { method: 'POST', body: { phone, otp } });
}
