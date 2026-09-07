import { api } from '@/lib/api-client';

export interface EmailDomain {
  domain: string;
  status: 'pending' | 'verified' | 'failed';
  dkimTokens: string[];
  verifiedAt: string | null;
  createdAt: string;
}

export interface EmailSender {
  id: string;
  email: string;
  status: 'active' | 'suspended';
  domainStatus: 'pending' | 'verified' | 'failed';
  createdAt: string;
}

export interface EmailSubscriptionSummary {
  trial: { quota: number; used: number; remaining: number };
  subscription: {
    status: string;
    priceIqd: number;
    quota: number;
    used: number;
    remaining: number;
    periodEndsAt: string | null;
  };
}

const base = (appId: string) => `/developer/apps/${encodeURIComponent(appId)}/email`;

export async function listEmailDomains(appId: string): Promise<EmailDomain[]> {
  const { data } = await api.get<EmailDomain[]>(`${base(appId)}/domains`);
  return Array.isArray(data) ? data : [];
}

export async function createEmailDomain(appId: string, domain: string): Promise<EmailDomain> {
  const { data } = await api.post<EmailDomain>(`${base(appId)}/domains`, { domain });
  return data;
}

export async function refreshEmailDomain(appId: string, domain: string): Promise<EmailDomain> {
  const { data } = await api.get<EmailDomain>(`${base(appId)}/domains/${encodeURIComponent(domain)}`);
  return data;
}

export async function listEmailSenders(appId: string): Promise<EmailSender[]> {
  const { data } = await api.get<EmailSender[]>(`${base(appId)}/senders`);
  return Array.isArray(data) ? data : [];
}

export async function createEmailSender(appId: string, email: string): Promise<EmailSender> {
  const { data } = await api.post<EmailSender>(`${base(appId)}/senders`, { email });
  return data;
}

export async function getEmailSubscription(): Promise<EmailSubscriptionSummary> {
  const { data } = await api.get<EmailSubscriptionSummary>('/developer/email/subscription');
  return data;
}

export async function requestEmailStarter(): Promise<{ ticketId: string; ticketNumber: string }> {
  const { data } = await api.post<{ ticketId: string; ticketNumber: string }>('/developer/email/subscription/request');
  return data;
}

export async function executeEmailApiTry(input: {
  appId: string;
  apiKeySlug: string;
  from: string;
  to: string;
  subject: string;
  bodyText: string;
}): Promise<{ status: number; body: unknown; keyFingerprint: string }> {
  const { data } = await api.post('/developer/email/api-try', input);
  return data;
}
