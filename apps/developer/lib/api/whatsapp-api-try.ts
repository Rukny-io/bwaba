import { api } from '@/lib/api-client';

export interface WhatsappApiTryRequest {
  appId: string;
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  body?: unknown;
  apiKeySlug: string;
}

export interface WhatsappApiTryResponse {
  status: number;
  body: unknown;
  keyFingerprint: string;
}

export async function executeWhatsappApiTry(
  input: WhatsappApiTryRequest,
): Promise<WhatsappApiTryResponse> {
  const { data } = await api.post<WhatsappApiTryResponse>(
    '/developer/whatsapp/api-try',
    input,
  );
  return data;
}
