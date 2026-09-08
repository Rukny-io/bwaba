import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MailAuthenticationVerdict,
  MailBrandCertificateType,
  MailSenderBrand,
  MailSenderBrandStatus,
  Prisma,
} from '@prisma/client';
import { createHash, X509Certificate } from 'crypto';
import { resolveTxt } from 'dns/promises';
import { rootCertificates } from 'tls';
import sharp from 'sharp';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { RedisService } from '../../core/cache/redis.service';
import { safeFetch } from '../../core/common/utils/ssrf-guard';
import { S3Service } from '../../shared/services/s3.service';
import { MailFeatureFlags } from './mail-feature-flags';

const POSITIVE_TTL_SECONDS = 24 * 60 * 60;
const NEGATIVE_TTL_SECONDS = 60 * 60;
const MAX_SVG_BYTES = 256 * 1024;
const MAX_RASTER_BYTES = 2 * 1024 * 1024;
const MAX_CERT_BYTES = 1024 * 1024;
const FETCH_TIMEOUT_MS = 8_000;
const BIMI_EKU_OID = '1.3.6.1.5.5.7.3.31';
export const BIMI_MAX_SVG_BYTES = MAX_SVG_BYTES;
export const BIMI_MAX_UPLOAD_BYTES = MAX_RASTER_BYTES;

export type ParsedBimiRecord = {
  raw: string;
  logoUrl: string;
  authorityUrl: string | null;
};

export type ParsedDmarcRecord = {
  raw: string;
  policy: string;
  percentage: number;
  enforced: boolean;
};

export function normalizeSenderDomain(value: string): string | null {
  const candidate = value.trim().toLowerCase().replace(/\.$/, '');
  const domain = candidate.includes('@')
    ? candidate.slice(candidate.lastIndexOf('@') + 1)
    : candidate;
  if (
    !domain ||
    domain.length > 253 ||
    !domain.includes('.') ||
    domain.includes('..') ||
    !/^[a-z0-9.-]+$/.test(domain)
  ) {
    return null;
  }
  const labels = domain.split('.');
  if (
    labels.some(
      (label) =>
        !label ||
        label.length > 63 ||
        label.startsWith('-') ||
        label.endsWith('-'),
    )
  ) {
    return null;
  }
  return domain;
}

function parseTagRecord(record: string): Map<string, string> {
  const tags = new Map<string, string>();
  for (const part of record.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 1) continue;
    const key = part.slice(0, separator).trim().toLowerCase();
    const value = part.slice(separator + 1).trim();
    if (key && !tags.has(key)) tags.set(key, value);
  }
  return tags;
}

export function parseBimiRecord(records: string[]): ParsedBimiRecord | null {
  const candidates = records.filter((record) =>
    /^\s*v\s*=\s*BIMI1(?:\s*;|$)/i.test(record),
  );
  if (candidates.length !== 1) return null;
  const raw = candidates[0].trim();
  const tags = parseTagRecord(raw);
  if (tags.get('v')?.toUpperCase() !== 'BIMI1') return null;
  const logoUrl = tags.get('l') || '';
  if (!isHttpsUrl(logoUrl)) return null;
  const authority = tags.get('a') || '';
  if (authority && !isHttpsUrl(authority)) return null;
  return { raw, logoUrl, authorityUrl: authority || null };
}

export function parseDmarcRecord(records: string[]): ParsedDmarcRecord | null {
  const candidates = records.filter((record) =>
    /^\s*v\s*=\s*DMARC1(?:\s*;|$)/i.test(record),
  );
  if (candidates.length !== 1) return null;
  const raw = candidates[0].trim();
  const tags = parseTagRecord(raw);
  const policy = (tags.get('p') || '').toLowerCase();
  const percentageValue = Number.parseInt(tags.get('pct') || '100', 10);
  const percentage = Number.isFinite(percentageValue)
    ? Math.min(Math.max(percentageValue, 0), 100)
    : 0;
  return {
    raw,
    policy,
    percentage,
    enforced:
      (policy === 'quarantine' || policy === 'reject') && percentage === 100,
  };
}

