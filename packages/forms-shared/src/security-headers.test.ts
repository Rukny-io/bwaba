import { describe, expect, it } from 'vitest';
import {
  buildAppSecurityHeaders,
  parseApiConnectOrigins,
} from './security-headers';

describe('buildAppSecurityHeaders', () => {
  it('uses unsafe-inline scripts in development', () => {
    const csp = buildAppSecurityHeaders({ isDev: true }).find(
      (h) => h.key === 'Content-Security-Policy',
    )!.value;
    expect(csp).toContain("'unsafe-inline'");
    expect(csp).not.toContain('strict-dynamic');
  });

  it('uses nonce and strict-dynamic in production', () => {
    const csp = buildAppSecurityHeaders({
      isDev: false,
      nonce: 'abc123',
    }).find((h) => h.key === 'Content-Security-Policy')!.value;
    expect(csp).toContain("'nonce-abc123'");
    expect(csp).toContain('strict-dynamic');
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('allows Turnstile and map tiles when configured', () => {
    const csp = buildAppSecurityHeaders({
      isDev: true,
      allowTurnstile: true,
      allowMapTiles: true,
    }).find((h) => h.key === 'Content-Security-Policy')!.value;
    expect(csp).toContain('challenges.cloudflare.com');
    expect(csp).toContain('openstreetmap.org');
  });
});

describe('parseApiConnectOrigins', () => {
  it('extracts HTTPS and WSS origins from API URL', () => {
    expect(parseApiConnectOrigins('https://api.rukny.io/api/v1')).toEqual([
      'https://api.rukny.io',
      'wss://api.rukny.io',
    ]);
  });

  it('extracts HTTP and WS origins for local API', () => {
    expect(parseApiConnectOrigins('http://localhost:3001/api/v1')).toEqual([
      'http://localhost:3001',
      'ws://localhost:3001',
    ]);
  });

  it('allows wss in production fallback connect-src', () => {
    const csp = buildAppSecurityHeaders({ isDev: false, nonce: 'n' }).find(
      (h) => h.key === 'Content-Security-Policy',
    )!.value;
    expect(csp).toContain('connect-src');
    expect(csp).toContain('wss:');
  });

  it('returns empty for invalid URL', () => {
    expect(parseApiConnectOrigins('not-a-url')).toEqual([]);
  });
});
