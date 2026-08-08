/**
 * Normalize stored media references and resolve stable proxy URLs.
 * Prefer `/api/media/{s3Key}` over expiring S3 presigned URLs.
 */

function isS3Url(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return (
      host.includes('.s3.') ||
      host.includes('.s3-') ||
      host.startsWith('s3.') ||
      host.startsWith('s3-')
    );
  } catch {
    return false;
  }
}

export function extractS3KeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    let path = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));

    if (!path || path.includes('..')) return null;

    const host = parsed.hostname;
    if (host.startsWith('s3.') || host.startsWith('s3-')) {
      const slash = path.indexOf('/');
      if (slash !== -1) path = path.slice(slash + 1);
    }

    return path || null;
  } catch {
    return null;
  }
}

/** Convert API/proxy/S3 URL values to the raw S3 key for database storage. */
export function normalizeMediaStorageKey(value: string): string {
  if (value.startsWith('/api/media/')) {
    return value.slice('/api/media/'.length);
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    if (!isS3Url(value)) return value;
    const key = extractS3KeyFromUrl(value);
    if (key) return key;
  }
  return value.replace(/^\/+/, '');
}

export function resolveMediaProxyUrl(
  value?: string | null,
): string | null | undefined {
  if (!value) return value;
  if (value.startsWith('/uploads/')) return value;
  if (value.startsWith('/api/')) return value;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    if (!isS3Url(value)) return value;
    const key = extractS3KeyFromUrl(value);
    return key ? `/api/media/${key}` : null;
  }
  const key = value.replace(/^\/+/, '');
  return `/api/media/${key}`;
}
