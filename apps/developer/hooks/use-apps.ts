'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createApp,
  deleteApp,
  getApp,
  listApps,
  sendAppOtp,
  submitAppAccessReview,
  updateApp,
  verifyAppOtp,
} from '@/lib/api/apps';
import type {
  CreateAppInput,
  DeveloperApp,
  SendAppOtpInput,
  UpdateAppInput,
  VerifyAppOtpInput,
} from '@/lib/api/types';

export const appQueryKeys = {
  all: ['developer-apps'] as const,
  list: () => [...appQueryKeys.all, 'list'] as const,
  detail: (appId: string) => [...appQueryKeys.all, 'detail', appId] as const,
};

export function useApps() {
  return useQuery({
    queryKey: appQueryKeys.list(),
    queryFn: listApps,
  });
}

export function useApp(appId: string) {
  return useQuery({
    queryKey: appQueryKeys.detail(appId),
    queryFn: () => getApp(appId),
    enabled: Boolean(appId),
  });
}

export function useCreateApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAppInput) => createApp(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: appQueryKeys.all });
    },
  });
}

export function useUpdateApp(appId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAppInput) => updateApp(appId, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        appQueryKeys.detail(appId),
        (old: DeveloperApp | undefined) =>
          old ? { ...old, ...updated } : updated,
      );
      void queryClient.invalidateQueries({ queryKey: appQueryKeys.all });
    },
  });
}

export function useSubmitAppAccessReview(appId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => submitAppAccessReview(appId),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        appQueryKeys.detail(appId),
        (old: DeveloperApp | undefined) =>
          old ? { ...old, ...updated } : updated,
      );
      void queryClient.invalidateQueries({ queryKey: appQueryKeys.all });
    },
  });
}

export function useDeleteApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appId: string) => deleteApp(appId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: appQueryKeys.all });
    },
  });
}

export function useSendAppOtp() {
  return useMutation({
    mutationFn: (input: SendAppOtpInput) => sendAppOtp(input),
  });
}

export function useVerifyAppOtp() {
  return useMutation({
    mutationFn: (input: VerifyAppOtpInput) => verifyAppOtp(input),
  });
}
