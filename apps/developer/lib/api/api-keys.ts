import { api } from '@/lib/api-client';
import type {
  CreateApiKeyInput,
  CreatedApiKeyResponse,
  DeveloperApiKey,
  UpdateApiKeyInput,
} from '@/lib/api/types';

export async function listApiKeys(
  developerAppId: string,
): Promise<DeveloperApiKey[]> {
  const { data } = await api.get<DeveloperApiKey[]>('/developer/api-keys', {
    developerAppId,
  });
  return Array.isArray(data) ? data : [];
}

export async function createApiKey(
  input: CreateApiKeyInput,
): Promise<CreatedApiKeyResponse> {
  const { data } = await api.post<CreatedApiKeyResponse>(
    '/developer/api-keys',
    input,
  );
  return data;
}

export async function updateApiKey(
  keySlug: string,
  input: UpdateApiKeyInput,
): Promise<DeveloperApiKey> {
  const { data } = await api.patch<DeveloperApiKey>(
    `/developer/api-keys/${keySlug}`,
    input,
  );
  return data;
}

export async function revokeApiKey(keySlug: string): Promise<void> {
  await api.delete(`/developer/api-keys/${keySlug}`);
}

export async function revealApiKey(
  keySlug: string,
  token: string,
): Promise<{ key: string }> {
  const { data } = await api.post<{ key: string }>(
    `/developer/api-keys/${keySlug}/reveal`,
    { token },
  );
  return data;
}
