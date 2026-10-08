import { ApiException, api, getCsrfToken } from '@/lib/api-client';
import { ACTIVE_WORKSPACE_HEADER, readActiveWorkspaceIdFromBrowser } from '@/lib/workspace';
import type { MyProfile, UpdateMyProfileInput } from '@/lib/profile/types';

const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export async function fetchMyProfile(): Promise<MyProfile | null> {
  try {
    const { data } = await api.get<MyProfile>('/profiles/me');
    return data;
  } catch {
    return null;
  }
}

export async function updateMyProfile(payload: UpdateMyProfileInput): Promise<MyProfile> {
  const { data } = await api.put<MyProfile>('/profiles', payload);
  return data;
}

export async function checkUsernameAvailable(
  username: string,
): Promise<{ available: boolean }> {
  const { data } = await api.get<{ available: boolean }>(
    `/profiles/check/${encodeURIComponent(username)}`,
  );
  return data;
}

function validateAvatarFile(file: File) {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    throw new ApiException(400, 'نوع الملف غير مدعوم. استخدم JPEG أو PNG أو WebP أو GIF');
  }
  if (file.size > MAX_AVATAR_SIZE) {
    throw new ApiException(400, 'حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت');
  }
}

export async function uploadProfileAvatar(file: File): Promise<MyProfile> {
  validateAvatarFile(file);

  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {};
  const csrf = getCsrfToken();
  if (csrf) headers['X-CSRF-Token'] = csrf;

  const workspaceId = readActiveWorkspaceIdFromBrowser();
  if (workspaceId) headers[ACTIVE_WORKSPACE_HEADER] = workspaceId;

  const response = await fetch('/api/v1/profiles/avatar', {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    let message = 'تعذّر رفع الصورة';
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* ignore */
    }
    throw new ApiException(response.status, message);
  }

  return (await response.json()) as MyProfile;
}
