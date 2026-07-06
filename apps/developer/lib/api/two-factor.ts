import { api } from '@/lib/api-client';

export interface TwoFactorStatus {
  enabled: boolean;
  backupCodesCount?: number;
}

export async function getTwoFactorStatus(): Promise<TwoFactorStatus> {
  const { data } = await api.get<TwoFactorStatus>('/auth/2fa/status');
  return data;
}
