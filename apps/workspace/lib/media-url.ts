export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base =
    process.env.NEXT_PUBLIC_API_EXTERNAL_URL?.replace(/\/api\/v1\/?$/, '') ||
    'http://localhost:3001';
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}
