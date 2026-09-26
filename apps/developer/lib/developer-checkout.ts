import { api, ApiException } from '@/lib/api-client';

export type DeveloperCheckoutKind =
  | 'WALLET_TOPUP'
  | 'PRO_UPGRADE'
  | 'EMAIL_API_PLAN';

export type DeveloperCheckoutSessionResponse = {
  sessionId: string;
  checkoutUrl: string;
  kind: DeveloperCheckoutKind;
  amount: number;
  currency: string;
  title: string;
  billingCycle: 'MONTHLY' | 'YEARLY' | null;
  returnUrl: string;
  expiresIn: number;
  expiresAt: string;
};

/**
 * Create a Developers → apps/checkout session and return a sanitized URL
 * (product + session only — never amount/kind in the browser URL).
 */
export async function startDeveloperCheckoutSession(input: {
  kind: DeveloperCheckoutKind;
  amount?: number;
  billingCycle?: 'MONTHLY' | 'YEARLY';
  appId?: string;
  /** Required when kind is EMAIL_API_PLAN — amount/title resolved server-side */
  planId?: string;
}): Promise<DeveloperCheckoutSessionResponse> {
  try {
    const { data } = await api.post<DeveloperCheckoutSessionResponse>(
      '/developer/checkout-session',
      {
        kind: input.kind,
        amount: input.amount,
        billingCycle: input.billingCycle,
        appId: input.appId,
        planId: input.planId,
      },
    );

    if (!data?.checkoutUrl || !data?.sessionId) {
      throw new Error('Could not start checkout.');
    }

    return {
      ...data,
      checkoutUrl: buildSafeDeveloperCheckoutUrl(
        data.sessionId,
        data.checkoutUrl,
      ),
    };
  } catch (error) {
    if (error instanceof ApiException) {
      throw new Error(error.message || 'Could not start checkout.');
    }
    throw error;
  }
}

/** Redirect the browser to Checkout with a safe URL. */
export async function redirectToDeveloperCheckout(input: {
  kind: DeveloperCheckoutKind;
  amount?: number;
  billingCycle?: 'MONTHLY' | 'YEARLY';
  appId?: string;
  planId?: string;
}): Promise<void> {
  const session = await startDeveloperCheckoutSession(input);
  window.location.href = session.checkoutUrl;
}

/** Only product + session may appear in the checkout entry URL. */
function buildSafeDeveloperCheckoutUrl(
  sessionId: string,
  fallbackUrl?: string,
): string {
  let base = resolveDeveloperCheckoutBaseUrl();
  if (fallbackUrl) {
    try {
      const parsed = new URL(fallbackUrl);
      base = parsed.origin;
    } catch {
      // keep resolveDeveloperCheckoutBaseUrl()
    }
  }
  return `${base}/?product=developer&session=${encodeURIComponent(sessionId)}`;
}

export function resolveDeveloperCheckoutBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_CHECKOUT_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3010';
    }
  }
  return 'https://checkout.rukny.io';
}
