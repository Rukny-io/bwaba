'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  allocateToApp,
  getAppWallet,
  getMasterWallet,
} from '@/lib/api/wallet';

export const walletKeys = {
  master: ['developer', 'wallet', 'master'] as const,
  app: (appId: string) => ['developer', 'wallet', 'app', appId] as const,
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
