'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getFormsAppSummary,
  getLinkedFormDetail,
  linkFormToApp,
  listAvailableForms,
  listLinkedForms,
  unlinkFormFromApp,
  updateEmbedOrigins,
} from '@/lib/api/forms';

export const formsAppKeys = {
  all: (appId: string) => ['forms-app', appId] as const,
  summary: (appId: string) => [...formsAppKeys.all(appId), 'summary'] as const,
  linked: (appId: string) => [...formsAppKeys.all(appId), 'linked'] as const,
  available: (appId: string) => [...formsAppKeys.all(appId), 'available'] as const,
  detail: (appId: string, formId: string) =>
    [...formsAppKeys.all(appId), 'detail', formId] as const,
};

export function useFormsAppSummary(publicAppId: string) {
  return useQuery({
    queryKey: formsAppKeys.summary(publicAppId),
    queryFn: () => getFormsAppSummary(publicAppId),
    enabled: Boolean(publicAppId),
  });
}

export function useLinkedForms(publicAppId: string) {
  return useQuery({
    queryKey: formsAppKeys.linked(publicAppId),
    queryFn: () => listLinkedForms(publicAppId),
    enabled: Boolean(publicAppId),
  });
}

export function useAvailableForms(publicAppId: string, enabled: boolean) {
  return useQuery({
    queryKey: formsAppKeys.available(publicAppId),
    queryFn: () => listAvailableForms(publicAppId),
    enabled: Boolean(publicAppId) && enabled,
  });
}

export function useLinkedFormDetail(publicAppId: string, formId: string) {
  return useQuery({
    queryKey: formsAppKeys.detail(publicAppId, formId),
    queryFn: () => getLinkedFormDetail(publicAppId, formId),
    enabled: Boolean(publicAppId && formId),
  });
}

export function useFormsMutations(publicAppId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: formsAppKeys.all(publicAppId) });
  };

  const linkMutation = useMutation({
    mutationFn: (formId: string) => linkFormToApp(publicAppId, formId),
    onSuccess: invalidate,
  });

  const unlinkMutation = useMutation({
    mutationFn: (formId: string) => unlinkFormFromApp(publicAppId, formId),
    onSuccess: invalidate,
  });

  const embedOriginsMutation = useMutation({
    mutationFn: (origins: string[]) => updateEmbedOrigins(publicAppId, origins),
    onSuccess: invalidate,
  });

  return { linkMutation, unlinkMutation, embedOriginsMutation };
}