export function normalizeSesVerdict(
  verdict: { status?: string } | undefined,
): MailAuthenticationVerdict | null {
  const value = verdict?.status?.trim().toUpperCase();
  if (!value) return null;
  return Object.values(MailAuthenticationVerdict).includes(
    value as MailAuthenticationVerdict,
  )
    ? (value as MailAuthenticationVerdict)
    : MailAuthenticationVerdict.UNKNOWN;
}

function isLikelyBinaryImage(input: Buffer): boolean {
  if (input.length < 4) return false;
  // PNG / JPEG / GIF / WebP / ZIP(SVGZ)
  if (input[0] === 0x89 && input[1] === 0x50 && input[2] === 0x4e) return true;
  if (input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff) return true;
  if (input[0] === 0x47 && input[1] === 0x49 && input[2] === 0x46) return true;
  if (
    input[0] === 0x52 &&
    input[1] === 0x49 &&
    input[2] === 0x46 &&
    input[3] === 0x46
  ) {
    return true;
  }
  if (input[0] === 0x50 && input[1] === 0x4b) return true;
  return false;
}

function extractSvgDocument(text: string): string {
  const cleaned = text
    .replace(/^\uFEFF/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!ENTITY[\s\S]*?>/gi, '')
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<\?[\s\S]*?\?>/g, '')
    .trim();
  const start = cleaned.search(/<svg\b/i);
  if (start < 0) {
    throw new Error(
      'BIMI logo is not an SVG document. Upload a real .svg file (not PNG/JPG renamed to .svg).',
    );
  }
  const end = cleaned.toLowerCase().lastIndexOf('</svg>');
  if (end < start) {
    throw new Error('BIMI logo SVG is incomplete or malformed.');
  }
  return cleaned.slice(start, end + '</svg>'.length).trim();
}

function readAttr(rootAttrs: string, name: string): string | null {
  const match = rootAttrs.match(
    new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, 'i'),
  );
  return match?.[1]?.trim() || null;
}

function setAttr(rootAttrs: string, name: string, value: string): string {
  const pattern = new RegExp(`\\b${name}\\s*=\\s*["'][^"']*["']`, 'i');
  if (pattern.test(rootAttrs)) {
    return rootAttrs.replace(pattern, `${name}="${value}"`);
  }
  return `${rootAttrs.trim()} ${name}="${value}"`.trim();
}

