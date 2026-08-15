import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  applySecurityHeaders,
  applySecurityHeadersToRequest,
  createSecurityHeadersContext,
} from '@rukny/forms-shared/apply-security-headers';
import {
  parseApiConnectOrigins,
  type SecurityHeadersOptions,
} from '@rukny/forms-shared/security-headers';
import { USERNAME_PATTERN, isValidProfileUsername } from '@/lib/profile-routes';

const isDev = process.env.NODE_ENV !== 'production';
const SLUG_PATTERN = /^[a-z0-9]{6}$/;

const BASE_SECURITY_OPTS: SecurityHeadersOptions = {
  isDev,
  allowTurnstile: true,
  apiConnectOrigins: parseApiConnectOrigins(
    process.env.NEXT_PUBLIC_API_URL || process.env.API_BACKEND_URL,
  ),
};

type EmbedPolicy = {
  allowedAncestors: string[];
};

async function fetchEmbedPolicy(slug: string): Promise<EmbedPolicy | null> {
  const apiBase = (
    process.env.API_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001'
  ).replace(/\/$/, '');
  const apiRoot = apiBase.endsWith('/api/v1') ? apiBase : `${apiBase}/api/v1`;

  try {
    const response = await fetch(
      `${apiRoot}/forms/public/${encodeURIComponent(slug)}/embed-policy`,
      { next: { revalidate: 60 } },
    );
    if (!response.ok) return null;

    const data = (await response.json()) as EmbedPolicy;
    if (!Array.isArray(data.allowedAncestors) || data.allowedAncestors.length === 0) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function redirectWithSecurity(
  request: NextRequest,
  pathname: string,
  securityOptions: SecurityHeadersOptions = BASE_SECURITY_OPTS,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  const security = createSecurityHeadersContext(securityOptions);
  return applySecurityHeaders(NextResponse.redirect(url, 308), security);
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const embedRequested = searchParams.get('embed') === '1';
  let securityOptions: SecurityHeadersOptions = { ...BASE_SECURITY_OPTS };

  const legacyAtMatch = pathname.match(/^\/@([a-zA-Z0-9_.]{3,30})\/?$/);
  if (legacyAtMatch) {
    return redirectWithSecurity(request, `/${legacyAtMatch[1]}`);
  }

  const legacyProfileMatch = pathname.match(
    /^\/profile\/([a-zA-Z0-9_.]{3,30})\/?$/,
  );
  if (legacyProfileMatch && USERNAME_PATTERN.test(legacyProfileMatch[1])) {
    return redirectWithSecurity(request, `/${legacyProfileMatch[1]}`);
  }

  const profileEmbedMatch = pathname.match(/^\/([a-zA-Z0-9_.]{3,30})\/?$/);
  if (
    profileEmbedMatch &&
    embedRequested &&
    isValidProfileUsername(profileEmbedMatch[1])
  ) {
    const appOrigin = (
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_DASHBOARD_URL ||
      (isDev ? 'http://localhost:3000' : '')
    ).replace(/\/$/, '');

    securityOptions = {
      ...BASE_SECURITY_OPTS,
      frameAncestors: isDev ? '*' : appOrigin ? [appOrigin] : 'none',
    };
  }

  const embedMatch = pathname.match(/^\/f\/([a-z0-9]{6})$/);
  if (embedMatch && embedRequested) {
    const slug = embedMatch[1];
    if (SLUG_PATTERN.test(slug)) {
      const policy = await fetchEmbedPolicy(slug);
      if (policy) {
        securityOptions = {
          ...BASE_SECURITY_OPTS,
          frameAncestors: policy.allowedAncestors,
        };
      } else if (isDev) {
        securityOptions = {
          ...BASE_SECURITY_OPTS,
          frameAncestors: '*',
        };
      }
    }
  }

  const security = createSecurityHeadersContext(securityOptions);
  const requestHeaders = applySecurityHeadersToRequest(request, security);

  return applySecurityHeaders(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    }),
    security,
  );
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
