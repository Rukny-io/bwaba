import { MailAuthenticationVerdict } from '@prisma/client';
import { assertUrlSafe, safeFetch } from '../../core/common/utils/ssrf-guard';
import {
  MailBimiService,
  normalizeSenderDomain,
  normalizeSesVerdict,
  parseBimiRecord,
  parseDmarcRecord,
  sanitizeBimiSvg,
  validateBimiSvg,
} from './mail-bimi.service';

describe('Mail BIMI helpers', () => {
  it('normalizes only practical DNS sender domains', () => {
    expect(normalizeSenderDomain('Sender@News.Example.COM')).toBe(
      'news.example.com',
    );
    expect(normalizeSenderDomain('localhost')).toBeNull();
    expect(normalizeSenderDomain('sender@-bad.example')).toBeNull();
  });

  it('parses one HTTPS BIMI record and rejects ambiguity', () => {
    expect(
      parseBimiRecord([
        'v=BIMI1; l=https://assets.example.com/brand.svg; a=https://ca.example.com/vmc.pem',
      ]),
    ).toEqual({
      raw: 'v=BIMI1; l=https://assets.example.com/brand.svg; a=https://ca.example.com/vmc.pem',
      logoUrl: 'https://assets.example.com/brand.svg',
      authorityUrl: 'https://ca.example.com/vmc.pem',
    });
    expect(
      parseBimiRecord(['v=BIMI1; l=http://127.0.0.1/logo.svg']),
    ).toBeNull();
    expect(
      parseBimiRecord([
        'v=BIMI1; l=https://one.example/logo.svg',
        'v=BIMI1; l=https://two.example/logo.svg',
      ]),
    ).toBeNull();
  });

  it('requires an enforcing DMARC policy at full percentage', () => {
    expect(parseDmarcRecord(['v=DMARC1; p=reject'])?.enforced).toBe(true);
    expect(parseDmarcRecord(['v=DMARC1; p=quarantine; pct=50'])?.enforced).toBe(
      false,
    );
    expect(parseDmarcRecord(['v=DMARC1; p=none'])?.enforced).toBe(false);
  });

  it('accepts static Tiny PS SVG and rejects active content', () => {
    const valid = Buffer.from(
      '<svg version="1.2" baseProfile="tiny-ps" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><title>Example</title><rect width="10" height="10"/></svg>',
    );
    expect(validateBimiSvg(valid)).toContain('<title>Example</title>');
    expect(() =>
      validateBimiSvg(
        Buffer.from(
          '<svg version="1.2" baseProfile="tiny-ps"><title>Bad</title><script>alert(1)</script></svg>',
        ),
      ),
    ).toThrow(/active or external/i);
  });

  it('sanitizes comments and rejects non-square or external Tiny PS SVGs', () => {
    const sanitized = sanitizeBimiSvg(
      Buffer.from(
        '<!-- generated --><svg version="1.2" baseProfile="tiny-ps" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><title>Safe</title><path d="M0 0h64v64z"/></svg>',
      ),
    );
    expect(sanitized).not.toContain('generated');
    expect(() =>
      sanitizeBimiSvg(
        Buffer.from(
          '<svg version="1.2" baseProfile="tiny-ps" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 32"><title>Wide</title></svg>',
        ),
      ),
    ).toThrow(/square viewBox/i);
    expect(() =>
      sanitizeBimiSvg(
        Buffer.from(
          '<svg version="1.2" baseProfile="tiny-ps" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><title>Bad</title><image href="https://example.com/a.png"/></svg>',
        ),
      ),
    ).toThrow(/active or external/i);
  });

  it('normalizes common SVG exports into Tiny PS for upload', () => {
    const normalized = sanitizeBimiSvg(
      Buffer.from(
        `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <rect width="100" height="100" fill="#111"/>
</svg>`,
      ),
    );
    expect(normalized).toMatch(/baseProfile="tiny-ps"/i);
    expect(normalized).toMatch(/version="1\.2"/i);
    expect(normalized).toMatch(/viewBox="0 0 100 100"/i);
    expect(normalized).toMatch(/<title>Brand logo<\/title>/i);
  });

  it('rejects binary images renamed as SVG', () => {
    expect(() =>
      sanitizeBimiSvg(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])),
    ).toThrow(/not an SVG document/i);
  });

  it('maps SES verdict snapshots without trusting unknown statuses', () => {
    expect(normalizeSesVerdict({ status: 'pass' })).toBe(
      MailAuthenticationVerdict.PASS,
    );
    expect(normalizeSesVerdict({ status: 'unexpected' })).toBe(
      MailAuthenticationVerdict.UNKNOWN,
    );
    expect(normalizeSesVerdict(undefined)).toBeNull();
  });

  it('blocks private BIMI asset destinations before fetching', async () => {
    await expect(assertUrlSafe('https://127.0.0.1/logo.svg')).rejects.toThrow(
      /disallowed address/i,
    );
    await expect(
      assertUrlSafe('https://169.254.169.254/latest/meta-data'),
    ).rejects.toThrow(/disallowed address/i);
  });

  it('revalidates a redirect before following it', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: 'https://127.0.0.1/private.svg' },
      }),
    );
    try {
      await expect(safeFetch('https://8.8.8.8/logo.svg')).rejects.toThrow(
        /disallowed address/i,
      );
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    } finally {
      fetchSpy.mockRestore();
    }
  });
});

