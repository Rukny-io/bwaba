import { api } from '@/lib/api-client';

export interface GoogleDriveStatus {
  connected: boolean;
  formId?: string;
}

export async function getGoogleDriveStatus(
  formId: string,
): Promise<GoogleDriveStatus> {
  const { data } = await api.get<GoogleDriveStatus>(
    `/integrations/google-drive/status/${encodeURIComponent(formId)}`,
  );
  return data;
}
