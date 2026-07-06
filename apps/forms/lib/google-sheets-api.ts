import { api } from '@/lib/api-client';

export interface GoogleSheetsStatus {
  connected: boolean;
  spreadsheetId?: string | null;
  spreadsheetUrl?: string | null;
  isAutoSync?: boolean;
  lastSyncAt?: string | null;
  syncedCount?: number;
}

export async function getGoogleSheetsStatus(
  formId: string,
): Promise<GoogleSheetsStatus> {
  const { data } = await api.get<GoogleSheetsStatus>(
    `/integrations/google-sheets/status/${encodeURIComponent(formId)}`,
  );
  return data;
}

export async function getGoogleSheetsConnectUrl(
  formId: string,
): Promise<{ authUrl: string }> {
  const { data } = await api.get<{ authUrl: string }>(
    `/integrations/google-sheets/connect/${encodeURIComponent(formId)}`,
  );
  return data;
}

export async function exportToGoogleSheets(formId: string): Promise<unknown> {
  const { data } = await api.post(
    `/integrations/google-sheets/export/${encodeURIComponent(formId)}`,
  );
  return data;
}

export async function setGoogleSheetsAutoSync(
  formId: string,
  enabled: boolean,
): Promise<unknown> {
  const { data } = await api.post(
    `/integrations/google-sheets/auto-sync/${encodeURIComponent(formId)}`,
    { enabled },
  );
  return data;
}

export async function disconnectGoogleSheets(formId: string): Promise<void> {
  await api.delete(
    `/integrations/google-sheets/disconnect/${encodeURIComponent(formId)}`,
  );
}
