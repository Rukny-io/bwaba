import { api } from "@/lib/api-client";

export interface EmailDomain {
  domain: string;
  status: "pending" | "verified" | "failed";
  dkimTokens: string[];
  verifiedAt: string | null;
  createdAt: string;
}

export interface EmailSender {
  id: string;
  email: string;
  status: "active" | "suspended";
  domainStatus: "pending" | "verified" | "failed";
  createdAt: string;
}

export interface EmailSubscriptionSummary {
  plan: {
    id: string;
    name: string;
    marketingNameEn: string;
    marketingNameAr: string;
    invoiceLabelEn: string;
    invoiceLabelAr: string;
    tier: string;
    slug: string;
    priceIqd: number;
    monthlyQuota: number;
    overagePer1kIqd: number;
    domainsIncluded: number;
  };
  free: {
    quota: number;
    used: number;
    remaining: number;
    dailyLimit: number;
    dailyUsed: number;
    dailyRemaining: number;
    periodEndsAt: string | null;
  };
  subscription: {
    status: string;
    priceIqd: number;
    quota: number;
    used: number;
    remaining: number;
    packCredits: number;
    periodEndsAt: string | null;
  };
  marketing: {
    plan: string;
    name?: string;
    marketingNameEn?: string;
    marketingNameAr?: string;
    invoiceLabelEn?: string;
    invoiceLabelAr?: string;
    tier?: string;
    slug?: string;
    contactsLimit: number;
    contactsUsed: number;
    contactsRemaining: number;
    priceIqd: number;
  };
  automations: {
    included: number;
    used: number;
    remaining: number;
    overagePriceIqd: number;
  };
  addons: {
    domainsExtraPacks: number;
    dedicatedIpEnabled: boolean;
    ssoEnabled: boolean;
  };
  /** Legacy */
  trial: { quota: number; used: number; remaining: number };
  catalog?: {
    transactional: Array<{
      id: string;
      marketingNameEn: string;
      priceMonthlyIqd: number;
      monthlyQuota: number;
    }>;
    marketing: unknown[];
    overagePack: { emails: number; priceIqd: number };
  };
}

export interface EmailApiTryResponse {
  status: number;
  body: unknown;
  keyFingerprint: string;
}

const base = (appId: string) =>
  `/developer/apps/${encodeURIComponent(appId)}/email`;

export async function listEmailDomains(appId: string): Promise<EmailDomain[]> {
  const { data } = await api.get<EmailDomain[]>(`${base(appId)}/domains`);
  return Array.isArray(data) ? data : [];
}

export async function createEmailDomain(
  appId: string,
  domain: string,
): Promise<EmailDomain> {
  const { data } = await api.post<EmailDomain>(`${base(appId)}/domains`, {
    domain,
  });
  return data;
}

export async function refreshEmailDomain(
  appId: string,
  domain: string,
): Promise<EmailDomain> {
  const { data } = await api.get<EmailDomain>(
    `${base(appId)}/domains/${encodeURIComponent(domain)}`,
  );
  return data;
}

export async function listEmailSenders(appId: string): Promise<EmailSender[]> {
  const { data } = await api.get<EmailSender[]>(`${base(appId)}/senders`);
  return Array.isArray(data) ? data : [];
}

export async function createEmailSender(
  appId: string,
  email: string,
): Promise<EmailSender> {
  const { data } = await api.post<EmailSender>(`${base(appId)}/senders`, {
    email,
  });
  return data;
}

export async function getEmailSubscription(): Promise<EmailSubscriptionSummary> {
  const { data } = await api.get<EmailSubscriptionSummary>(
    "/developer/email/subscription",
  );
  return data;
}

export async function getEmailPlans() {
  const { data } = await api.get("/developer/email/plans");
  return data;
}

export async function requestEmailPlan(plan: string): Promise<{
  ticketId: string;
  ticketNumber: string;
}> {
  const { data } = await api.post<{ ticketId: string; ticketNumber: string }>(
    "/developer/email/subscription/request",
    { plan },
  );
  return data;
}

/** @deprecated Use requestEmailPlan('PRO_10K') */
export async function requestEmailStarter(): Promise<{
  ticketId: string;
  ticketNumber: string;
}> {
  return requestEmailPlan("PRO_10K");
}

export async function purchaseEmailOverage(packs: number) {
  const { data } = await api.post("/developer/email/subscription/overage/purchase", {
    packs,
  });
  return data;
}

export async function executeEmailApiTry(input: {
  appId: string;
  apiKeySlug: string;
  from: string;
  to: string;
  subject: string;
  bodyText: string;
}): Promise<EmailApiTryResponse> {
  const { data } = await api.post<EmailApiTryResponse>(
    "/developer/email/api-try",
    input,
  );
  return data;
}
