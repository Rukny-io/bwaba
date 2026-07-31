import { PUBLIC_SITE_URL } from '@/lib/forms/config';

export function getPublicProfileUrl(username?: string | null): string | null {
  if (!username?.trim()) return null;
  const base = PUBLIC_SITE_URL.replace(/\/$/, '');
  return `${base}/${encodeURIComponent(username.trim())}`;
}

export function getPublicProfileHostname(username: string): string {
  try {
    const url = new URL(getPublicProfileUrl(username) ?? '');
    return url.host;
  } catch {
    return 'rukny.io';
  }
}
