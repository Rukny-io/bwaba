import 'server-only';

import { cookies } from 'next/headers';

type CookieSetOptions = Parameters<Awaited<ReturnType<typeof cookies>>['set']>[2];

function isCsrfCookieName(name: string): boolean {
  return name === 'csrf_token' || name.endsWith('-csrf_token');
}

function parseSetCookie(
  raw: string,
): { name: string; value: string; options: CookieSetOptions } | null {
  const segments = raw.split(';').map((part) => part.trim());
  const nameValue = segments[0];
  if (!nameValue) return null;

  const eq = nameValue.indexOf('=');
  if (eq <= 0) return null;

  const name = nameValue.slice(0, eq);
  const value = nameValue.slice(eq + 1);

  let httpOnly: boolean | undefined;
  let secure: boolean | undefined;
  let sameSite: 'strict' | 'lax' | 'none' | undefined;
  let path = '/';
  let domain: string | undefined;
  let maxAge: number | undefined;

  for (const segment of segments.slice(1)) {
    const lower = segment.toLowerCase();
    if (lower.startsWith('max-age=')) {
      const parsed = Number.parseInt(segment.slice('max-age='.length), 10);
      if (Number.isFinite(parsed)) maxAge = parsed;
    } else if (lower.startsWith('domain=')) {
      domain = segment.slice('domain='.length);
    } else if (lower.startsWith('path=')) {
      path = segment.slice('path='.length);
    } else if (lower.startsWith('samesite=')) {
      const v = segment.slice('samesite='.length).toLowerCase();
      if (v === 'strict' || v === 'lax' || v === 'none') {
        sameSite = v;
      }
    } else if (lower === 'secure') {
      secure = true;
    } else if (lower === 'httponly') {
      httpOnly = true;
    }
  }

  const options: CookieSetOptions = {
    path,
    httpOnly: httpOnly ?? !isCsrfCookieName(name),
    secure: secure ?? process.env.NODE_ENV === 'production',
    sameSite: sameSite ?? 'lax',
  };

  if (domain) options.domain = domain;
  if (maxAge !== undefined) options.maxAge = maxAge;

  return { name, value, options };
}

/**
 * Persist Set-Cookie headers from the API refresh response into the browser.
 * Without this, SSR refresh succeeds in-memory but the client keeps stale tokens.
 */
export async function persistAuthSetCookies(setCookies: string[]): Promise<void> {
  if (!setCookies.length) return;

  const cookieStore = await cookies();

  for (const raw of setCookies) {
    const parsed = parseSetCookie(raw);
    if (!parsed) continue;
    cookieStore.set(parsed.name, parsed.value, parsed.options);
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
