const PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://rukny.io";

export function getPublicProfileUrl(username?: string | null): string | null {
  if (!username?.trim()) return null;
  return `${PUBLIC_SITE_URL}/${encodeURIComponent(username.trim())}`;
}
