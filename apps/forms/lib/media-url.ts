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

function extractS3KeyFromUrl(url: string): string | null {
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

/** Resolve stored S3 keys / presigned URLs to stable same-origin proxy paths. */
export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('/api/')) return url;
  if (url.startsWith('/uploads/')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (!isS3Url(url)) return url;
    const key = extractS3KeyFromUrl(url);
    return key ? `/api/media/${key}` : null;
  }
  const key = url.replace(/^\/+/, '');
  return `/api/media/${key}`;
}

/** Avatar URLs may point at a video; use the generated thumbnail when needed. */
export function resolveAvatarUrl(url?: string | null): string | null {
  const resolved = resolveMediaUrl(url);
  if (!resolved) return null;
  if (/\.mp4$/i.test(resolved)) {
    return resolved.replace(/\.mp4$/i, '_thumb.jpg');
  }
  return resolved;
}
