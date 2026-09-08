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
const MAX_CERT_BYTES = 1024 * 1024;
const FETCH_TIMEOUT_MS = 8_000;
const BIMI_EKU_OID = '1.3.6.1.5.5.7.3.31';
export const BIMI_MAX_SVG_BYTES = MAX_SVG_BYTES;

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

export function validateBimiSvg(input: Buffer): string {
  if (!input.length || input.length > MAX_SVG_BYTES) {
    throw new Error('BIMI SVG has an invalid size.');
  }
  const svg = input
    .toString('utf8')
    .replace(/^\uFEFF/, '')
    .trim();
  if (!/^<\?xml[\s\S]*?\?>\s*<svg\b/i.test(svg) && !/^<svg\b/i.test(svg)) {
    throw new Error('BIMI logo is not an SVG document.');
  }
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
  const text = input
    .toString('utf8')
    .replace(/^\uFEFF/, '')
    .trim();
  const sanitized = text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\?(?!xml(?:\s|\?>))[\s\S]*?\?>/gi, '')
    .trim();
  return validateBimiSvg(Buffer.from(sanitized, 'utf8'));
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
    if (
      !file?.buffer ||
      file.buffer.length === 0 ||
      file.buffer.length > MAX_SVG_BYTES ||
      file.size > MAX_SVG_BYTES
    ) {
      throw new BadRequestException('BIMI SVG must be no larger than 256KB.');
    }
    const extension = file.originalname?.toLowerCase().split('.').pop();
    if (file.mimetype !== 'image/svg+xml' || extension !== 'svg') {
      throw new BadRequestException(
        'Only SVG files with image/svg+xml are accepted.',
      );
    }

    let svg: string;
    try {
      svg = sanitizeBimiSvg(file.buffer);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Invalid BIMI SVG Tiny PS document.',
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
