'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  connectWhatsappAccount,
  createWhatsappTemplate,
  disconnectWhatsappAccount,
  getEmbeddedSignupConfig,
  getPhoneNumber,
  listPhoneNumbers,
  listWhatsappAccounts,
  listWhatsappTemplates,
  refreshWhatsappAccount,
  registerPhoneNumber,
  sendTestMessage,
  syncWhatsappTemplates,
  updatePhoneProfile,
} from '@/lib/api/whatsapp';

export const whatsappKeys = {
  all: (appId: string) => ['whatsapp', appId] as const,
  accounts: (appId: string) => [...whatsappKeys.all(appId), 'accounts'] as const,
  phones: (appId: string) => [...whatsappKeys.all(appId), 'phones'] as const,
  phone: (appId: string, phoneId: string) =>
    [...whatsappKeys.phones(appId), phoneId] as const,
  templates: (appId: string, accountId?: string) =>
    [...whatsappKeys.all(appId), 'templates', accountId ?? 'all'] as const,
  signupConfig: () => ['whatsapp', 'signup-config'] as const,
};

export function useEmbeddedSignupConfig() {
  return useQuery({
    queryKey: whatsappKeys.signupConfig(),
    queryFn: getEmbeddedSignupConfig,
    staleTime: 5 * 60_000,
  });
}

export function useWhatsappAccounts(appId: string) {
  return useQuery({
    queryKey: whatsappKeys.accounts(appId),
    queryFn: () => listWhatsappAccounts(appId),
    enabled: Boolean(appId),
  });
}

export function usePhoneNumbers(appId: string) {
  return useQuery({
    queryKey: whatsappKeys.phones(appId),
    queryFn: () => listPhoneNumbers(appId),
    enabled: Boolean(appId),
  });
}

export function usePhoneNumber(appId: string, phoneId: string) {
  return useQuery({
    queryKey: whatsappKeys.phone(appId, phoneId),
    queryFn: () => getPhoneNumber(appId, phoneId),
    enabled: Boolean(appId && phoneId),
  });
}

export function useWhatsappTemplates(appId: string, accountId?: string) {
  return useQuery({
    queryKey: whatsappKeys.templates(appId, accountId),
    queryFn: () => listWhatsappTemplates(appId, accountId),
    enabled: Boolean(appId),
  });
}

export function useWhatsappMutations(appId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: whatsappKeys.all(appId) });
  };

  const connectMutation = useMutation({
    mutationFn: ({ code, wabaId }: { code: string; wabaId?: string }) =>
      connectWhatsappAccount(appId, code, wabaId),
    onSuccess: invalidate,
  });

  const disconnectMutation = useMutation({
    mutationFn: (accountId: string) => disconnectWhatsappAccount(appId, accountId),
    onSuccess: invalidate,
  });

  const refreshMutation = useMutation({
    mutationFn: (accountId: string) => refreshWhatsappAccount(appId, accountId),
    onSuccess: invalidate,
  });

  const registerMutation = useMutation({
    mutationFn: ({ phoneId, pin }: { phoneId: string; pin: string }) =>
      registerPhoneNumber(appId, phoneId, pin),
    onSuccess: invalidate,
  });

  const profileMutation = useMutation({
    mutationFn: ({
      phoneId,
      body,
    }: {
      phoneId: string;
      body: { about?: string; email?: string };
    }) => updatePhoneProfile(appId, phoneId, body),
    onSuccess: invalidate,
  });

  const testMessageMutation = useMutation({
    mutationFn: ({ phoneId, to }: { phoneId: string; to: string }) =>
      sendTestMessage(appId, phoneId, to),
  });

  const syncTemplatesMutation = useMutation({
    mutationFn: (accountId?: string) => syncWhatsappTemplates(appId, accountId),
    onSuccess: invalidate,
  });

  const createTemplateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createWhatsappTemplate>[1]) =>
      createWhatsappTemplate(appId, payload),
    onSuccess: invalidate,
  });

  return {
    connectMutation,
    disconnectMutation,
    refreshMutation,
    registerMutation,
    profileMutation,
    testMessageMutation,
    syncTemplatesMutation,
    createTemplateMutation,
  };
}
