'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  allocateToApp,
  getAppWallet,
  getMasterWallet,
  getWalletTransactions,
} from '@/lib/api/wallet';

export const walletKeys = {
  master: ['developer', 'wallet', 'master'] as const,
  app: (appId: string) => ['developer', 'wallet', 'app', appId] as const,
  transactions: (page: number) =>
    ['developer', 'wallet', 'transactions', page] as const,
};

export function useMasterWallet() {
  return useQuery({
    queryKey: walletKeys.master,
    queryFn: getMasterWallet,
  });
}

export function useAppWallet(publicAppId: string) {
  return useQuery({
    queryKey: walletKeys.app(publicAppId),
    queryFn: () => getAppWallet(publicAppId),
    enabled: Boolean(publicAppId),
  });
}

export function useWalletTransactions(page = 1, limit = 20) {
  return useQuery({
    queryKey: walletKeys.transactions(page),
    queryFn: () => getWalletTransactions({ page, limit }),
  });
}

export function useAllocateAppWallet(publicAppId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => allocateToApp(publicAppId, amount),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: walletKeys.master });
      void queryClient.invalidateQueries({
        queryKey: walletKeys.app(publicAppId),
      });
      void queryClient.invalidateQueries({
        queryKey: ['app-dashboard', publicAppId],
      });
    },
  });
}
