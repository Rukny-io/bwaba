import { getCheckoutSession } from '@/lib/session';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export class CheckoutApiError extends Error {
  status: number;
  code?: string;
  body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'CheckoutApiError';
    this.status = status;
    this.body = body;
    if (body && typeof body === 'object' && body !== null && 'code' in body) {
      this.code = String((body as { code?: string }).code || '');
    }
  }
}

async function parseError(res: Response): Promise<CheckoutApiError> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = undefined;
  }

  let message = `Request failed (${res.status})`;
  if (body && typeof body === 'object' && body !== null && 'message' in body) {
    const raw = (body as { message: unknown }).message;
    if (Array.isArray(raw)) {
      message = String(raw[0] ?? message);
    } else if (typeof raw === 'string' && raw.trim()) {
      message = raw;
    }
  }

  return new CheckoutApiError(message, res.status, body);
}

async function apiFetch<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = false, headers, ...rest } = init;
  const finalHeaders = new Headers(headers);
  if (!finalHeaders.has('Content-Type') && rest.body) {
    finalHeaders.set('Content-Type', 'application/json');
  }
  if (auth) {
    const session = getCheckoutSession();
    if (session?.accessToken) {
      finalHeaders.set('Authorization', `Bearer ${session.accessToken}`);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export type OtpRequestResponse = {
  otpId: string;
  sentVia?: 'WHATSAPP' | 'EMAIL';
  message?: string;
  expiresIn?: number;
};

export type OtpVerifyResponse = {
  accessToken: string;
  token?: string;
  verified?: boolean;
  userId?: string;
  phoneNumber?: string;
};

export type CheckoutAddress = {
  id: string;
  label: string;
  fullName: string;
  phoneNumber: string;
  country?: string;
  city: string;
  district?: string | null;
  street: string;
  buildingNo?: string | null;
  floor?: string | null;
  apartmentNo?: string | null;
  landmark?: string | null;
  isDefault?: boolean;
};

export type CreateAddressPayload = {
  phoneNumber: string;
  label: string;
  fullName: string;
  city: string;
  street: string;
  district?: string;
  buildingNo?: string;
  floor?: string;
  apartmentNo?: string;
  landmark?: string;
  country?: string;
  isDefault?: boolean;
};

export type CreateOrderPayload = {
  shippingAddressId: string;
  paymentMethod: 'QASEH_CARD' | 'CASH' | 'BANK_TRANSFER';
  items: { productId: string; quantity: number; variantId?: string }[];
  notes?: string;
  couponCode?: string;
  phoneNumber?: string;
};

export type CreateOrderResponse = {
  success?: boolean;
  message?: string;
  orders?: Array<{
    id: string;
    orderNumber: string;
    paymentStatus?: string;
    total?: number | string;
    currency?: string;
  }>;
  payment?: {
    paymentId?: string;
    paymentUrl?: string;
    token?: string;
  };
};

export type PaymentStatusResponse = {
  orderId: string;
  orderNumber: string;
  paymentStatus: string;
  qasehStatus?: string;
  amount?: number;
  currency?: string;
};

export function requestCheckoutOtp(body: {
  phoneNumber?: string;
  email?: string;
  preferEmail?: boolean;
}) {
  return apiFetch<OtpRequestResponse>('/auth/checkout/request-otp', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function verifyCheckoutOtp(body: {
  phoneNumber?: string;
  email?: string;
  code: string;
  otpId: string;
}) {
  return apiFetch<OtpVerifyResponse>('/auth/checkout/verify-otp', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function resendCheckoutOtp(body: {
  phoneNumber?: string;
  otpId?: string;
  email?: string;
  preferEmail?: boolean;
}) {
  return apiFetch<OtpRequestResponse>('/auth/checkout/resend-otp', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function listAddresses(phoneNumber: string) {
  const q = encodeURIComponent(phoneNumber);
  return apiFetch<
    | CheckoutAddress[]
    | { data: CheckoutAddress[] }
    | { addresses: CheckoutAddress[] }
  >(`/checkout/addresses?phoneNumber=${q}`, { auth: true }).then((res) => {
    if (Array.isArray(res)) return res;
    if ('addresses' in res && Array.isArray(res.addresses)) return res.addresses;
    if ('data' in res && Array.isArray(res.data)) return res.data;
    return [];
  });
}

export function createAddress(payload: CreateAddressPayload) {
  return apiFetch<CheckoutAddress | { address: CheckoutAddress }>(
    '/checkout/addresses',
    {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    },
  ).then((res) => ('address' in res ? res.address : res));
}

export function createCheckoutOrder(payload: CreateOrderPayload) {
  return apiFetch<CreateOrderResponse>('/checkout/orders', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export type CheckoutPaymentOptions = {
  success?: boolean;
  card: boolean;
  cashOnDelivery: boolean;
  reason?: string;
  storeId?: string;
  storeName?: string;
};

export function getCheckoutPaymentOptions(productIds: string[]) {
  const q = encodeURIComponent(productIds.join(','));
  return apiFetch<CheckoutPaymentOptions>(
    `/checkout/payment-options?productIds=${q}`,
    { auth: true },
  );
}

export type StorePreview = {
  id: string;
  name: string;
  slug: string;
};

export function getStoreBySlug(slug: string) {
  return apiFetch<StorePreview | { data: StorePreview }>(
    `/stores/slug/${encodeURIComponent(slug)}`,
  ).then((res) => ('data' in res && res.data ? res.data : res as StorePreview));
}

export function getPaymentStatus(orderId: string) {
  return apiFetch<PaymentStatusResponse>(`/payments/qaseh/status/${orderId}`, {
    auth: true,
  });
}

export type MailCheckoutSessionPreview = {
  sessionId: string;
  product: 'mail';
  plan: string;
  planName: string;
  mailboxCount: number;
  amount: number;
  currency: string;
  appId: string;
  appName: string;
  returnUrl: string;
  digital: boolean;
  expiresAt?: string;
  expiresIn?: number;
  kind?: 'subscription' | 'outbound_pack';
  outboundPackThousands?: number | null;
  outboundPackEmails?: number | null;
};

export type MailCheckoutPayResponse = {
  success?: boolean;
  paymentId: string;
  qasehPaymentId?: string;
  amount: number;
  currency: string;
  plan: string;
  mailboxCount: number;
  paymentUrl: string;
};

export function getMailCheckoutSession(sessionId: string) {
  return apiFetch<MailCheckoutSessionPreview>(
    `/mail/checkout-sessions/${encodeURIComponent(sessionId)}`,
  );
}

export function payMailCheckoutSession(sessionId: string) {
  return apiFetch<MailCheckoutPayResponse>(
    `/mail/checkout-sessions/${encodeURIComponent(sessionId)}/pay`,
    {
      method: 'POST',
      auth: true,
      body: JSON.stringify({}),
    },
  );
}

export type DeveloperCheckoutSessionPreview = {
  sessionId: string;
  product: 'developer';
  kind: 'WALLET_TOPUP' | 'PRO_UPGRADE';
  title: string;
  amount: number;
  currency: string;
  billingCycle?: 'MONTHLY' | 'YEARLY' | null;
  appId?: string | null;
  returnUrl: string;
  digital: boolean;
  expiresAt?: string;
  expiresIn?: number;
};

export type DeveloperCheckoutPayResponse = {
  success?: boolean;
  paymentId: string;
  qasehPaymentId?: string;
  amount: number;
  currency: string;
  kind: 'WALLET_TOPUP' | 'PRO_UPGRADE';
  paymentUrl: string;
};

export function getDeveloperCheckoutSession(sessionId: string) {
  return apiFetch<DeveloperCheckoutSessionPreview>(
    `/developer/checkout-sessions/${encodeURIComponent(sessionId)}`,
  );
}

export function payDeveloperCheckoutSession(sessionId: string) {
  return apiFetch<DeveloperCheckoutPayResponse>(
    `/developer/checkout-sessions/${encodeURIComponent(sessionId)}/pay`,
    {
      method: 'POST',
      auth: true,
      body: JSON.stringify({}),
    },
  );
}

export type MailInvoiceDeliveryStatus = {
  paymentId: string;
  paymentStatus?: string;
  status: string;
  amount: number;
  mailboxCount: number;
  appName: string;
  invoiceNumber: string | null;
  deliveredAt: string | null;
  emailStatus: string;
  whatsappStatus: string;
  emailMasked: string | null;
  phoneMasked: string | null;
  downloadUrl: string | null;
};

export type MailPublicPaymentStatus = {
  paymentId: string;
  paymentStatus: string;
  amount: number;
  mailboxCount: number;
  appId: string;
  appName: string;
  qasehPaymentId: string | null;
};

export function getMailInvoiceDeliveryStatus(
  paymentId: string,
  token: string,
) {
  return apiFetch<MailInvoiceDeliveryStatus>(
    `/mail/payments/${encodeURIComponent(paymentId)}/invoice-delivery?token=${encodeURIComponent(token)}`,
  );
}

export function getMailPublicPaymentStatus(paymentId: string, token: string) {
  return apiFetch<MailPublicPaymentStatus>(
    `/mail/payments/${encodeURIComponent(paymentId)}/public-status?token=${encodeURIComponent(token)}`,
  );
}
