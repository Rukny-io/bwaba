const SESSION_KEY = 'rukny.checkout.session';
const CART_KEY = 'rukny.checkout.cart';

export type CheckoutSessionState = {
  accessToken: string;
  phoneNumber: string;
  email?: string;
  verified: boolean;
  userId?: string;
  otpId?: string;
  selectedAddressId?: string;
  expiresAt?: number;
};

export type CheckoutCartItem = {
  productId: string;
  quantity: number;
  variantId?: string;
  name?: string;
  price?: number;
};

export type MailCheckoutCart = {
  product: 'mail';
  sessionId: string;
  plan: string;
  planName: string;
  mailboxCount: number;
  amount: number;
  currency: string;
  appId: string;
  appName: string;
  returnUrl: string;
  /** Epoch ms — after this, cart must not be shown. */
  expiresAt?: number;
};

export type DeveloperCheckoutCart = {
  product: 'developer';
  sessionId: string;
  kind: 'WALLET_TOPUP' | 'PRO_UPGRADE';
  title: string;
  amount: number;
  currency: string;
  billingCycle?: 'MONTHLY' | 'YEARLY' | null;
  appId?: string | null;
  returnUrl: string;
  /** Epoch ms — after this, cart must not be shown. */
  expiresAt?: number;
};

export type CheckoutCartState = {
  storeSlug?: string;
  storeId?: string;
  storeName?: string;
  couponCode?: string;
  items: CheckoutCartItem[];
  /** Digital Mail plan checkout (skips shipping address). */
  mail?: MailCheckoutCart;
  /** Digital Developer wallet / Pro checkout (skips shipping address). */
  developer?: DeveloperCheckoutCart;
};

function canUseStorage() {
  return typeof window !== 'undefined';
}

export function getCheckoutSession(): CheckoutSessionState | null {
  if (!canUseStorage()) return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutSessionState;
    // Allow pending OTP sessions (phone or email + otpId) without accessToken yet
    if (!parsed?.phoneNumber && !parsed?.email) return null;
    if (!parsed.accessToken && !parsed.otpId) return null;
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      clearCheckoutSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Verified buyer session with a bearer token */
export function getVerifiedCheckoutSession(): CheckoutSessionState | null {
  const session = getCheckoutSession();
  if (!session?.verified || !session.accessToken) return null;
  return session;
}

export function saveCheckoutSession(next: CheckoutSessionState) {
  if (!canUseStorage()) return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
}

export function clearCheckoutSession() {
  if (!canUseStorage()) return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function getCheckoutCart(): CheckoutCartState | null {
  if (!canUseStorage()) return null;
  try {
    const raw = sessionStorage.getItem(CART_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutCartState;
    if (parsed?.mail?.expiresAt && Date.now() >= parsed.mail.expiresAt) {
      clearCheckoutCart();
      return null;
    }
    if (
      parsed?.developer?.expiresAt &&
      Date.now() >= parsed.developer.expiresAt
    ) {
      clearCheckoutCart();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveCheckoutCart(cart: CheckoutCartState) {
  if (!canUseStorage()) return;
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function clearCheckoutCart() {
  if (!canUseStorage()) return;
  sessionStorage.removeItem(CART_KEY);
}

export function updateCheckoutSession(
  patch: Partial<CheckoutSessionState>,
): CheckoutSessionState | null {
  const current = getCheckoutSession();
  if (!current) return null;
  const next = { ...current, ...patch };
  saveCheckoutSession(next);
  return next;
}

/** Normalize Iraqi local or +964 numbers to +964XXXXXXXXXX */
export function toE164Iraq(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('964') && digits.length === 13) {
    return `+${digits}`;
  }
  if (digits.startsWith('07') && digits.length === 11) {
    return `+964${digits.slice(1)}`;
  }
  if (digits.startsWith('7') && digits.length === 10) {
    return `+964${digits}`;
  }
  if (input.startsWith('+964') && digits.length === 13) {
    return `+${digits}`;
  }
  return null;
}

/** Address API expects 07XXXXXXXXX */
export function toLocalIraqPhone(e164: string): string | null {
  const normalized = toE164Iraq(e164);
  if (!normalized) return null;
  return `0${normalized.slice(4)}`;
}

export function maskPhone(e164: string): string {
  if (e164.length < 8) return e164;
  return `${e164.slice(0, 5)}***${e164.slice(-4)}`;
}
