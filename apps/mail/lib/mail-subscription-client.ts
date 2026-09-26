import { sessionFetch } from "@/lib/api-client";
import { isValidMailAppId, readMailAppIdFromDocument } from "@/lib/mail-app-id";
import {
  isMailPlanId,
  toApiMailPlan,
  type MailPlanId,
  type MailPlanLimits,
} from "@/lib/mail-plans";

export type MailSubscriptionPaymentView = {
  id: string;
  amount: number;
  billingCycle?: string;
  mailboxCount?: number;
  status: string;
  paymentId?: string | null;
  paidAt?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
  receiptUrl?: string | null;
  createdAt?: string | null;
};

export type MailSubscriptionView = {
  id: string;
  mailAppId: string | null;
  planId: MailPlanId;
  plan: string;
  planName: string;
  status: string;
  billingCycle?: string;
  mailboxCount: number;
  priceMonthlyPerMailbox: number;
  monthlyTotal: number;
  renewsAt: string | null;
  currentPeriodEnd: string | null;
  cancelledAt?: string | null;
  limits: MailPlanLimits;
  storageQuotaBytesPerMailbox: number;
  features: {
    agenticMail: boolean;
    aiToolsUnlimited: boolean;
    openTracking: boolean;
    smartAiReplies: boolean;
    automaticReplies: boolean;
    linkAndFileTracking: boolean;
    premiumDelivery: boolean;
  };
  payments?: MailSubscriptionPaymentView[];
};

export type MailPendingPlanRequest = {
  ticketId: string;
  ticketNumber: string;
  plan: string | null;
  mailboxCount: number;
  monthlyTotal: number | null;
  createdAt: string;
};

export type MailUnifiedPlanSnapshot = {
  id: string;
  marketingNameEn: string;
  priceMonthlyIqd: number;
  monthlyQuota: number;
};

export type MailDomainQuotaSnapshot = {
  used: number;
  limit: number;
  remaining: number;
  planId: string;
  marketingNameEn: string;
  domains: string[];
};

export type MailAppSubscriptionSnapshot = {
  app: { appId: string; name: string; primaryDomain: string | null } | null;
  unifiedPlan?: MailUnifiedPlanSnapshot | null;
  domainQuota?: MailDomainQuotaSnapshot | null;
  subscription: MailSubscriptionView | null;
  pendingRequest: MailPendingPlanRequest | null;
  needsApp: boolean;
  canManageBilling?: boolean;
  isOwner?: boolean;
  role?: string;
};

type PlansResponse = {
  currency: string;
  cardPayments?: {
    available?: boolean;
    status?: string;
    provider?: string;
  };
  plans: Array<{
    id: string;
    planId: string;
    name: string;
    bestFor: string;
    priceMonthly: number;
    priceExtraMailbox?: number;
    popular: boolean;
    highlights: string[];
    limits: MailPlanLimits;
    benefits: string[];
  }>;
};

export type MailCardPaymentsInfo = {
  available: boolean;
  status: string;
  provider?: string;
};

export type MailPayResponse = {
  success: boolean;
  paymentId: string;
  qasehPaymentId: string;
  amount: number;
  currency: string;
  plan: string;
  mailboxCount: number;
  paymentUrl: string;
};

async function readJson<T>(response: Response): Promise<T & { message?: string | string[]; error?: string }> {
  return (await response.json().catch(() => ({}))) as T & {
    message?: string | string[];
    error?: string;
  };
}

function errorMessage(data: { message?: string | string[]; error?: string }, fallback: string) {
  const raw = data.message ?? data.error;
  if (Array.isArray(raw)) return raw[0] || fallback;
  return raw || fallback;
}

function emptyFeatures(): MailSubscriptionView["features"] {
  return {
    agenticMail: false,
    aiToolsUnlimited: false,
    openTracking: false,
    smartAiReplies: false,
    automaticReplies: false,
    linkAndFileTracking: false,
    premiumDelivery: false,
  };
}

