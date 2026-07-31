import { API_PUBLIC_BASE } from '@/lib/config';

export const DEFAULT_ALLOWED_FILE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

export const DEFAULT_MAX_FILE_BYTES = 10 * 1024 * 1024;

export type PublicFormFileValue = {
  key: string;
  sessionToken: string;
  name: string;
  type: string;
  size: number;
};

type UploadSession = {
  sessionToken: string;
  expiresAt: string;
  maxFiles: number;
  maxFileBytes: number;
};

type PresignResult = {
  key: string;
  url: string;
  readUrl: string;
  originalName: string;
  contentType: string;
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ك.ب`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
}

export function isPublicFormFileValue(value: unknown): value is PublicFormFileValue {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.key === 'string' && v.key.length > 0;
}

export function mimeTypesToAccept(mimes: string[]): string {
  return mimes.join(',');
}

async function parseApiError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    const msg = body.message;
    if (Array.isArray(msg)) return msg.join('، ') || fallback;
    if (typeof msg === 'string' && msg.trim()) return msg;
  } catch {
    /* ignore */
  }
  return fallback;
}

export async function createPublicUploadSession(
  slug: string,
): Promise<UploadSession> {
  const res = await fetch(
    `${API_PUBLIC_BASE}/forms/public/${encodeURIComponent(slug)}/upload/session`,
    { method: 'POST' },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiError(res, 'تعذّر بدء جلسة رفع الملف.'),
    );
  }

  return (await res.json()) as UploadSession;
}

export async function presignPublicUpload(
  slug: string,
  sessionToken: string,
  files: { name: string; type: string; size: number }[],
): Promise<PresignResult[]> {
  const res = await fetch(
    `${API_PUBLIC_BASE}/forms/public/${encodeURIComponent(slug)}/upload/presign`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken, files }),
    },
  );

  if (!res.ok) {
    throw new Error(
      await parseApiError(res, 'تعذّر تجهيز رفع الملف.'),
    );
  }

  const body = (await res.json()) as { files: PresignResult[] };
  return body.files ?? [];
}

export async function uploadFileToPresignedUrl(
  url: string,
  file: File,
): Promise<void> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });

  if (!res.ok) {
    throw new Error('فشل رفع الملف إلى التخزين.');
  }
}

export async function uploadPublicFormFile(
  slug: string,
  file: File,
): Promise<PublicFormFileValue> {
  const session = await createPublicUploadSession(slug);
  const [presigned] = await presignPublicUpload(slug, session.sessionToken, [
    { name: file.name, type: file.type, size: file.size },
  ]);

  if (!presigned) {
    throw new Error('لم يُرجَع رابط رفع صالح.');
  }

  await uploadFileToPresignedUrl(presigned.url, file);

  return {
    key: presigned.key,
    sessionToken: session.sessionToken,
    name: file.name,
    type: file.type,
    size: file.size,
  };
}

export function validateFileBeforeUpload(
  file: File,
  options: {
    allowedMimes?: string[];
    maxBytes?: number;
  },
): string | null {
  const allowed = options.allowedMimes?.length
    ? options.allowedMimes
    : [...DEFAULT_ALLOWED_FILE_MIMES];
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_FILE_BYTES;

  if (file.size > maxBytes) {
    return `الملف كبير جداً. الحد الأقصى ${formatFileSize(maxBytes)}.`;
  }

  if (file.type && !allowed.includes(file.type)) {
    return 'نوع الملف غير مسموح.';
  }

  return null;
}
