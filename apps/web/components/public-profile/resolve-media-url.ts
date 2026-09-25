import type { MediaUrlResolver } from './types';

function isS3Host(host: string): boolean {
  return (
    host.includes('.s3.') ||
    host.includes('.s3-') ||
    host.startsWith('s3.') ||
    host.startsWith('s3-')
  );
}

function extractS3KeyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    let key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    if (!key || key.includes('..')) return null;

    const host = parsed.hostname;
    if (host.startsWith('s3.') || host.startsWith('s3-')) {
      const slash = key.indexOf('/');
      if (slash !== -1) key = key.slice(slash + 1);
    }

    return key || null;
  } catch {
    return null;
  }
}

/** Resolve stored S3 keys / presigned URLs to stable same-origin proxy paths. */
export const resolveProfileMediaUrl: MediaUrlResolver = (path) => {
  if (!path) return null;
  if (path.startsWith('/api/')) return path;
  if (path.startsWith('/uploads/')) return null;

  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const parsed = new URL(path);
      if (!isS3Host(parsed.hostname)) return path;
      const key = extractS3KeyFromUrl(path);
      return key ? `/api/media/${key}` : null;
    } catch {
      return null;
    }
  }

  return `/api/media/${path.replace(/^\/+/, '')}`;
};

export const resolveMediaUrl = resolveProfileMediaUrl;
