import { api } from '@/lib/api-client';
import type {
  EmbeddedSignupConfig,
  WhatsappAccountSummary,
  WhatsappPhoneSummary,
  WhatsappTemplate,
} from '@/lib/api/types';

function appParams(appId: string) {
  return { appId };
}

export async function getEmbeddedSignupConfig(): Promise<EmbeddedSignupConfig> {
  const { data } = await api.get<EmbeddedSignupConfig>(
    '/developer/whatsapp/embedded-signup-config',
  );
  return data;
}

export async function connectWhatsappAccount(
  appId: string,
  code: string,
  wabaId?: string,
): Promise<WhatsappAccountSummary> {
  const { data } = await api.post<WhatsappAccountSummary>(
    '/developer/whatsapp/connect',
    { appId, code, wabaId },
  );
  return data;
}

export async function listWhatsappAccounts(
  publicAppId: string,
): Promise<WhatsappAccountSummary[]> {
  const { data } = await api.get<WhatsappAccountSummary[]>(
    '/developer/whatsapp/accounts',
    appParams(publicAppId),
  );
  return Array.isArray(data) ? data : [];
}

export async function disconnectWhatsappAccount(
  appId: string,
  accountId: string,
): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(
    `/developer/whatsapp/accounts/${accountId}`,
    appParams(appId),
  );
  return data;
}

export async function refreshWhatsappAccount(
  appId: string,
  accountId: string,
): Promise<WhatsappAccountSummary> {
  const { data } = await api.post<WhatsappAccountSummary>(
    `/developer/whatsapp/accounts/${accountId}/refresh`,
    undefined,
    appParams(appId),
  );
  return data;
}

export async function getPhoneNumber(
  appId: string,
  phoneId: string,
): Promise<WhatsappPhoneSummary> {
  const { data } = await api.get<WhatsappPhoneSummary>(
    `/developer/whatsapp/phone-numbers/${phoneId}`,
    appParams(appId),
  );
  return data;
}

export async function listPhoneNumbers(
  appId: string,
): Promise<WhatsappPhoneSummary[]> {
  const { data } = await api.get<WhatsappPhoneSummary[]>(
    '/developer/whatsapp/phone-numbers',
    appParams(appId),
  );
  return Array.isArray(data) ? data : [];
}

export async function registerPhoneNumber(
  appId: string,
  phoneId: string,
  pin: string,
): Promise<WhatsappPhoneSummary> {
  const { data } = await api.post<WhatsappPhoneSummary>(
    `/developer/whatsapp/phone-numbers/${phoneId}/register`,
    { pin },
    appParams(appId),
  );
  return data;
}

export async function updatePhoneProfile(
  appId: string,
  phoneId: string,
  body: {
    about?: string;
    email?: string;
    description?: string;
    address?: string;
    websites?: string[];
    profilePictureUrl?: string;
  },
): Promise<WhatsappPhoneSummary> {
  const { data } = await api.patch<WhatsappPhoneSummary>(
    `/developer/whatsapp/phone-numbers/${phoneId}/profile`,
    body,
    appParams(appId),
  );
  return data;
}

export async function sendTestMessage(
  appId: string,
  phoneId: string,
  to: string,
): Promise<{ success: boolean; messageId?: string }> {
  const { data } = await api.post<{ success: boolean; messageId?: string }>(
    `/developer/whatsapp/phone-numbers/${phoneId}/send-test`,
    { to },
    appParams(appId),
  );
  return data;
}

export async function listWhatsappTemplates(
  appId: string,
  accountId?: string,
): Promise<WhatsappTemplate[]> {
  const { data } = await api.get<WhatsappTemplate[]>(
    '/developer/whatsapp/templates',
    { appId, accountId },
  );
  return Array.isArray(data) ? data : [];
}

export async function syncWhatsappTemplates(
  appId: string,
  accountId?: string,
): Promise<{ synced: number }> {
  const { data } = await api.post<{ synced: number }>(
    '/developer/whatsapp/templates/sync',
    undefined,
    { appId, accountId },
  );
  return data;
}

export interface CreateWhatsappTemplatePayload {
  accountId?: string;
  name: string;
  language: string;
  category: string;
  components: Record<string, unknown>[];
}

export async function createWhatsappTemplate(
  appId: string,
  payload: CreateWhatsappTemplatePayload,
): Promise<WhatsappTemplate> {
  const { data } = await api.post<WhatsappTemplate>(
    '/developer/whatsapp/templates',
    payload,
    appParams(appId),
  );
  return data;
}
