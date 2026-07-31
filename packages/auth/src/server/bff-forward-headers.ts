import 'server-only';

import { cookies, headers } from 'next/headers';

/** Headers required for API session fingerprint verification (JWT strategy). */
const BFF_FORWARD_HEADERS = [
  'user-agent',
  'accept-language',
  'accept-encoding',
  'sec-ch-ua',
  'sec-ch-ua-platform',
  'sec-ch-ua-mobile',
  'x-client-fingerprint',
  'x-forwarded-for',
  'x-real-ip',
] as const;

export function buildCookieHeader(
  items: { name: string; value: string }[],
): string {
  return items.map((c) => `${c.name}=${c.value}`).join('; ');
}

/**
 * Forward browser headers from the incoming Next.js request to the Nest API.
 * Without this, SSR fetches use `user-agent: node` and fail session fingerprint checks.
 */
export async function getBffForwardHeaders(): Promise<Record<string, string>> {
  const incoming = await headers();
  const out: Record<string, string> = {};

  for (const name of BFF_FORWARD_HEADERS) {
    const value = incoming.get(name);
    if (value) out[name] = value;
  }

  return out;
}

/** Cookie + forwarded client headers for authenticated server-side API calls. */
export async function getServerAuthHeaders(
  cookieHeader?: string,
): Promise<Record<string, string>> {
  const forward = await getBffForwardHeaders();
  let cookiesStr = cookieHeader;

  if (!cookiesStr) {
    const cookieStore = await cookies();
    cookiesStr = buildCookieHeader(cookieStore.getAll());
  }

  return {
    ...forward,
    ...(cookiesStr ? { Cookie: cookiesStr } : {}),
  };
}
