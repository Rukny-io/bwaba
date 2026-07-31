import {
  buildAppSecurityHeaders,
  generateCspNonce,
  type SecurityHeader,
  type SecurityHeadersOptions,
} from './security-headers';

export const CSP_NONCE_HEADER = 'x-nonce';

type MutableHeaders = {
  set(name: string, value: string): void;
};

export interface SecurityHeadersContext {
  securityHeaders: SecurityHeader[];
  nonce?: string;
  csp?: string;
}

export function createSecurityHeadersContext(
  options: SecurityHeadersOptions,
): SecurityHeadersContext {
  const isDev = options.isDev ?? false;
  const nonce = isDev ? undefined : generateCspNonce();
  const securityHeaders = buildAppSecurityHeaders({ ...options, nonce });
  const csp = securityHeaders.find(
    (header) => header.key === 'Content-Security-Policy',
  )?.value;

  return { securityHeaders, nonce, csp };
}

/** Forward CSP + nonce on the request so Next.js can tag inline scripts during SSR. */
export function applySecurityHeadersToRequest(
  request: { headers: Headers },
  context: SecurityHeadersContext,
): Headers {
  const requestHeaders = new Headers(request.headers);

  if (context.nonce && context.csp) {
    requestHeaders.set(CSP_NONCE_HEADER, context.nonce);
    requestHeaders.set('Content-Security-Policy', context.csp);
  }

  return requestHeaders;
}

export function applySecurityHeaders<T extends { headers: MutableHeaders }>(
  response: T,
  contextOrOptions: SecurityHeadersContext | SecurityHeadersOptions,
): T {
  const context =
    'securityHeaders' in contextOrOptions
      ? contextOrOptions
      : createSecurityHeadersContext(contextOrOptions);

  for (const { key, value } of context.securityHeaders) {
    response.headers.set(key, value);
  }

  if (context.nonce) {
    response.headers.set(CSP_NONCE_HEADER, context.nonce);
  }

  return response;
}
