import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  getGovernorateMeta,
  resolveIraqGovernorate,
  type IraqGovernorateCode,
} from '../data/iraq-governorates';
import { normalizeAnalyticsCity } from '../utils/form-city-normalizer.util';
import { resolveIraqGovernorateByCoordinates } from '../utils/iraq-governorate-polygon.util';

export interface ResolvedGeo {
  countryCode: string;
  countryName: string | null;
  city: string | null;
  governorateCode: IraqGovernorateCode | '';
  source: 'cloudflare' | 'ipapi' | 'mock';
}

interface CloudflareGeoHeaders {
  country: string | null;
  city: string | null;
  region: string | null;
  regionCode: string | null;
  latitude: number | null;
  longitude: number | null;
}

type GeoProvider = 'cloudflare' | 'ipapi' | 'auto';

@Injectable()
export class FormGeoResolverService {
  private readonly logger = new Logger(FormGeoResolverService.name);
  private readonly cache = new Map<string, ResolvedGeo>();
  private readonly provider: GeoProvider;

  constructor(private readonly config: ConfigService) {
    const configured = this.config.get<string>('GEOIP_PROVIDER')?.toLowerCase();
    this.provider =
      configured === 'cloudflare' || configured === 'ipapi'
        ? configured
        : 'auto';
  }

  async resolveFromIp(
    ip?: string | null,
    headers?: Record<string, string | string[] | undefined>,
  ): Promise<ResolvedGeo | null> {
    const cloudflare = headers ? this.parseCloudflareHeaders(headers) : null;

    // ── Cloudflare headers present → use directly (with fallback for missing city) ──
    if (cloudflare?.country) {
      let geo = this.buildFromCloudflare(cloudflare);
      
      // If Cloudflare gave us the country but NO city (Managed Transforms might be off)
      // and we are not strictly limited to 'cloudflare' provider, we enrich with ip-api.
      if (!geo.city && ip && !this.isPrivateIp(ip) && this.provider !== 'cloudflare') {
        const cached = this.cache.get(ip);
        if (cached && cached.city) {
          geo.city = cached.city;
          geo.governorateCode = cached.governorateCode || geo.governorateCode;
          geo.source = 'cloudflare+ipapi_cache' as any;
        } else {
          try {
            const fromIp = await this.fetchGeoIp(ip);
            if (fromIp && fromIp.city) {
              geo.city = fromIp.city;
              geo.governorateCode = fromIp.governorateCode || geo.governorateCode;
              geo.source = 'cloudflare+ipapi' as any;
              
              this.cache.set(ip, fromIp);
              if (this.cache.size > 5000) {
                const first = this.cache.keys().next().value;
                if (first) this.cache.delete(first);
              }
            }
          } catch (err) {
            this.logger.debug(`Enrichment from ip-api failed for ${ip}: ${err}`);
          }
        }
      }

      this.logger.debug(
        `GeoResolve[${geo.source}]: ip=${ip ?? '-'} → ${geo.countryCode}/${geo.city ?? '-'}/${geo.governorateCode || '-'}`,
      );
      return geo;
    }

    // ── Private/missing IP → mock geo (dev/local) ──
    if (!ip || this.isPrivateIp(ip)) {
      const mock = this.resolveMockGeo();
      if (mock) {
        this.logger.debug(
          `GeoResolve[mock]: ip=${ip ?? '-'} → ${mock.countryCode}/${mock.city ?? '-'}`,
        );
      } else {
        this.logger.debug(`GeoResolve: ip=${ip ?? '-'} private, no mock configured`);
      }
      return mock;
    }

    // ── ip-api fallback (for 'auto', 'ipapi', or when 'cloudflare' headers are missing) ──
    if (this.provider === 'cloudflare' && !cloudflare?.country) {
      this.logger.warn(
        `GeoResolve: provider=cloudflare but no CF headers for ip=${ip}. ` +
        `Verify Cloudflare IP Geolocation is ON and DNS is Proxied. Falling back to ip-api.`,
      );
    }

    const cached = this.cache.get(ip);
    if (cached) return cached;

    try {
      const fromIp = await this.fetchGeoIp(ip);
      if (fromIp) {
        this.logger.debug(
          `GeoResolve[ipapi]: ip=${ip} → ${fromIp.countryCode}/${fromIp.city ?? '-'}/${fromIp.governorateCode || '-'}`,
        );
        this.cache.set(ip, fromIp);
        if (this.cache.size > 5000) {
          const first = this.cache.keys().next().value;
          if (first) this.cache.delete(first);
        }
      }
      return fromIp;
    } catch (err) {
      this.logger.warn(`GeoIP ip-api lookup failed for ${ip}: ${err}`);
    }

    return null;
  }

  /** Cloudflare geo headers (requires proxied DNS + IP Geolocation enabled). */
  private parseCloudflareHeaders(
    headers: Record<string, string | string[] | undefined>,
  ): CloudflareGeoHeaders | null {
    const country = decodeCfHeader(headers, 'cf-ipcountry');
    if (!country) return null;

    return {
      country,
      city: decodeCfHeader(headers, 'cf-ipcity'),
      region:
        decodeCfHeader(headers, 'cf-ipregion') ??
        decodeCfHeader(headers, 'cf-region'),
      regionCode:
        decodeCfHeader(headers, 'cf-ipregioncode') ??
        decodeCfHeader(headers, 'cf-region-code'),
      latitude: parseCfCoordinate(
        decodeCfHeader(headers, 'cf-iplatitude') ??
          decodeCfHeader(headers, 'cf-ip-latitude'),
      ),
      longitude: parseCfCoordinate(
        decodeCfHeader(headers, 'cf-iplongitude') ??
          decodeCfHeader(headers, 'cf-ip-longitude'),
      ),
    };
  }