function ensureSquareViewBox(rootAttrs: string): string {
  const viewBox = rootAttrs.match(
    /\bviewBox\s*=\s*["']\s*([+-]?(?:\d+\.?\d*|\.\d+))[\s,]+([+-]?(?:\d+\.?\d*|\.\d+))[\s,]+([+-]?(?:\d+\.?\d*|\.\d+))[\s,]+([+-]?(?:\d+\.?\d*|\.\d+))\s*["']/i,
  );
  if (viewBox) {
    if (Number(viewBox[3]) <= 0 || Number(viewBox[3]) !== Number(viewBox[4])) {
      throw new Error('BIMI SVG must have a positive square viewBox.');
    }
    return rootAttrs;
  }

  const width = Number(readAttr(rootAttrs, 'width')?.replace(/px$/i, ''));
  const height = Number(readAttr(rootAttrs, 'height')?.replace(/px$/i, ''));
  if (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    width === height
  ) {
    return setAttr(rootAttrs, 'viewBox', `0 0 ${width} ${height}`);
  }

  throw new Error(
    'BIMI SVG must have a positive square viewBox (for example viewBox="0 0 100 100").',
  );
}

/** Normalize common SVG exports into BIMI SVG Tiny PS when content is otherwise safe. */
export function normalizeBimiSvg(input: Buffer): string {
  if (!input.length || input.length > MAX_SVG_BYTES) {
    throw new Error('BIMI SVG has an invalid size.');
  }
  if (isLikelyBinaryImage(input)) {
    throw new Error(
      'BIMI logo is not an SVG document. Upload a real .svg file (not PNG/JPG renamed to .svg).',
    );
  }

  let svg = extractSvgDocument(input.toString('utf8'));
  if (
    /<script\b|<foreignObject\b|<iframe\b|<object\b|<embed\b|<image\b|<use\b|<animate\b|<set\b|<style\b/i.test(
      svg,
    ) ||
    /\son[a-z]+\s*=|\b(?:href|xlink:href)\s*=|url\s*\(/i.test(svg)
  ) {
    throw new Error(
      'BIMI SVG contains active or external content. Export a static SVG without links, images, styles, or scripts.',
    );
  }

  const openTag = svg.match(/<svg\b([^>]*)>/i);
  if (!openTag) {
    throw new Error('BIMI logo is not an SVG document.');
  }

  let rootAttrs = openTag[1] || '';
  rootAttrs = setAttr(rootAttrs, 'xmlns', 'http://www.w3.org/2000/svg');
  rootAttrs = setAttr(rootAttrs, 'version', '1.2');
  rootAttrs = setAttr(rootAttrs, 'baseProfile', 'tiny-ps');
  rootAttrs = ensureSquareViewBox(rootAttrs);
  svg = svg.replace(/<svg\b[^>]*>/i, `<svg ${rootAttrs}>`);

  if (!/<title\b[^>]*>[^<]+<\/title>/i.test(svg)) {
    svg = svg.replace(/<svg\b[^>]*>/i, (tag) => `${tag}<title>Brand logo</title>`);
  }

  return validateBimiSvg(Buffer.from(svg, 'utf8'));
}

export function validateBimiSvg(input: Buffer): string {
  if (!input.length || input.length > MAX_SVG_BYTES) {
    throw new Error('BIMI SVG has an invalid size.');
  }
  const svg = extractSvgDocument(input.toString('utf8'));
  if (
    /<!DOCTYPE|<!ENTITY|<script\b|<foreignObject\b|<iframe\b|<object\b|<embed\b|<image\b|<use\b|<animate\b|<set\b|<style\b/i.test(
      svg,
    ) ||
    /\son[a-z]+\s*=|\b(?:href|xlink:href)\s*=|url\s*\(/i.test(svg)
  ) {
    throw new Error('BIMI SVG contains active or external content.');
  }
  const root = svg.match(/<svg\b([^>]*)>/i)?.[1] || '';
  if (!/\bxmlns\s*=\s*["']http:\/\/www\.w3\.org\/2000\/svg["']/i.test(root)) {
    throw new Error('BIMI SVG must declare the SVG namespace.');
  }
  if (!/\bbaseProfile\s*=\s*["']tiny-ps["']/i.test(root)) {
    throw new Error('BIMI SVG must use the tiny-ps base profile.');
  }
  if (!/\bversion\s*=\s*["']1\.2["']/i.test(root)) {
    throw new Error('BIMI SVG must use SVG version 1.2.');
  }
  if (!/<title\b[^>]*>[^<]+<\/title>/i.test(svg)) {
    throw new Error('BIMI SVG must contain a title.');
  }
  const viewBox = root.match(
    /\bviewBox\s*=\s*["']\s*([+-]?(?:\d+\.?\d*|\.\d+))[\s,]+([+-]?(?:\d+\.?\d*|\.\d+))[\s,]+([+-]?(?:\d+\.?\d*|\.\d+))[\s,]+([+-]?(?:\d+\.?\d*|\.\d+))\s*["']/i,
  );
  if (
    !viewBox ||
    Number(viewBox[3]) <= 0 ||
    Number(viewBox[3]) !== Number(viewBox[4])
  ) {
    throw new Error('BIMI SVG must have a positive square viewBox.');
  }
  return svg;
}

export function sanitizeBimiSvg(input: Buffer): string {
  return normalizeBimiSvg(input);
}

/** Convert a square opaque logo (PNG/JPEG/WebP) into a static BIMI Tiny PS SVG. */
export async function rasterLogoToBimiSvg(input: Buffer): Promise<string> {
  if (!input.length || input.length > MAX_RASTER_BYTES) {
    throw new Error('Logo image must be between 1 byte and 2MB.');
  }

  const size = 128;
  let data: Buffer;
  let info: sharp.OutputInfo;
  try {
    ({ data, info } = await sharp(input, { limitInputPixels: 16_777_216 })
      .rotate()
      .resize(size, size, { fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true }));
  } catch {
    throw new Error('Could not read logo image. Use PNG, JPEG, WebP, or SVG.');
  }

  const width = info.width;
  const height = info.height;
  const channels = info.channels;
  if (width !== height || width <= 0) {
    throw new Error('BIMI logo must be square.');
  }

  const dark = new Uint8Array(width * height);
  let darkCount = 0;
  for (let i = 0; i < width * height; i += 1) {
    const offset = i * channels;
    const alpha = data[offset + 3] ?? 255;
    const luminance = data[offset] + data[offset + 1] + data[offset + 2];
    const isDark = alpha > 200 && luminance < 200;
    dark[i] = isDark ? 1 : 0;
    if (isDark) darkCount += 1;
  }
  if (darkCount < 16) {
    throw new Error(
      'Logo silhouette is empty. Use a dark logo on a light background.',
    );
  }

  const rects: string[] = [];
  for (let y = 0; y < height; y += 1) {
    let x = 0;
    while (x < width) {
      while (x < width && !dark[y * width + x]) x += 1;
      if (x >= width) break;
      const start = x;
      while (x < width && dark[y * width + x]) x += 1;
      rects.push(
        `<rect x="${start}" y="${y}" width="${x - start}" height="1"/>`,
      );
    }
  }

  const svg = [
    `<svg version="1.2" baseProfile="tiny-ps" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`,
    '<title>Brand logo</title>',
    '<g fill="#000000">',
    ...rects,
    '</g>',
    '</svg>',
  ].join('');

  return validateBimiSvg(Buffer.from(svg, 'utf8'));
}

async function readUploadBuffer(file: Express.Multer.File): Promise<Buffer> {
  const normalize = (input: unknown): Buffer | null => {
    if (!input) return null;
    try {
      if (Buffer.isBuffer(input)) return input.length ? input : null;
      if (input instanceof Uint8Array) {
        return input.length ? Buffer.from(input) : null;
      }
      if (typeof input === 'object') {
        const maybe = input as {
          type?: string;
          data?: number[];
          buffer?: { type?: string; data?: number[] };
        };
        if (Array.isArray(maybe.data)) {
          return maybe.data.length ? Buffer.from(maybe.data) : null;
        }
        if (maybe.buffer && Array.isArray(maybe.buffer.data)) {
          return maybe.buffer.data.length
            ? Buffer.from(maybe.buffer.data)
            : null;
        }
      }
    } catch {
      return null;
    }
    return null;
  };

  let buffer = normalize(file?.buffer);
  if (!buffer && file?.path) {
    const { readFile } = await import('fs/promises');
    buffer = await readFile(file.path);
  }
  return buffer ?? Buffer.alloc(0);
}

type CertificateMetadata = {
  type: MailBrandCertificateType;
  subject: string;
  issuer: string;
  serial: string;
  fingerprint: string;
  validFrom: Date;
  validTo: Date;
  domains: string[];
};

@Injectable()
export class MailBimiService {
  private readonly logger = new Logger(MailBimiService.name);
  private readonly inFlight = new Map<string, Promise<MailSenderBrand>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly s3: S3Service,
    private readonly config: ConfigService,
    private readonly flags: MailFeatureFlags,
  ) {}

  async setupStatus(userId: string, publicAppId: string) {
    this.flags.requireOutboundBimi();
    const app = await this.requireOwnedApp(userId, publicAppId);
    const domain = normalizeSenderDomain(app.primaryDomain || '');
    if (!domain) {
      throw new BadRequestException(
        'Connect a valid domain before configuring BIMI.',
      );
    }
    return this.buildSetupStatus(publicAppId, domain);
  }

  async uploadCustomerLogo(
    userId: string,
    publicAppId: string,
    file: Express.Multer.File,
  ) {
    this.flags.requireOutboundBimi();
    const app = await this.requireOwnedApp(userId, publicAppId);
    const domain = normalizeSenderDomain(app.primaryDomain || '');
    if (!domain) {
      throw new BadRequestException(
        'Connect a valid domain before uploading a BIMI logo.',
      );
    }

    const buffer = await readUploadBuffer(file);
    if (!buffer.length) {
      throw new BadRequestException('No logo file was received. Try again.');
    }
    if (buffer.length > MAX_RASTER_BYTES || file.size > MAX_RASTER_BYTES) {
      throw new BadRequestException('Logo must be no larger than 2MB.');
    }

    const extension = file.originalname?.toLowerCase().split('.').pop() || '';
    const mime = (file.mimetype || '').split(';')[0].trim().toLowerCase();
    const isSvg =
      extension === 'svg' ||
      mime === 'image/svg+xml' ||
      mime === 'image/svg' ||
      mime === 'text/xml' ||
      mime === 'application/xml';
    const isRaster =
      ['png', 'jpg', 'jpeg', 'webp'].includes(extension) ||
      mime === 'image/png' ||
      mime === 'image/jpeg' ||
      mime === 'image/webp';

    if (!isSvg && !isRaster) {
      throw new BadRequestException(
        'Upload a square PNG, JPEG, WebP, or SVG logo.',
      );
    }

    let svg: string;
    try {
      if (isSvg && !isLikelyBinaryImage(buffer)) {
        svg = sanitizeBimiSvg(buffer);
      } else {
        svg = await rasterLogoToBimiSvg(buffer);
      }
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Invalid BIMI logo document.',
      );
    }

    let raster: Buffer;
    try {
      raster = await sharp(Buffer.from(svg, 'utf8'), {
        density: 144,
        limitInputPixels: 16_777_216,
      })
        .resize(512, 512, { fit: 'contain', withoutEnlargement: false })
        .webp({ quality: 90 })
        .toBuffer();
    } catch {
      throw new BadRequestException('BIMI SVG could not be safely rasterized.');
    }

    const bucket = this.s3.getDefaultBucket();
    const prefix = this.customerLogoPrefix(publicAppId);
    await Promise.all([
      this.s3.uploadBuffer(
        bucket,
        `${prefix}/logo.svg`,
        Buffer.from(svg, 'utf8'),
        'image/svg+xml',
      ),
      this.s3.uploadBuffer(bucket, `${prefix}/logo.webp`, raster, 'image/webp'),
    ]);

    return this.buildSetupStatus(publicAppId, domain);
  }

  async publicCustomerLogo(
    publicAppId: string,
    format: 'svg' | 'webp',
  ): Promise<Buffer | null> {
    if (!this.flags.outboundBimi()) return null;
    if (!/^\d{16}$/.test(publicAppId)) return null;
    return this.s3.getObject(
      this.s3.getDefaultBucket(),
      `${this.customerLogoPrefix(publicAppId)}/logo.${format}`,
    );
  }

  private async buildSetupStatus(publicAppId: string, domain: string) {
    const [dmarcRecords, bimiRecords, logoUploaded] = await Promise.all([
      this.txtRecords(`_dmarc.${domain}`),
      this.txtRecords(`default._bimi.${domain}`),
      this.s3.objectExists(
        this.s3.getDefaultBucket(),
        `${this.customerLogoPrefix(publicAppId)}/logo.svg`,
      ),
    ]);
    const dmarc = parseDmarcRecord(dmarcRecords);
    const bimi = parseBimiRecord(bimiRecords);
    const logoUrl = this.customerLogoUrl(publicAppId, 'svg');
    const expectedRecord = `v=BIMI1; l=${logoUrl};`;
    return {
      domain,
      selector: 'default',
      host: 'default._bimi',
      logoUploaded,
      logoUrl,
      previewUrl: this.customerLogoUrl(publicAppId, 'webp'),
      dmarc: {
        status: dmarc?.enforced
          ? 'ENFORCED'
          : dmarc
            ? 'NOT_ENFORCED'
            : 'MISSING',
        policy: dmarc?.policy || null,
        percentage: dmarc?.percentage ?? null,
        record: dmarc?.raw || null,
        required: 'p=quarantine or p=reject with pct=100',
      },
      bimi: {
        status: bimi
          ? bimi.logoUrl === logoUrl
            ? 'VERIFIED'
            : 'MISMATCH'
          : bimiRecords.length
            ? 'INVALID'
            : 'MISSING',
        expectedRecord,
        observedRecord: bimi?.raw || bimiRecords[0] || null,
        authorityUrl: bimi?.authorityUrl || null,
      },
      ready: Boolean(
        logoUploaded && dmarc?.enforced && bimi?.logoUrl === logoUrl,
      ),
    };
  }

  private async requireOwnedApp(userId: string, publicAppId: string) {
    const app = await this.prisma.mailApp.findUnique({
      where: { appId: publicAppId },
      select: { userId: true, primaryDomain: true },
    });
    if (!app) throw new NotFoundException('Mail app not found.');
    if (app.userId !== userId) {
      throw new ForbiddenException('You do not own this Mail app.');
    }
    return app;
  }

  private customerLogoPrefix(publicAppId: string) {
    return `logos/mail-bimi/${publicAppId}`;
  }

  private customerLogoUrl(publicAppId: string, format: 'svg' | 'webp') {
    const base = (
      this.config.get<string>('API_PUBLIC_URL') ||
      this.config.get<string>('API_BASE_URL') ||
      'http://localhost:3001'
    ).replace(/\/$/, '');
    return `${base}/api/v1/mail/public/bimi/${publicAppId}/logo.${format}`;
  }

  async resolveAndPersist(value: string): Promise<MailSenderBrand | null> {
    if (!this.flags.resolveBimi()) return null;
    const domain = normalizeSenderDomain(value);
    if (!domain) return null;

    const pending = this.inFlight.get(domain);
    if (pending) return pending;

    const task = this.resolveDomain(domain).finally(() => {
      this.inFlight.delete(domain);
    });
    this.inFlight.set(domain, task);
    return task;
  }

  private async resolveDomain(domain: string): Promise<MailSenderBrand> {
    const cacheKey = `mail:bimi:${domain}`;
    const cached = await this.redis.get<{ id?: string; expiresAt?: string }>(
      cacheKey,
    );
    if (cached?.id && cached.expiresAt) {
      const expiresAt = new Date(cached.expiresAt);
      if (expiresAt.getTime() > Date.now()) {
        const row = await this.prisma.mailSenderBrand.findUnique({
          where: { id: cached.id },
        });
        if (row) return row;
      }
    }

    const existing = await this.prisma.mailSenderBrand.findUnique({
      where: { domain },
    });
    if (existing?.expiresAt && existing.expiresAt.getTime() > Date.now()) {
      await this.redis.set(
        cacheKey,
        this.cacheValue(existing),
        this.ttl(existing),
      );
      return existing;
    }

    const checkedAt = new Date();
    try {
      const [bimiRecords, dmarcRecords] = await Promise.all([
        this.txtRecords(`default._bimi.${domain}`),
        this.txtRecords(`_dmarc.${domain}`),
      ]);
      const bimi = parseBimiRecord(bimiRecords);
      const dmarc = parseDmarcRecord(dmarcRecords);

      if (!bimi) {
        return this.saveResult(domain, {
          status: MailSenderBrandStatus.NO_RECORD,
          dmarcPolicy: dmarc?.policy || null,
          lastError: 'No single valid BIMI1 record was found.',
          checkedAt,
          expiresAt: afterSeconds(NEGATIVE_TTL_SECONDS),
        });
      }
      if (!dmarc?.enforced) {
        return this.saveResult(domain, {
          status: MailSenderBrandStatus.INVALID,
          bimiRecord: bimi.raw,
          logoSourceUrl: bimi.logoUrl,
          authorityUrl: bimi.authorityUrl,
          dmarcPolicy: dmarc?.policy || null,
          lastError: 'DMARC must enforce quarantine or reject at pct=100.',
          checkedAt,
          expiresAt: afterSeconds(NEGATIVE_TTL_SECONDS),
        });
      }

      const svgBuffer = await this.fetchLimited(
        bimi.logoUrl,
        MAX_SVG_BYTES,
        'image/svg+xml',
      );
      const svg = validateBimiSvg(svgBuffer);
      const logoHash = createHash('sha256').update(svg).digest('hex');
      const logoKey = `logos/mail-senders/${domain}/${logoHash}.webp`;
      const raster = await sharp(Buffer.from(svg))
        .resize(256, 256, { fit: 'contain', withoutEnlargement: true })
        .webp({ quality: 90 })
        .toBuffer();
      await this.s3.uploadBuffer(
        this.config.get<string>('S3_BUCKET') || 'rukny-storage',
        logoKey,
        raster,
        'image/webp',
      );

      const certificate = bimi.authorityUrl
        ? await this.fetchCertificate(bimi.authorityUrl, domain)
        : null;
      return this.saveResult(domain, {
        status: MailSenderBrandStatus.READY,
        bimiRecord: bimi.raw,
        logoSourceUrl: bimi.logoUrl,
        authorityUrl: bimi.authorityUrl,
        logoS3Key: logoKey,
        logoSha256: logoHash,
        dmarcPolicy: dmarc.policy,
        certificateType: certificate?.type ?? MailBrandCertificateType.NONE,
        certificateSubject: certificate?.subject,
        certificateIssuer: certificate?.issuer,
        certificateSerial: certificate?.serial,
        certificateFingerprint: certificate?.fingerprint,
        certificateValidFrom: certificate?.validFrom,
        certificateValidTo: certificate?.validTo,
        certificateDomains: certificate?.domains ?? [],
        lastError: null,
        checkedAt,
        expiresAt: afterSeconds(POSITIVE_TTL_SECONDS),
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown BIMI resolution error.';
      this.logger.warn(`BIMI resolution failed domain=${domain}: ${message}`);
      return this.saveResult(domain, {
        status: MailSenderBrandStatus.ERROR,
        lastError: message.slice(0, 500),
        checkedAt,
        expiresAt: afterSeconds(NEGATIVE_TTL_SECONDS),
      });
    }
  }

  private async txtRecords(name: string): Promise<string[]> {
    try {
      const rows = await resolveTxt(name);
      return rows.map((chunks) => chunks.join(''));
    } catch (error) {
      const code = (error as NodeJS.ErrnoException)?.code;
      if (code === 'ENOTFOUND' || code === 'ENODATA') return [];
      throw error;
    }
  }

  private async fetchLimited(
    rawUrl: string,
    maxBytes: number,
    expectedType?: string,
  ): Promise<Buffer> {
    if (!isHttpsUrl(rawUrl)) throw new Error('BIMI assets require HTTPS.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await safeFetch(rawUrl, {
        signal: controller.signal,
        headers: {
          Accept: expectedType || 'application/pem-certificate-chain',
        },
      });
      if (!response.ok) {
        throw new Error(`BIMI asset returned HTTP ${response.status}.`);
      }
      const length = Number(response.headers.get('content-length') || 0);
      if (length > maxBytes) throw new Error('BIMI asset exceeds size limit.');
      if (!response.body) throw new Error('BIMI asset has no body.');

      const reader = response.body.getReader();
      const chunks: Buffer[] = [];
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          throw new Error('BIMI asset exceeds size limit.');
        }
        chunks.push(Buffer.from(value));
      }
      return Buffer.concat(chunks);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fetchCertificate(
    url: string,
    domain: string,
  ): Promise<CertificateMetadata> {
    const body = await this.fetchLimited(url, MAX_CERT_BYTES);
    const certificates = parseCertificateBundle(body);
    if (!certificates.length)
      throw new Error('BIMI authority is not an X.509 certificate.');
    const leaf = certificates[0];
    const validFrom = new Date(leaf.validFrom);
    const validTo = new Date(leaf.validTo);
    const now = Date.now();
    if (
      !Number.isFinite(validFrom.getTime()) ||
      !Number.isFinite(validTo.getTime()) ||
      validFrom.getTime() > now ||
      validTo.getTime() <= now
    ) {
      throw new Error('BIMI certificate is outside its validity period.');
    }
    if (!leaf.checkHost(domain, { wildcards: true })) {
      throw new Error('BIMI certificate does not match the sender domain.');
    }

    const legacy = leaf.toLegacyObject() as {
      ext_key_usage?: string[];
      subjectaltname?: string;
    };
    const eku = legacy.ext_key_usage ?? [];
    if (!eku.includes(BIMI_EKU_OID)) {
      throw new Error('Certificate is not authorized for BIMI.');
    }
    if (!validateCertificateChain(certificates)) {
      throw new Error('BIMI certificate chain could not be validated.');
    }

    return {
      // Node's X509Certificate can validate identity metadata and the BIMI EKU,
      // but cannot prove VMC-vs-CMC trademark policy or embedded logo binding.
      // Fail closed for the blue VMC badge until a policy/logotype ASN.1
      // validator is available.
      type: MailBrandCertificateType.UNKNOWN,
      subject: leaf.subject,
      issuer: leaf.issuer,
      serial: leaf.serialNumber,
      fingerprint: leaf.fingerprint256,
      validFrom,
      validTo,
      domains: certificateDomains(leaf),
    };
  }

  private async saveResult(
    domain: string,
    data: Omit<Prisma.MailSenderBrandUncheckedCreateInput, 'domain'>,
  ): Promise<MailSenderBrand> {
    const row = await this.prisma.mailSenderBrand.upsert({
      where: { domain },
      create: { domain, ...data },
      update: data,
    });
    await this.redis.set(
      `mail:bimi:${domain}`,
      this.cacheValue(row),
      this.ttl(row),
    );
    return row;
  }

  private cacheValue(row: MailSenderBrand) {
    return {
      id: row.id,
      status: row.status,
      expiresAt: row.expiresAt?.toISOString(),
    };
  }

  private ttl(row: MailSenderBrand) {
    const seconds = row.expiresAt
      ? Math.ceil((row.expiresAt.getTime() - Date.now()) / 1000)
      : NEGATIVE_TTL_SECONDS;
    return Math.max(1, Math.min(seconds, POSITIVE_TTL_SECONDS));
  }
}

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
}

function afterSeconds(seconds: number): Date {
  return new Date(Date.now() + seconds * 1000);
}

function parseCertificateBundle(body: Buffer): X509Certificate[] {
  const text = body.toString('utf8');
  const pemBlocks =
    text.match(
      /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g,
    ) ?? [];
  try {
    return pemBlocks.length
      ? pemBlocks.map((pem) => new X509Certificate(pem))
      : [new X509Certificate(body)];
  } catch {
    return [];
  }
}

function validateCertificateChain(certificates: X509Certificate[]): boolean {
  try {
    for (let index = 0; index < certificates.length - 1; index += 1) {
      const child = certificates[index];
      const issuer = certificates[index + 1];
      if (!child.checkIssued(issuer) || !child.verify(issuer.publicKey)) {
        return false;
      }
    }
    const last = certificates[certificates.length - 1];
    for (const pem of rootCertificates) {
      const root = new X509Certificate(pem);
      if (
        (last.raw.equals(root.raw) && last.verify(root.publicKey)) ||
        (last.checkIssued(root) && last.verify(root.publicKey))
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

function certificateDomains(certificate: X509Certificate): string[] {
  return (certificate.subjectAltName || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.startsWith('DNS:'))
    .map((entry) => entry.slice(4).toLowerCase());
}
