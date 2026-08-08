import { ApiException, getCsrfToken } from '@/lib/api-client';
import { ACTIVE_WORKSPACE_HEADER, readActiveWorkspaceIdFromBrowser } from '@/lib/workspace';

export type StorageImageCategory = 'BANNER' | 'LOGO';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface BrandImageUploadResult {
  key: string;
  url: string;
}

function buildQuery(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const qs = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return qs ? `?${qs}` : '';
}

function validateImageFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('نوع الملف غير مدعوم. استخدم JPEG أو PNG أو WebP أو GIF');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت');
  }
}

export async function uploadStorageImage(
  file: File,
  category: StorageImageCategory,
): Promise<string> {
  validateImageFile(file);

  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = {};
  const csrf = getCsrfToken();
  if (csrf) headers['X-CSRF-Token'] = csrf;

  const workspaceId = readActiveWorkspaceIdFromBrowser();
  if (workspaceId) headers[ACTIVE_WORKSPACE_HEADER] = workspaceId;

  const response = await fetch(
    `/api/v1/storage/brand-image${buildQuery({ category })}`,
    {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers,
    },
  );

  const payload = (await response.json().catch(() => ({}))) as BrandImageUploadResult & {
    message?: string | string[];
  };

  if (!response.ok) {
    const raw = payload.message;
    const message = Array.isArray(raw)
      ? raw.join(', ')
      : typeof raw === 'string'
        ? raw
        : 'تعذّر رفع الصورة';
    throw new ApiException(response.status, message);
  }

  if (!payload.key) {
    throw new Error('تعذّر رفع الصورة');
  }

  return payload.key;
}