function normalizePayment(raw: unknown): MailSubscriptionPaymentView | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === "string" ? row.id : "";
  if (!id) return null;
  return {
    id,
    amount: Number(row.amount) || 0,
    billingCycle: typeof row.billingCycle === "string" ? row.billingCycle : undefined,
    mailboxCount: typeof row.mailboxCount === "number" ? row.mailboxCount : undefined,
    status: typeof row.status === "string" ? row.status : "PENDING",
    paymentId: typeof row.paymentId === "string" ? row.paymentId : null,
    paidAt: typeof row.paidAt === "string" ? row.paidAt : null,
    failedAt: typeof row.failedAt === "string" ? row.failedAt : null,
    failureReason: typeof row.failureReason === "string" ? row.failureReason : null,
    receiptUrl: typeof row.receiptUrl === "string" ? row.receiptUrl : null,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : null,
  };
}

function normalizeSubscription(sub: MailSubscriptionView): MailSubscriptionView {
  const payments = Array.isArray(sub.payments)
    ? sub.payments.map(normalizePayment).filter(Boolean)
    : [];
  return {
    ...sub,
    planId: isMailPlanId(sub.planId)
      ? sub.planId
      : ((sub.plan || "").toLowerCase() as MailPlanId),
    renewsAt: sub.renewsAt ?? sub.currentPeriodEnd,
    storageQuotaBytesPerMailbox: Number(sub.storageQuotaBytesPerMailbox) || 0,
    features: sub.features ?? emptyFeatures(),
    payments: payments as MailSubscriptionPaymentView[],
  };
}

export async function fetchMailPlans() {
  const response = await sessionFetch("/api/v1/mail/plans");
  const data = await readJson<PlansResponse>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load plans."));
  }
  return {
    currency: data.currency,
    cardPayments: {
      available: Boolean(data.cardPayments?.available),
      status: data.cardPayments?.status || "unavailable",
      provider: data.cardPayments?.provider,
    } satisfies MailCardPaymentsInfo,
    plans: (data.plans ?? []).map((plan) => ({
      id: (plan.planId || plan.id || "").toLowerCase() as MailPlanId,
      name: plan.name,
      bestFor: plan.bestFor,
      priceMonthly: plan.priceMonthly,
      priceExtraMailbox: plan.priceExtraMailbox ?? 0,
      popular: Boolean(plan.popular),
      highlights: plan.highlights ?? [],
      limits: plan.limits,
      benefits: plan.benefits ?? [],
    })),
  };
}

export async function fetchMailSubscription(
  appId = readMailAppIdFromDocument(),
): Promise<MailAppSubscriptionSnapshot> {
  if (!isValidMailAppId(appId)) {
    return {
      app: null,
      subscription: null,
      pendingRequest: null,
      needsApp: true,
    };
  }

  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/subscription`,
  );
  const data = await readJson<{
    app?: MailAppSubscriptionSnapshot["app"];
    unifiedPlan?: MailUnifiedPlanSnapshot | null;
    domainQuota?: MailDomainQuotaSnapshot | null;
    subscription?: MailSubscriptionView | null;
    pendingRequest?: MailPendingPlanRequest | null;
    canManageBilling?: boolean;
    isOwner?: boolean;
    role?: string;
  }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load subscription."));
  }
  const sub = data.subscription ?? null;
  return {
    app: data.app ?? null,
    unifiedPlan: data.unifiedPlan ?? null,
    domainQuota: data.domainQuota ?? null,
    subscription: sub ? normalizeSubscription(sub) : null,
    pendingRequest: data.pendingRequest ?? null,
    needsApp: false,
    canManageBilling: Boolean(data.canManageBilling),
    isOwner: Boolean(data.isOwner),
    role: typeof data.role === "string" ? data.role : undefined,
  };
}

export async function requestMailPlan(
  planId: MailPlanId,
  mailboxCount: number,
  appId = readMailAppIdFromDocument(),
): Promise<{ alreadyPending: boolean; ticket: MailPendingPlanRequest }> {
  if (!isValidMailAppId(appId)) {
    throw new Error("Open a workspace first, then request a plan for that workspace.");
  }
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/subscription/request`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: toApiMailPlan(planId),
        mailboxCount,
      }),
    },
  );
  const data = await readJson<{
    alreadyPending?: boolean;
    ticket?: MailPendingPlanRequest;
  }>(response);
  if (!response.ok || !data.ticket) {
    throw new Error(errorMessage(data, "Could not submit this plan request."));
  }
  return {
    alreadyPending: Boolean(data.alreadyPending),
    ticket: data.ticket,
  };
}

