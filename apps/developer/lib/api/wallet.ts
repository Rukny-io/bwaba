import { api } from '@/lib/api-client';
import type {
  AllocateWalletResult,
  AppWallet,
  MasterWallet,
  WalletTransactionsResponse,
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

export async function getWalletTransactions(params?: {
  type?: string;
  page?: number;
  limit?: number;
}): Promise<WalletTransactionsResponse> {
  const search = new URLSearchParams();
  if (params?.type) search.set('type', params.type);
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  const { data } = await api.get<WalletTransactionsResponse>(
    `/developer/wallet/transactions${qs ? `?${qs}` : ''}`,
  );
  return data;
}
