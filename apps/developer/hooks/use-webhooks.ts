'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createWebhook,
  deleteWebhook,
  listWebhooks,
  rotateWebhookSecret,
  testWebhook,
  updateWebhook,
} from '@/lib/api/webhooks';

export const webhooksKeys = {
  all: (appId?: string) => ['developer-webhooks', appId ?? 'all'] as const,
};

export function useWebhooks(appId?: string) {
  return useQuery({
    queryKey: webhooksKeys.all(appId),
    queryFn: () => listWebhooks(appId),
  });
}

export function useWebhookMutations(appId?: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: webhooksKeys.all(appId) });
    void queryClient.invalidateQueries({ queryKey: webhooksKeys.all() });
  };

  return {
    createMutation: useMutation({
      mutationFn: createWebhook,
      onSuccess: invalidate,
    }),
    updateMutation: useMutation({
      mutationFn: ({
        id,
        body,
      }: {
        id: string;
        body: Parameters<typeof updateWebhook>[1];
      }) => updateWebhook(id, body),
      onSuccess: invalidate,
    }),
    deleteMutation: useMutation({
      mutationFn: deleteWebhook,
      onSuccess: invalidate,
    }),
    testMutation: useMutation({ mutationFn: testWebhook }),
    rotateMutation: useMutation({
      mutationFn: rotateWebhookSecret,
      onSuccess: invalidate,
    }),
  };
}