describe('MailBimiService customer setup', () => {
  const validSvg = Buffer.from(
    '<svg version="1.2" baseProfile="tiny-ps" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><title>Rukny</title><rect width="64" height="64"/></svg>',
  );
  const prisma = {
    mailApp: {
      findUnique: jest.fn().mockResolvedValue({
        userId: 'user-1',
        primaryDomain: 'example.com',
      }),
    },
  };
  const s3 = {
    getDefaultBucket: jest.fn().mockReturnValue('bucket'),
    objectExists: jest.fn().mockResolvedValue(true),
    uploadBuffer: jest.fn().mockResolvedValue({}),
    getObject: jest.fn(),
  };
  const config = {
    get: jest.fn((key: string) =>
      key === 'API_PUBLIC_URL' ? 'https://api.rukny.io' : undefined,
    ),
  };
  const flags = {
    requireOutboundBimi: jest.fn(),
    outboundBimi: jest.fn().mockReturnValue(true),
    resolveBimi: jest.fn().mockReturnValue(true),
  };
  let service: MailBimiService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MailBimiService(
      prisma as never,
      {} as never,
      s3 as never,
      config as never,
      flags as never,
    );
    jest
      .spyOn(service as any, 'txtRecords')
      .mockImplementation((name: string) =>
        Promise.resolve(
          name.startsWith('_dmarc')
            ? ['v=DMARC1; p=reject; pct=100']
            : [
                'v=BIMI1; l=https://api.rukny.io/api/v1/mail/public/bimi/1234567890123456/logo.svg;',
              ],
        ),
      );
  });

  it('stores sanitized SVG and raster at stable owner-scoped keys', async () => {
    const result = await service.uploadCustomerLogo(
      'user-1',
      '1234567890123456',
      {
        buffer: validSvg,
        size: validSvg.length,
        mimetype: 'image/svg+xml',
        originalname: 'brand.svg',
      } as Express.Multer.File,
    );

    expect(s3.uploadBuffer).toHaveBeenCalledTimes(2);
    expect(s3.uploadBuffer).toHaveBeenCalledWith(
      'bucket',
      'logos/mail-bimi/1234567890123456/logo.svg',
      expect.any(Buffer),
      'image/svg+xml',
    );
    expect(result.ready).toBe(true);
    expect(result.bimi.status).toBe('VERIFIED');
  });

  it('rejects a spoofed upload MIME type before storage', async () => {
    await expect(
      service.uploadCustomerLogo('user-1', '1234567890123456', {
        buffer: validSvg,
        size: validSvg.length,
        mimetype: 'text/plain',
        originalname: 'brand.svg',
      } as Express.Multer.File),
    ).rejects.toThrow(/Only \.svg files are accepted/i);
    expect(s3.uploadBuffer).not.toHaveBeenCalled();
  });
});

describe('MailBimiService resolution and cache', () => {
  const future = new Date(Date.now() + 60_000);
  const cachedBrand = {
    id: 'brand-1',
    domain: 'example.com',
    status: 'READY',
    expiresAt: future,
  };
  const prisma = {
    mailSenderBrand: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };
  const redis = {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue(undefined),
  };
  const flags = {
    requireOutboundBimi: jest.fn(),
    outboundBimi: jest.fn().mockReturnValue(true),
    resolveBimi: jest.fn().mockReturnValue(true),
  };
  let service: MailBimiService;

  beforeEach(() => {
    jest.clearAllMocks();
    flags.resolveBimi.mockReturnValue(true);
    service = new MailBimiService(
      prisma as never,
      redis as never,
      {} as never,
      { get: jest.fn() } as never,
      flags as never,
    );
  });

  it('returns an unexpired Redis-referenced row without DNS or asset fetches', async () => {
    redis.get.mockResolvedValue({
      id: cachedBrand.id,
      expiresAt: future.toISOString(),
    });
    prisma.mailSenderBrand.findUnique.mockResolvedValue(cachedBrand);
    const dns = jest.spyOn(service as any, 'txtRecords');
    const fetchAsset = jest.spyOn(service as any, 'fetchLimited');

    await expect(service.resolveAndPersist('sender@example.com')).resolves.toBe(
      cachedBrand,
    );
    expect(dns).not.toHaveBeenCalled();
    expect(fetchAsset).not.toHaveBeenCalled();
  });

  it('does no lookup or persistence when BIMI resolution is disabled', async () => {
    flags.resolveBimi.mockReturnValue(false);
    await expect(service.resolveAndPersist('example.com')).resolves.toBeNull();
    expect(redis.get).not.toHaveBeenCalled();
    expect(prisma.mailSenderBrand.upsert).not.toHaveBeenCalled();
  });

  it('persists INVALID and never downloads a logo when DMARC is not enforcing', async () => {
    redis.get.mockResolvedValue(null);
    prisma.mailSenderBrand.findUnique.mockResolvedValue(null);
    prisma.mailSenderBrand.upsert.mockImplementation(
      ({ create }: { create: Record<string, unknown> }) =>
        Promise.resolve({ id: 'brand-2', domain: 'example.com', ...create }),
    );
    jest
      .spyOn(service as any, 'txtRecords')
      .mockImplementation((name: string) =>
        Promise.resolve(
          name.startsWith('default._bimi')
            ? ['v=BIMI1; l=https://assets.example.com/logo.svg']
            : ['v=DMARC1; p=none'],
        ),
      );
    const fetchAsset = jest.spyOn(service as any, 'fetchLimited');

    const result = await service.resolveAndPersist('example.com');
    expect(result?.status).toBe('INVALID');
    expect(fetchAsset).not.toHaveBeenCalled();
    expect(prisma.mailSenderBrand.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          lastError: expect.stringMatching(/DMARC must enforce/i),
        }),
      }),
    );
  });
});