  private buildFromCloudflare(cf: CloudflareGeoHeaders): ResolvedGeo {
    const countryCode = cf.country!.toUpperCase().slice(0, 2);
    const city = normalizeAnalyticsCity(cf.city, countryCode, cf.region);
    let governorateCode: IraqGovernorateCode | '' = '';

    if (countryCode === 'IQ') {
      if (cf.latitude != null && cf.longitude != null) {
        governorateCode =
          resolveIraqGovernorateByCoordinates(cf.longitude, cf.latitude) ?? '';
      }

      if (!governorateCode) {
        governorateCode =
          resolveIraqGovernorate({
            city: cf.city,
            region: cf.region ?? cf.regionCode,
          }) ?? '';
      }
    }

    return {
      countryCode,
      countryName: null,
      city: city || null,
      governorateCode,
      source: 'cloudflare',
    };
  }

  private resolveMockGeo(): ResolvedGeo | null {
    const mockCountry = this.config.get<string>('GEOIP_MOCK_COUNTRY');
    if (!mockCountry) return null;

    const mockGovernorate = this.config.get<string>('GEOIP_MOCK_GOVERNORATE');
    const mockCity =
      this.config.get<string>('GEOIP_MOCK_CITY') ??
      (mockGovernorate ? getGovernorateMeta(mockGovernorate)?.nameEn : null) ??
      'Baghdad';

    const region =
      mockGovernorate != null
        ? getGovernorateMeta(mockGovernorate)?.nameEn ?? null
        : null;

    const countryCode = mockCountry.toUpperCase().slice(0, 2);
    const city = normalizeAnalyticsCity(mockCity, countryCode, region);

    return {
      countryCode,
      countryName: null,
      city: city || null,
      governorateCode:
        (mockGovernorate as IraqGovernorateCode | undefined) ??
        resolveIraqGovernorate({ city: mockCity, region }) ??
        '',
      source: 'mock',
    };
  }

  private async fetchGeoIp(ip: string): Promise<ResolvedGeo | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const apiKey = this.config.get<string>('IPAPI_API_KEY')?.trim();
    const baseUrl = apiKey
      ? `https://pro.ip-api.com/json/${encodeURIComponent(ip)}`
      : `http://ip-api.com/json/${encodeURIComponent(ip)}`;
    const keyQuery = apiKey ? `&key=${encodeURIComponent(apiKey)}` : '';

    try {
      const res = await fetch(
        `${baseUrl}?fields=status,country,countryCode,regionName,city,lat,lon${keyQuery}`,
        { signal: controller.signal },
      );
      if (!res.ok) return null;

      const data = (await res.json()) as {
        status?: string;
        country?: string;
        countryCode?: string;
        regionName?: string;
        city?: string;
        lat?: number;
        lon?: number;
      };

      if (data.status !== 'success' || !data.countryCode) return null;

      const countryCode = data.countryCode.toUpperCase().slice(0, 2);
      const city = normalizeAnalyticsCity(
        data.city ?? null,
        countryCode,
        data.regionName ?? null,
      );
      let governorateCode: IraqGovernorateCode | '' = '';

      if (countryCode === 'IQ') {
        if (data.lat != null && data.lon != null) {
          governorateCode =
            resolveIraqGovernorateByCoordinates(data.lon, data.lat) ?? '';
        }
        if (!governorateCode) {
          governorateCode =
            resolveIraqGovernorate({
              city: data.city,
              region: data.regionName,
            }) ?? '';
        }
      }

      return {
        countryCode,
        countryName: data.country ?? null,
        city: city || null,
        governorateCode,
        source: 'ipapi',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private isPrivateIp(rawIp: string): boolean {
    const ip = rawIp.replace(/^::ffff:/i, '');

    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('127.')) {
      return true;
    }
    if (ip.startsWith('10.') || ip.startsWith('192.168.')) {
      return true;
    }
    if (/^172\.(\d+)\./.test(ip)) {
      const second = Number(ip.match(/^172\.(\d+)\./)?.[1]);
      if (second >= 16 && second <= 31) return true;
    }
    return /^fe80:/i.test(ip);
  }
}

function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | null {
  const raw = headers[name.toLowerCase()];
  if (!raw) return null;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() || null;
}

/** Cloudflare may send UTF-8 headers, and may URL-encode city names. */
function decodeCfHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | null {
  const raw = headerValue(headers, name);
  if (!raw) return null;

  // Fix encoding: Node parses HTTP headers as latin1 by default, but Cloudflare sends UTF-8.
  let fixedStr = raw;
  try {
    // If the string contains utf-8 sequences misinterpreted as latin1, this restores them.
    fixedStr = Buffer.from(raw, 'latin1').toString('utf8');
  } catch (e) {
    // Ignore encoding errors
  }

  try {
    return decodeURIComponent(fixedStr.replace(/\+/g, ' ')).trim() || null;
  } catch {
    return fixedStr.replace(/\+/g, ' ').trim() || null;
  }
}

function parseCfCoordinate(raw: string | null): number | null {
  if (!raw) return null;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}

export function hasCloudflareCityHeader(
  headers: Record<string, string | string[] | undefined>,
): boolean {
  return Boolean(decodeCfHeader(headers, 'cf-ipcity'));
}
