/**
 * 🔐 Users API Functions
 */

import { apiFetch } from './client';

// ─── 2FA Setup ─────────────────────────────────────────────────

export interface Setup2FAResponse {
  qrCode: string;        // base64 QR image
  secret: string;
  otpauthUrl: string;
}

export interface Verify2FASetupResponse {
  success: boolean;
  recoveryCodes?: string[];
}

export async function setup2FA(): Promise<Setup2FAResponse> {
  return apiFetch('/users/2fa/setup', {
    method: 'POST',
  });
}

export async function verify2FASetup(code: string): Promise<Verify2FASetupResponse> {
  return apiFetch('/users/2fa/verify', {
    method: 'POST',
    body: { code },
  });
}