export async function payMailPlan(
  planId: MailPlanId,
  mailboxCount: number,
  appId = readMailAppIdFromDocument(),
): Promise<MailPayResponse> {
  if (!isValidMailAppId(appId)) {
    throw new Error("Open a workspace first, then pay for that workspace plan.");
  }
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/subscription/pay`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: toApiMailPlan(planId),
        mailboxCount,
      }),
    },
  );
  const data = await readJson<MailPayResponse>(response);
  if (!response.ok || !data.paymentUrl) {
    throw new Error(errorMessage(data, "Could not start card payment."));
  }
  return data;
}

export async function fetchMailPaymentStatus(
  paymentId: string,
  appId = readMailAppIdFromDocument(),
) {
  if (!isValidMailAppId(appId)) {
    throw new Error("Open a workspace first.");
  }
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/subscription/payments/${encodeURIComponent(paymentId)}`,
  );
  const data = await readJson<{
    paymentId: string;
    status: string;
    amount: number;
    currency: string;
    qasehStatus?: string;
    plan?: string | null;
    mailboxCount?: number;
  }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not load payment status."));
  }
  return data;
}

async function downloadMailInvoicePdf(path: string, fallbackName: string) {
  const response = await sessionFetch(path, {
    headers: { Accept: "application/pdf" },
  });
  if (!response.ok) {
    const data = await readJson<{ message?: string | string[]; error?: string }>(response);
    throw new Error(errorMessage(data, "Could not issue invoice."));
  }
  const blob = await response.blob();
  const headerName = response.headers.get("Content-Disposition");
  const matched = headerName?.match(/filename="([^"]+)"/i);
  const filename = matched?.[1] || fallbackName;
  const invoiceNumber = response.headers.get("X-Invoice-Number") || undefined;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  return { filename, invoiceNumber };
}

/** Download a PDF invoice for a completed payment. */
export async function downloadMailPaymentInvoice(
  paymentId: string,
  appId = readMailAppIdFromDocument(),
) {
  if (!isValidMailAppId(appId)) {
    throw new Error("Open a workspace first.");
  }
  return downloadMailInvoicePdf(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/subscription/payments/${encodeURIComponent(paymentId)}/invoice`,
    `rukny-mail-invoice-${paymentId.slice(0, 8)}.pdf`,
  );
}

/** Download a PDF invoice for the current active subscription period. */
export async function downloadMailCurrentPeriodInvoice(
  appId = readMailAppIdFromDocument(),
) {
  if (!isValidMailAppId(appId)) {
    throw new Error("Open a workspace first.");
  }
  return downloadMailInvoicePdf(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/subscription/invoice`,
    "rukny-mail-invoice-current.pdf",
  );
}

/** Send invoice by email and/or WhatsApp (billing managers). */
export async function sendMailPaymentInvoice(
  paymentId: string,
  channels: Array<"email" | "whatsapp"> = ["email", "whatsapp"],
  appId = readMailAppIdFromDocument(),
) {
  if (!isValidMailAppId(appId)) {
    throw new Error("Open a workspace first.");
  }
  const response = await sessionFetch(
    `/api/v1/mail/apps/${encodeURIComponent(appId)}/subscription/payments/${encodeURIComponent(paymentId)}/send-invoice`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channels }),
    },
  );
  const data = await readJson<{
    invoiceNumber?: string;
    emailStatus?: string;
    whatsappStatus?: string;
    downloadUrl?: string;
    message?: string | string[];
    error?: string;
  }>(response);
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not send invoice."));
  }
  return {
    invoiceNumber: data.invoiceNumber || "",
    emailStatus: data.emailStatus || "unknown",
    whatsappStatus: data.whatsappStatus || "unknown",
    downloadUrl: data.downloadUrl || "",
  };
}
