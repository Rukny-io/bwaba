import { api } from '@/lib/api-client';
import { getForm, type FormDetail } from '@/lib/forms-api';
import {
  getGoogleSheetsStatus,
  type GoogleSheetsStatus,
} from '@/lib/google-sheets-api';

export const WEBHOOK_EVENT_OPTIONS = [
  {
    value: 'form.submission.created',
    label: 'استجابة جديدة',
  },
  {
    value: 'form.submission.updated',
    label: 'تحديث استجابة',
  },
  {
    value: 'form.submission.deleted',
    label: 'حذف استجابة',
  },
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENT_OPTIONS)[number]['value'];

export interface IntegrationsFormRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  submissionCount: number;
  updatedAt: string;
  googleSheets: {
    connected: boolean;
    spreadsheetUrl: string | null;
    isAutoSync: boolean;
    lastSyncAt: string | null;
    syncedCount: number;
  };
  webhook: {
    enabled: boolean;
    url: string | null;
    events: string[];
    configured: boolean;
  };
  email: {
    enabled: boolean;
    address: string | null;
    configured: boolean;
  };
}

export interface ActivityLogItem {
  id: string;
  formId: string;
  formTitle: string;
  formSlug: string;
  eventId: string;
  status: string;
  responseCode: number | null;
  latencyMs: number | null;
  errorMessage: string | null;
  createdAt: string;
  webhookUrl: string;
  type: 'webhook';
}

/** @deprecated use ActivityLogItem */
export type WebhookDeliveryItem = ActivityLogItem;

export interface WebhookTestResult {
  success: boolean;
  statusCode?: number;
  latencyMs: number;
  errorMessage?: string;
}

export interface FormIntegrationSettingsPayload {
  webhookEnabled?: boolean;
  webhookUrl?: string;
  webhookEvents?: string[];
  notifyOnSubmission?: boolean;
  notificationEmail?: string;
}

function buildFormRow(
  form: {
    id: string;
    title: string;
    slug: string;
    status: string;
    submissionCount?: number;
    updatedAt: string;
    webhookEnabled?: boolean;
    webhookUrl?: string | null;
    webhookEvents?: string[];
    notifyOnSubmission?: boolean;
    notificationEmail?: string | null;
  },
  sheets: {
    connected: boolean;
    spreadsheetUrl?: string | null;
    isAutoSync?: boolean;
    lastSyncAt?: string | null;
    syncedCount?: number;
  },
): IntegrationsFormRow {
  const webhookEnabled = Boolean(form.webhookEnabled);
  const webhookUrl = form.webhookUrl ?? null;
  const notifyOnSubmission = form.notifyOnSubmission !== false;
  const notificationEmail = form.notificationEmail ?? null;

  return {
    id: form.id,
    title: form.title,
    slug: form.slug,
    status: form.status,
    submissionCount: form.submissionCount ?? 0,
    updatedAt: form.updatedAt,
    googleSheets: {
      connected: sheets.connected,
      spreadsheetUrl: sheets.spreadsheetUrl ?? null,
      isAutoSync: sheets.isAutoSync ?? false,
      lastSyncAt: sheets.lastSyncAt ?? null,
      syncedCount: sheets.syncedCount ?? 0,
    },
    webhook: {
      enabled: webhookEnabled,
      url: webhookUrl,
      events: form.webhookEvents ?? [],
      configured: Boolean(webhookEnabled && webhookUrl),
    },
    email: {
      enabled: notifyOnSubmission,
      address: notificationEmail,
      configured: Boolean(notifyOnSubmission && notificationEmail),
    },
  };
}

function integrationFieldsFromDetail(
  detail: FormDetail,
): Pick<
  IntegrationsFormRow,
  never
> & {
  webhookEnabled?: boolean;
  webhookUrl?: string | null;
  webhookEvents?: string[];
  notifyOnSubmission?: boolean;
  notificationEmail?: string | null;
} {
  return {
    webhookEnabled: detail.webhookEnabled,
    webhookUrl: detail.webhookUrl,
    webhookEvents: detail.webhookEvents,
    notifyOnSubmission: detail.notifyOnSubmission,
    notificationEmail: detail.notificationEmail,
  };
}

export async function getFormIntegrationsRow(
  formId: string,
): Promise<IntegrationsFormRow> {
  const [detail, sheets] = await Promise.all([
    getForm(formId),
    getGoogleSheetsStatus(formId).catch(
      (): GoogleSheetsStatus => ({ connected: false }),
    ),
  ]);

  const integration = integrationFieldsFromDetail(detail);

  return buildFormRow(
    {
      id: detail.id,
      title: detail.title,
      slug: detail.slug,
      status: detail.status,
      submissionCount: detail.submissionCount,
      updatedAt: detail.updatedAt,
      ...integration,
    },
    {
      connected: sheets.connected,
      spreadsheetUrl: sheets.spreadsheetUrl,
      isAutoSync: sheets.isAutoSync,
      lastSyncAt: sheets.lastSyncAt ?? null,
      syncedCount: sheets.syncedCount ?? 0,
    },
  );
}

export async function getWebhookDeliveries(
  formId: string,
  limit = 20,
): Promise<ActivityLogItem[]> {
  const { data } = await api.get<ActivityLogItem[]>(
    `/forms/${encodeURIComponent(formId)}/webhook-deliveries`,
    { limit },
  );
  return data.map((d) => ({ ...d, type: 'webhook' as const }));
}

export async function testFormWebhook(
  formId: string,
): Promise<WebhookTestResult> {
  const { data } = await api.post<WebhookTestResult>(
    `/forms/${encodeURIComponent(formId)}/webhooks/test`,
  );
  return data;
}

export async function regenerateWebhookSecret(
  formId: string,
): Promise<{ webhookSecret: string }> {
  const { data } = await api.post<{ webhookSecret: string }>(
    `/forms/${encodeURIComponent(formId)}/webhooks/regenerate-secret`,
  );
  return data;
}

export async function updateFormIntegrations(
  formId: string,
  payload: FormIntegrationSettingsPayload,
): Promise<void> {
  await api.put(`/forms/${encodeURIComponent(formId)}`, payload);
}
