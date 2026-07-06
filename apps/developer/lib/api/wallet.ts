import { api } from '@/lib/api-client';
import type {
  AllocateWalletResult,
  AppWallet,
  MasterWallet,
} from '@/lib/api/types';

export async function getMasterWallet(): Promise<MasterWallet> {
  const { data } = await api.get<MasterWallet>('/developer/wallet');
  return data;
}

export async function getAppWallet(publicAppId: string): Promise<AppWallet> {
  const { data } = await api.get<AppWallet>(
    `/developer/wallet/apps/${publicAppId}`,
  );
  return data;
}

export async function allocateToApp(
  publicAppId: string,
  amount: number,
): Promise<AllocateWalletResult> {
  const { data } = await api.post<AllocateWalletResult>(
    `/developer/wallet/apps/${publicAppId}/allocate`,
    { amount },
  );
  return data;
}
