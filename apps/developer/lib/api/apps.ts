import { api } from '@/lib/api-client';
import type {
  CreateAppInput,
  DeveloperApp,
  SendAppOtpInput,
  SendAppOtpResponse,
  UpdateAppInput,
  VerifyAppOtpInput,
  VerifyAppOtpResponse,
  AppImageUploadType,
  PresignFileInfo,
  PresignUploadResult,
} from '@/lib/api/types';

export async function listApps(): Promise<DeveloperApp[]> {
  const { data } = await api.get<DeveloperApp[]>('/developer/apps');
  return Array.isArray(data) ? data : [];
}

export async function getApp(appId: string): Promise<DeveloperApp> {
  const { data } = await api.get<DeveloperApp>(`/developer/apps/${appId}`);
  return data;
}

export async function createApp(input: CreateAppInput): Promise<DeveloperApp> {
  const { data } = await api.post<DeveloperApp>('/developer/apps', input);
  return data;
}

export async function sendAppOtp(
  input: SendAppOtpInput,
): Promise<SendAppOtpResponse> {
  const { data } = await api.post<SendAppOtpResponse>(
    '/developer/apps/otp/send',
    input,
  );
  return data;
}

export async function verifyAppOtp(
  input: VerifyAppOtpInput,
): Promise<VerifyAppOtpResponse> {
  const { data } = await api.post<VerifyAppOtpResponse>(
    '/developer/apps/otp/verify',
    input,
  );
  return data;
}

export async function updateApp(
  appId: string,
  input: UpdateAppInput,
): Promise<DeveloperApp> {
  const { data } = await api.patch<DeveloperApp>(
    `/developer/apps/${appId}`,
    input,
  );
  return data;
}

export async function submitAppAccessReview(
  appId: string,
): Promise<DeveloperApp> {
  const { data } = await api.post<DeveloperApp>(
    `/developer/apps/${appId}/submit-access-review`,
  );
  return data;
}

export async function presignAppImageUpload(
  appId: string,
  type: AppImageUploadType,
  file: PresignFileInfo,
): Promise<PresignUploadResult> {
  const { data } = await api.post<PresignUploadResult[]>(
    `/developer/apps/${appId}/upload/presign`,
    { type, files: [file] },
  );
  const list = Array.isArray(data) ? data : [data];
  const first = list[0];
  if (!first?.key || !first?.url) {
    throw new Error('Failed to prepare image upload');
  }
  return first;
}

export async function deleteApp(appId: string): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(
    `/developer/apps/${appId}`,
  );
  return data;
}
