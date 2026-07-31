import { APP_URL, PUBLIC_SITE_URL } from '@/lib/forms/config';

const FALLBACK_PUBLIC_HOST = 'rukny.io';

function resolvePublicDisplayHost(): string {
  for (const raw of [PUBLIC_SITE_URL, APP_URL]) {
    try {
      const { hostname, host } = new URL(raw);
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return host.replace(/^www\./, '');
      }
    } catch {
      // try next
    }
  }
  return FALLBACK_PUBLIC_HOST;
}

/** Show a clean public hostname instead of localhost in dev URLs. */
export function formatPublicDisplayUrl(raw: string): string {
  const displayHost = resolvePublicDisplayHost();

  try {
    const url = new URL(raw);
    const path = `${url.pathname}${url.search}${url.hash}`;
    return `${displayHost}${path}`;
  } catch {
    return raw.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, displayHost);
  }
}

/** Copy-friendly URL with https and without localhost. */
export function formatPublicShareUrl(raw: string): string {
  const display = formatPublicDisplayUrl(raw);
  if (/^https?:\/\//i.test(display)) return display;
  return `https://${display}`;
}
