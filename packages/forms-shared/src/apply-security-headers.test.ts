import { describe, expect, it } from 'vitest';
import {
  applySecurityHeadersToRequest,
  createSecurityHeadersContext,
} from './apply-security-headers';

describe('applySecurityHeadersToRequest', () => {
  it('forwards CSP and nonce to request headers in production', () => {
    const context = createSecurityHeadersContext({ isDev: false });
    const requestHeaders = applySecurityHeadersToRequest(
      { headers: new Headers() },
      context,
    );

    expect(context.nonce).toBeTruthy();
    expect(requestHeaders.get('x-nonce')).toBe(context.nonce);
    expect(requestHeaders.get('Content-Security-Policy')).toBe(context.csp);
    expect(requestHeaders.get('Content-Security-Policy')).toContain(
      `'nonce-${context.nonce}'`,
    );
  });

  it('does not forward CSP in development', () => {
    const context = createSecurityHeadersContext({ isDev: true });
    const requestHeaders = applySecurityHeadersToRequest(
      { headers: new Headers() },
      context,
    );

    expect(context.nonce).toBeUndefined();
    expect(requestHeaders.get('x-nonce')).toBeNull();
    expect(requestHeaders.get('Content-Security-Policy')).toBeNull();
  });
});
