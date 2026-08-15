import { api } from '@/lib/api-client';
import type { DeveloperWebhook, DeveloperWebhookCreated } from '@/lib/api/types';

export async function listWebhooks(
  appId?: string,
): Promise<DeveloperWebhook[]> {
  const { data } = await api.get<DeveloperWebhook[]>('/developer/webhooks', {
    appId,
  });
  return Array.isArray(data) ? data : [];
}

export async function createWebhook(body: {
  url: string;
  events: string[];
  description?: string;
  appId?: string;
}): Promise<DeveloperWebhookCreated> {
  const { data } = await api.post<DeveloperWebhookCreated>(
    '/developer/webhooks',
    body,
  );
  return data;
}

export async function updateWebhook(
  id: string,
  body: { url?: string; events?: string[]; description?: string; status?: string },
): Promise<DeveloperWebhook> {
  const { data } = await api.patch<DeveloperWebhook>(
    `/developer/webhooks/${id}`,
    body,
  );
  return data;
}

export async function deleteWebhook(id: string): Promise<void> {
  await api.delete(`/developer/webhooks/${id}`);
}

export async function testWebhook(id: string): Promise<{ success: boolean }> {
  const { data } = await api.post<{ success: boolean }>(
    `/developer/webhooks/${id}/test`,
  );
  return data;
}

export async function rotateWebhookSecret(
  id: string,
): Promise<{ secret: string }> {
  const { data } = await api.post<{ secret: string }>(
    `/developer/webhooks/${id}/rotate-secret`,
  );
  return data;
}
