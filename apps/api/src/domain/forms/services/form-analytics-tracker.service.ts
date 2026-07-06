import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { SecureIds } from '../../../core/common/utils/secure-id.util';
import { FormGeoResolverService } from './form-geo-resolver.service';
import { normalizeAnalyticsCity } from '../utils/form-city-normalizer.util';

function todayDateOnly(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function parseDeviceType(userAgent?: string | null): {
  deviceType: string;
  browser: string;
  os: string;
} {
  const ua = (userAgent || '').toLowerCase();
  let deviceType = 'desktop';
  if (
    ua.includes('mobile') ||
    ua.includes('android') ||
    ua.includes('iphone')
  ) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  }

  let browser = 'unknown';
  if (ua.includes('chrome')) browser = 'chrome';
  else if (ua.includes('firefox')) browser = 'firefox';
  else if (ua.includes('safari')) browser = 'safari';
  else if (ua.includes('edge')) browser = 'edge';

  let os = 'unknown';
  if (ua.includes('windows')) os = 'windows';
  else if (ua.includes('mac')) os = 'macos';
  else if (ua.includes('android')) os = 'android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'ios';
  else if (ua.includes('linux')) os = 'linux';

  return { deviceType, browser, os };
}

export interface AnalyticsTrackContext {
  userAgent?: string | null;
  ip?: string | null;
  headers?: Record<string, string | string[] | undefined>;
}

@Injectable()
export class FormAnalyticsTrackerService {
  private readonly logger = new Logger(FormAnalyticsTrackerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly geoResolver: FormGeoResolverService,
  ) {}

  async recordShare(formId: string): Promise<void> {
    const date = todayDateOnly();
    try {
      await this.prisma.form_analytics.upsert({
        where: { formId_date: { formId, date } },
        create: {
          id: SecureIds.generic(),
          formId,
          date,
          views: 0,
          submissions: 0,
          shares: 1,
        },
        update: { shares: { increment: 1 } },
      });
    } catch (err) {
      this.logger.warn(`recordShare failed for ${formId}: ${err?.message}`);
    }
  }

  async recordView(
    formId: string,
    context?: AnalyticsTrackContext,
  ): Promise<void> {
    const date = todayDateOnly();
    const userAgent = context?.userAgent;
    try {
      await this.prisma.form_analytics.upsert({
        where: { formId_date: { formId, date } },
        create: {
          id: SecureIds.generic(),
          formId,
          date,
          views: 1,
          submissions: 0,
        },
        update: { views: { increment: 1 } },
      });

      if (userAgent) {
        const { deviceType, browser, os } = parseDeviceType(userAgent);
        await this.prisma.form_device_analytics.upsert({
          where: {
            formId_date_deviceType_browser_os: {
              formId,
              date,
              deviceType,
              browser: browser ?? '',
              os: os ?? '',
            },
          },
          create: {
            id: SecureIds.generic(),
            formId,
            date,
            deviceType,
            browser: browser ?? '',
            os: os ?? '',
            views: 1,
            submissions: 0,
          },
          update: { views: { increment: 1 } },
        });
      }

      const geo = await this.geoResolver.resolveFromIp(
        context?.ip,
        context?.headers,
      );
      if (geo) {
        await this.upsertGeo(formId, date, geo, 'view');
      }
    } catch (err) {
      this.logger.warn(`recordView failed for ${formId}: ${err?.message}`);
    }
  }

  async recordSubmission(
    formId: string,
    fields: { id: string }[],
    data: Record<string, unknown>,
    context?: AnalyticsTrackContext,
    timeToComplete?: number | null,
  ): Promise<void> {
    const date = todayDateOnly();
    const userAgent = context?.userAgent;
    try {
      const form = await this.prisma.form.findUnique({
        where: { id: formId },
        select: { viewCount: true, submissionCount: true },
      });

      const views = form?.viewCount ?? 0;
      const submissions = (form?.submissionCount ?? 0) + 1;
      const completionRate = views > 0 ? (submissions / views) * 100 : 0;

      await this.prisma.form_analytics.upsert({
        where: { formId_date: { formId, date } },
        create: {
          id: SecureIds.generic(),
          formId,
          date,
          views: 0,
          submissions: 1,
          completionRate,
          avgTimeToComplete: timeToComplete ?? null,
        },
        update: {
          submissions: { increment: 1 },
          completionRate,
          ...(timeToComplete != null && { avgTimeToComplete: timeToComplete }),
        },
      });

      if (userAgent) {
        const { deviceType, browser, os } = parseDeviceType(userAgent);
        await this.prisma.form_device_analytics.upsert({
          where: {
            formId_date_deviceType_browser_os: {
              formId,
              date,
              deviceType,
              browser: browser ?? '',
              os: os ?? '',
            },
          },
          create: {
            id: SecureIds.generic(),
            formId,
            date,
            deviceType,
            browser: browser ?? '',
            os: os ?? '',
            views: 0,
            submissions: 1,
          },
          update: { submissions: { increment: 1 } },
        });
      }

      for (const field of fields) {
        const value = data[field.id];
        const answered =
          value !== undefined && value !== null && value !== '';
        await this.prisma.form_field_analytics.upsert({
          where: {
            formId_fieldId_date: { formId, fieldId: field.id, date },
          },
          create: {
            id: SecureIds.generic(),
            formId,
            fieldId: field.id,
            date,
            responses: answered ? 1 : 0,
            skipped: answered ? 0 : 1,
          },
          update: {
            responses: answered ? { increment: 1 } : undefined,
            skipped: answered ? undefined : { increment: 1 },
          },
        });
      }

      const geo = await this.geoResolver.resolveFromIp(
        context?.ip,
        context?.headers,
      );
      if (geo) {
        await this.upsertGeo(formId, date, geo, 'submission');
      }
    } catch (err) {
      this.logger.warn(
        `recordSubmission analytics failed for ${formId}: ${err?.message}`,
      );
    }
  }

  private async upsertGeo(
    formId: string,
    date: Date,
    geo: Awaited<ReturnType<FormGeoResolverService['resolveFromIp']>>,
    kind: 'view' | 'submission',
  ) {
    if (!geo) return;

    const countryCode = geo.countryCode || 'XX';
    const governorateCode = geo.governorateCode || '';
    const city =
      normalizeAnalyticsCity(geo.city, countryCode) ||
      geo.city?.trim() ||
      '';

    await this.prisma.form_geographic_analytics.upsert({
      where: {
        formId_date_countryCode_governorateCode_city: {
          formId,
          date,
          countryCode,
          governorateCode,
          city,
        },
      },
      create: {
        id: SecureIds.generic(),
        formId,
        date,
        country: geo.countryName,
        countryCode,
        governorateCode,
        city,
        views: kind === 'view' ? 1 : 0,
        submissions: kind === 'submission' ? 1 : 0,
      },
      update: {
        ...(kind === 'view'
          ? { views: { increment: 1 } }
          : { submissions: { increment: 1 } }),
        ...(geo.countryName && { country: geo.countryName }),
      },
    });
  }
}
