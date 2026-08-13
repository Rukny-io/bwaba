import { api } from '@/lib/api-client';

export type LinkedFormStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export interface LinkedFormSummary {
  id: string;
  title: string;
  slug: string;
  status: LinkedFormStatus;
  submissionCount: number;
  viewCount: number;
  webhookEnabled: boolean;
  webhookUrl: string | null;
  isLinked: boolean;
  embedReady: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableFormSummary extends LinkedFormSummary {
  isLinked: boolean;
  linkedElsewhere: boolean;
}

export interface FormsAppSummary {
  appId: string;
  linkedCount: number;
  publishedCount: number;
  totalSubmissions: number;
  totalViews: number;
  embedOrigins: string[];
  embedAllowedConfigured: string[];
  websiteOrigin: string | null;
  formsInstalled?: boolean;
}

export interface LinkedFormDetail extends LinkedFormSummary {
  embed: {
    allowedOrigins: string[];
    embedEnabled: boolean;
    requiresWebsiteOrOrigins: boolean;
  };
}

export interface EmbedOriginsUpdateResult {
  appId: string;
  allowedOrigins: string[];
  configuredOrigins: string[];
}

export async function getFormsAppSummary(
  publicAppId: string,
): Promise<FormsAppSummary> {
  const { data } = await api.get<FormsAppSummary>('/developer/forms/summary', {
    appId: publicAppId,
  });
  return data;
}

export async function listLinkedForms(
  publicAppId: string,
): Promise<LinkedFormSummary[]> {
  const { data } = await api.get<LinkedFormSummary[]>('/developer/forms', {
    appId: publicAppId,
  });
  return Array.isArray(data) ? data : [];
}

export async function listAvailableForms(
  publicAppId: string,
): Promise<AvailableFormSummary[]> {
  const { data } = await api.get<AvailableFormSummary[]>(
    '/developer/forms/available',
    { appId: publicAppId },
  );
  return Array.isArray(data) ? data : [];
}

export async function getLinkedFormDetail(
  publicAppId: string,
  formId: string,
): Promise<LinkedFormDetail> {
  const { data } = await api.get<LinkedFormDetail>(
    `/developer/forms/${formId}`,
    { appId: publicAppId },
  );
  return data;
}

export async function linkFormToApp(
  publicAppId: string,
  formId: string,
): Promise<LinkedFormSummary> {
  const { data } = await api.post<LinkedFormSummary>('/developer/forms/link', {
    appId: publicAppId,
    formId,
  });
  return data;
}

export async function unlinkFormFromApp(
  publicAppId: string,
  formId: string,
): Promise<LinkedFormSummary> {
  const { data } = await api.delete<LinkedFormSummary>(
    `/developer/forms/${formId}/link?appId=${encodeURIComponent(publicAppId)}`,
  );
  return data;
}

export async function updateEmbedOrigins(
  publicAppId: string,
  allowedOrigins: string[],
): Promise<EmbedOriginsUpdateResult> {
  const { data } = await api.patch<EmbedOriginsUpdateResult>(
    '/developer/forms/embed-origins',
    { appId: publicAppId, allowedOrigins },
  );
  return data;
}
