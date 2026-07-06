import 'server-only';

import { cookies } from 'next/headers';

type CookieSetOptions = Parameters<Awaited<ReturnType<typeof cookies>>['set']>[2];

/**
 * Persist Set-Cookie headers from the API refresh response into the browser.
 * Without this, SSR refresh succeeds in-memory but the client keeps stale tokens.
 */
export async function persistAuthSetCookies(setCookies: string[]): Promise<void> {
  if (!setCookies.length) return;

  const cookieStore = await cookies();

  for (const raw of setCookies) {
    const segments = raw.split(';').map((part) => part.trim());
    const nameValue = segments[0];
    if (!nameValue) continue;

    const eq = nameValue.indexOf('=');
    if (eq <= 0) continue;

    const name = nameValue.slice(0, eq);
    const value = nameValue.slice(eq + 1);

    const options: CookieSetOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };

    for (const segment of segments.slice(1)) {
      const lower = segment.toLowerCase();
      if (lower.startsWith('max-age=')) {
        const maxAge = Number.parseInt(segment.slice('max-age='.length), 10);
        if (Number.isFinite(maxAge)) options.maxAge = maxAge;
      } else if (lower.startsWith('domain=')) {
        options.domain = segment.slice('domain='.length);
      } else if (lower === 'secure') {
        options.secure = true;
      } else if (lower === 'httponly') {
        options.httpOnly = true;
      }
    }

    cookieStore.set(name, value, options);
  }
}

export function mergeAuthSetCookies(existing: string, setCookies: string[]): string {
  const jar = new Map<string, string>();

  for (const part of existing
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean)) {
    const eq = part.indexOf('=');
    if (eq > 0) jar.set(part.slice(0, eq), part.slice(eq + 1));
  }

  for (const raw of setCookies) {
    const pair = raw.split(';')[0]?.trim();
    if (!pair) continue;
    const eq = pair.indexOf('=');
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }

  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}
