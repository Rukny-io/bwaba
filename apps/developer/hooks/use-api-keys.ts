'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  updateApiKey,
  revealApiKey,
} from '@/lib/api/api-keys';
import type { CreateApiKeyInput, UpdateApiKeyInput } from '@/lib/api/types';
import { getSubscription } from '@/lib/api/subscription';
import { appDashboardKeys } from '@/hooks/use-app-dashboard';

export const apiKeyQueryKeys = {
  list: (developerAppId: string) =>
    ['developer', 'api-keys', developerAppId] as const,
  subscription: ['developer', 'subscription'] as const,
};

export function useApiKeys(developerAppId: string) {
  return useQuery({
    queryKey: apiKeyQueryKeys.list(developerAppId),
    queryFn: () => listApiKeys(developerAppId),
    enabled: Boolean(developerAppId),
  });
}

export function useDeveloperSubscription() {
  return useQuery({
    queryKey: apiKeyQueryKeys.subscription,
    queryFn: getSubscription,
  });
}

export function useCreateApiKey(developerAppId: string, publicAppId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateApiKeyInput) => createApiKey(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: apiKeyQueryKeys.list(developerAppId),
      });
      void queryClient.invalidateQueries({
        queryKey: apiKeyQueryKeys.subscription,
      });
      void queryClient.invalidateQueries({
        queryKey: appDashboardKeys.all(publicAppId, developerAppId),
      });
    },
  });
}

export function useRevokeApiKey(developerAppId: string, publicAppId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (keySlug: string) => revokeApiKey(keySlug),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: apiKeyQueryKeys.list(developerAppId),
      });
      void queryClient.invalidateQueries({
        queryKey: apiKeyQueryKeys.subscription,
      });
      void queryClient.invalidateQueries({
        queryKey: appDashboardKeys.all(publicAppId, developerAppId),
      });
    },
  });
}

export function useUpdateApiKey(developerAppId: string, publicAppId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      keySlug,
      input,
    }: {
      keySlug: string;
      input: UpdateApiKeyInput;
    }) => updateApiKey(keySlug, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: apiKeyQueryKeys.list(developerAppId),
      });
      void queryClient.invalidateQueries({
        queryKey: appDashboardKeys.all(publicAppId, developerAppId),
      });
    },
  });
}

export function useRevealApiKey() {
  return useMutation({
    mutationFn: ({ keySlug, token }: { keySlug: string; token: string }) =>
      revealApiKey(keySlug, token),
  });
}
