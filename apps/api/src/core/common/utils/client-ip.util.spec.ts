import { getClientIp } from './client-ip.util';

describe('getClientIp', () => {
  const originalMode = process.env.TRUSTED_PROXY_MODE;

  afterEach(() => {
    process.env.TRUSTED_PROXY_MODE = originalMode;
  });

  it('ignores forged X-Forwarded-For when not behind a trusted proxy', () => {
    process.env.TRUSTED_PROXY_MODE = 'none';

    const ip = getClientIp({
      headers: { 'x-forwarded-for': '1.2.3.4' },
      ip: '203.0.113.50',
      socket: { remoteAddress: '203.0.113.50' } as any,
    });

    expect(ip).toBe('203.0.113.50');
  });

  it('uses CF-Connecting-IP when socket peer is a Cloudflare range', () => {
    process.env.TRUSTED_PROXY_MODE = 'cloudflare';

    const ip = getClientIp({
      headers: {
        'cf-connecting-ip': '198.51.100.25',
        'x-forwarded-for': '1.2.3.4',
      },
      ip: '104.16.0.1',
      socket: { remoteAddress: '104.16.0.1' } as any,
    });

    expect(ip).toBe('198.51.100.25');
  });
});
