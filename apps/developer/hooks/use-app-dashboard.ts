'use client';

import { useQuery } from '@tanstack/react-query';
import { listApiKeys } from '@/lib/api/api-keys';
import { getAppWallet } from '@/lib/api/wallet';
import { listWhatsappAccounts } from '@/lib/api/whatsapp';
import { getFormsAppSummary, listLinkedForms } from '@/lib/api/forms';

export const appDashboardKeys = {
  all: (publicAppId: string, internalAppId: string) =>
    ['app-dashboard', publicAppId, internalAppId] as const,
};

export function useAppDashboard(publicAppId: string, internalAppId: string) {
  return useQuery({
    queryKey: appDashboardKeys.all(publicAppId, internalAppId),
    queryFn: async () => {
      const [keys, walletResult, accounts, formsSummary, linkedForms] =
        await Promise.all([
          listApiKeys(internalAppId),
          getAppWallet(publicAppId).catch(() => null),
          listWhatsappAccounts(publicAppId).catch(() => [] as Awaited<
            ReturnType<typeof listWhatsappAccounts>
          >),
          getFormsAppSummary(publicAppId).catch(() => null),
          listLinkedForms(publicAppId).catch(() => [] as Awaited<
            ReturnType<typeof listLinkedForms>
          >),
        ]);

      const wallet = walletResult;

      const activeKeys = keys.filter((k) => k.status === 'ACTIVE');
      const totalRequests = keys.reduce(
        (sum, k) => sum + Number(k.requestCount ?? 0),
        0,
      );
      const hasUsedKey = keys.some(
        (k) => Number(k.requestCount ?? 0) > 0 || Boolean(k.lastUsedAt),
      );
      const hasIntegration =
        accounts.length > 0 || (formsSummary?.linkedCount ?? 0) > 0;

      return {
        keys,
        activeKeysCount: activeKeys.length,
        totalRequests,
        wallet,
        accounts,
        formsSummary,
        linkedForms,
        hasIntegration,
        hasUsedKey,
      };
    },
    enabled: Boolean(publicAppId && internalAppId),
  });
}
