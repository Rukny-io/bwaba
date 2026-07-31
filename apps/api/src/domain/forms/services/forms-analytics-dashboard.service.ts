import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { SecureIds } from '../../../core/common/utils/secure-id.util';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import {
  hasMinFeatureTier,
  resolveFormAnalyticsTierForFree,
} from '../../subscriptions/form-feature-tier.util';
import {
  stripAdvancedFormAnalytics,
} from '../utils/form-plan-enforcement.util';
import { UNKNOWN_CITY_LABEL } from '../utils/form-geo-backfill.util';
import { IRAQ_GOVERNORATES } from '../data/iraq-governorates';
import { FormTeamAccessService } from '../form-team/form-team-access.service';

const COUNTRY_LABELS: Record<string, { name: string; nameAr: string }> = {
  IQ: { name: 'Iraq', nameAr: 'العراق' },
  TR: { name: 'Turkey', nameAr: 'تركيا' },
  IR: { name: 'Iran', nameAr: 'إيران' },
  SA: { name: 'Saudi Arabia', nameAr: 'السعودية' },
  JO: { name: 'Jordan', nameAr: 'الأردن' },
  SY: { name: 'Syria', nameAr: 'سوريا' },
  KW: { name: 'Kuwait', nameAr: 'الكويت' },
  AE: { name: 'United Arab Emirates', nameAr: 'الإمارات' },
  QA: { name: 'Qatar', nameAr: 'قطر' },
  BH: { name: 'Bahrain', nameAr: 'البحرين' },
  OM: { name: 'Oman', nameAr: 'عُمان' },
  LB: { name: 'Lebanon', nameAr: 'لبنان' },
  PS: { name: 'Palestine', nameAr: 'فلسطين' },
  US: { name: 'United States', nameAr: 'الولايات المتحدة' },
  GB: { name: 'United Kingdom', nameAr: 'المملكة المتحدة' },
  DE: { name: 'Germany', nameAr: 'ألمانيا' },
  FR: { name: 'France', nameAr: 'فرنسا' },
  EG: { name: 'Egypt', nameAr: 'مصر' },
  XX: { name: 'Unknown', nameAr: 'غير معروف' },
};

const DECORATIVE_FIELD_TYPES = new Set([
  'HEADING',
  'PARAGRAPH',
  'DIVIDER',
  'TITLE',
  'LABEL',
  'IMAGE',
  'VIDEO',
  'AUDIO',
  'EMBED',
  'RECAPTCHA',
  'HIDDEN',
  'CONDITIONAL_LOGIC',
  'CALCULATED',
]);

const INPUT_CHOICE_TYPES = new Set([
  'SELECT',
  'RADIO',
  'MULTISELECT',
  'CHECKBOX',
  'TOGGLE',
]);

interface PeriodBounds {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  days: number;
}

@Injectable()
export class FormsAnalyticsDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly formTeamAccess: FormTeamAccessService,
  ) {}

  private async userHasAdvancedAnalytics(userId: string): Promise<boolean> {
    const [limits, plan] = await Promise.all([
      this.subscriptionsService.getUserLimits(userId),
      this.subscriptionsService.getUserPlan(userId),
    ]);
    const tier = resolveFormAnalyticsTierForFree(plan, limits);
    if (tier === false) return false;
    return hasMinFeatureTier(
      { ...limits, formAnalytics: tier },
      'formAnalytics',
      'advanced',
    );
  }

  async getOverview(userId: string, days = 30) {
    const period = this.resolvePeriod(days);
    const forms = await this.prisma.form.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        type: true,
        viewCount: true,
        submissionCount: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    const formIds = forms.map((f) => f.id);
    if (formIds.length === 0) {
      return this.emptyOverview(period);
    }

    const [currentRows, prevRows, deviceRows, perFormCurrent, geoRows] =
      await Promise.all([
        this.prisma.form_analytics.groupBy({
          by: ['date'],
          where: {
            formId: { in: formIds },
            date: { gte: period.start, lte: period.end },
          },
          _sum: { views: true, submissions: true },
          orderBy: { date: 'asc' },
        }),
        this.prisma.form_analytics.aggregate({
          where: {
            formId: { in: formIds },
            date: { gte: period.prevStart, lte: period.prevEnd },
          },
          _sum: { views: true, submissions: true },
        }),
        this.prisma.form_device_analytics.groupBy({
          by: ['deviceType'],
          where: {
            formId: { in: formIds },
            date: { gte: period.start, lte: period.end },
          },
          _sum: { views: true, submissions: true },
        }),
        this.prisma.form_analytics.groupBy({
          by: ['formId'],
          where: {
            formId: { in: formIds },
            date: { gte: period.start, lte: period.end },
          },
          _sum: { views: true, submissions: true },
        }),
        this.prisma.form_geographic_analytics.groupBy({
          by: ['countryCode', 'governorateCode'],
          where: {
            formId: { in: formIds },
            date: { gte: period.start, lte: period.end },
          },
          _sum: { views: true, submissions: true },
        }),
      ]);

    const currentViews = this.sumAgg(currentRows, 'views');
    const currentSubmissions = this.sumAgg(currentRows, 'submissions');
    const prevViews = prevRows._sum.views ?? 0;
    const prevSubmissions = prevRows._sum.submissions ?? 0;

    const completionRate =
      currentViews > 0
        ? Math.round((currentSubmissions / currentViews) * 10000) / 100
        : 0;
    const prevCompletionRate =
      prevViews > 0
        ? Math.round((prevSubmissions / prevViews) * 10000) / 100
        : 0;

    const perFormMap = new Map(
      perFormCurrent.map((r) => [
        r.formId,
        {
          views: r._sum.views ?? 0,
          submissions: r._sum.submissions ?? 0,
        },
      ]),
    );

    const formRows = forms.map((form) => {
      const stats = perFormMap.get(form.id) ?? { views: 0, submissions: 0 };
      const rate =
        stats.views > 0
          ? Math.round((stats.submissions / stats.views) * 10000) / 100
          : 0;
      return {
        id: form.id,
        title: form.title,
        slug: form.slug,
        status: form.status,
        type: form.type,
        views: stats.views,
        submissions: stats.submissions,
        completionRate: rate,
        totalViews: form.viewCount,
        totalSubmissions: form.submissionCount,
        updatedAt: form.updatedAt,
      };
    });

    const topForms = [...formRows]
      .sort((a, b) => b.submissions - a.submissions)
      .slice(0, 5);

    const needsAttention = formRows
      .filter((f) => {
        if (f.status === 'PUBLISHED' && f.submissions === 0) return true;
        if (
          f.status === 'PUBLISHED' &&
          f.views >= 10 &&
          f.completionRate < 5
        ) {
          return true;
        }
        return false;
      })
      .slice(0, 5)
      .map((f) => ({
        id: f.id,
        title: f.title,
        slug: f.slug,
        reason:
          f.submissions === 0
            ? 'منشور بدون استجابات في الفترة'
            : 'معدل إكمال منخفض',
      }));

    const deviceTotal = deviceRows.reduce(
      (acc, row) => acc + (row._sum.submissions ?? 0),
      0,
    );

    return {
      period: {
        days: period.days,
        startDate: period.start.toISOString().slice(0, 10),
        endDate: period.end.toISOString().slice(0, 10),
      },
      summary: {
        views: currentViews,
        submissions: currentSubmissions,
        completionRate,
        avgTimeToComplete: 0,
        viewsTrend: this.calcTrend(currentViews, prevViews),
        submissionsTrend: this.calcTrend(currentSubmissions, prevSubmissions),
        completionRateTrend: this.calcTrend(completionRate, prevCompletionRate),
      },
      dailyTrend: this.buildDailyTrend(currentRows, period),
      topForms,
      needsAttention,
      deviceBreakdown: deviceRows.map((row) => {
        const submissions = row._sum.submissions ?? 0;
        return {
          deviceType: row.deviceType,
          views: row._sum.views ?? 0,
          submissions,
          percentage:
            deviceTotal > 0
              ? Math.round((submissions / deviceTotal) * 100)
              : 0,
        };
      }),
      geoBreakdown: this.buildGeoBreakdown(geoRows),
      forms: formRows,
    };
  }

  async getFormAnalytics(userId: string, formId: string, days = 30) {
    const period = this.resolvePeriod(days);

    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: { fields: { orderBy: { order: 'asc' } } },
    });

    if (!form) throw new NotFoundException('Form not found');
    await this.formTeamAccess.assertFormPermission(
      form,
      userId,
      'view_analytics',
      'Not authorized to view analytics',
    );

    const [submissions, dailyAnalytics, deviceRows, prevAnalytics, geoRows, cityRows, unknownCityAgg, shareAgg, prevShareAgg] =
      await Promise.all([
        this.prisma.form_submissions.findMany({
          where: {
            formId,
            completedAt: { gte: period.start, lte: period.end },
          },
          orderBy: { completedAt: 'asc' },
        }),
        this.prisma.form_analytics.findMany({
          where: {
            formId,
            date: { gte: period.start, lte: period.end },
          },
          orderBy: { date: 'asc' },
        }),
        this.prisma.form_device_analytics.groupBy({
          by: ['deviceType'],
          where: {
            formId,
            date: { gte: period.start, lte: period.end },
          },
          _sum: { views: true, submissions: true },
        }),
        this.prisma.form_analytics.aggregate({
          where: {
            formId,
            date: { gte: period.prevStart, lte: period.prevEnd },
          },
          _sum: { views: true, submissions: true },
        }),
        this.prisma.form_geographic_analytics.groupBy({
          by: ['countryCode', 'governorateCode'],
          where: {
            formId,
            date: { gte: period.start, lte: period.end },
          },
          _sum: { views: true, submissions: true },
        }),
        this.prisma.form_geographic_analytics.groupBy({
          by: ['countryCode', 'city'],
          where: {
            formId,
            date: { gte: period.start, lte: period.end },
            city: { not: '' },
          },
          _sum: { views: true, submissions: true },
        }),
        this.prisma.form_geographic_analytics.aggregate({
          where: {
            formId,
            date: { gte: period.start, lte: period.end },
            city: '',
          },
          _sum: { views: true, submissions: true },
        }),
        this.prisma.form_analytics.aggregate({
          where: {
            formId,
            date: { gte: period.start, lte: period.end },
          },
          _sum: { shares: true },
        }),
        this.prisma.form_analytics.aggregate({
          where: {
            formId,
            date: { gte: period.prevStart, lte: period.prevEnd },
          },
          _sum: { shares: true },
        }),
      ]);

    const periodViews = dailyAnalytics.reduce((s, r) => s + r.views, 0);
    const prevViews = prevAnalytics._sum.views ?? 0;
    const totalSubmissions = submissions.length;
    const prevSubmissions = await this.prisma.form_submissions.count({
      where: {
        formId,
        completedAt: { gte: period.prevStart, lte: period.prevEnd },
      },
    });

    const completionRate =
      periodViews > 0
        ? Math.round((totalSubmissions / periodViews) * 10000) / 100
        : 0;
    const prevCompletionRate =
      prevViews > 0
        ? Math.round((prevSubmissions / prevViews) * 10000) / 100
        : 0;

    const times = submissions
      .filter((s) => s.timeToComplete != null)
      .map((s) => s.timeToComplete as number);
    const avgTimeToComplete =
      times.length > 0
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        : 0;

    const inputFields = form.fields.filter(
      (f) => !DECORATIVE_FIELD_TYPES.has(f.type),
    );

    const avgFieldCompletionRate = this.calculateAvgFieldCompletionRate(
      inputFields,
      submissions,
    );
    const requiredFieldCount = inputFields.filter((f) => f.required).length;

    const fieldAnalytics = this.calculateFieldAnalytics(
      inputFields,
      submissions,
    );
    const dropOffRate = this.calculateDropOffRate(inputFields, submissions);
    const nps = this.calculateNps(inputFields, submissions);

    const deviceTotal = deviceRows.reduce(
      (acc, r) => acc + (r._sum.submissions ?? 0),
      0,
    );

    const periodShares = shareAgg._sum.shares ?? 0;
    const prevShares = prevShareAgg._sum.shares ?? 0;

    const payload = {
      form: {
        id: form.id,
        title: form.title,
        slug: form.slug,
        status: form.status,
      },
      period: {
        days: period.days,
        startDate: period.start.toISOString().slice(0, 10),
        endDate: period.end.toISOString().slice(0, 10),
      },
      intro: {
        fieldCount: inputFields.length,
        requiredFieldCount,
        avgFieldCompletionRate,
        formStatus: form.status,
      },
      visits: {
        totalShares: periodShares,
        sharesTrend: this.calcTrend(periodShares, prevShares),
      },
      summary: {
        totalViews: periodViews,
        totalSubmissions,
        completionRate,
        avgTimeToComplete,
        firstSubmission: submissions[0]?.completedAt ?? null,
        lastSubmission:
          submissions[submissions.length - 1]?.completedAt ?? null,
        viewsTrend: this.calcTrend(periodViews, prevViews),
        submissionsTrend: this.calcTrend(totalSubmissions, prevSubmissions),
        completionRateTrend: this.calcTrend(
          completionRate,
          prevCompletionRate,
        ),
      },
      dailyTrend: this.buildDailyTrendFromAnalytics(dailyAnalytics, period),
      submissionsByDay: this.buildDailyTrendFromAnalytics(
        dailyAnalytics,
        period,
      ).map((d) => ({ date: d.date, count: d.submissions })),
      fieldAnalytics,
      dropOffRate,
      nps,
      deviceBreakdown: deviceRows.map((row) => {
        const count = row._sum.submissions ?? 0;
        return {
          deviceType: row.deviceType,
          views: row._sum.views ?? 0,
          submissions: count,
          percentage:
            deviceTotal > 0 ? Math.round((count / deviceTotal) * 100) : 0,
        };
      }),
      geoBreakdown: this.buildGeoBreakdown(geoRows, cityRows, unknownCityAgg),
    };

    const hasAdvanced = await this.userHasAdvancedAnalytics(userId);
    return hasAdvanced ? payload : stripAdvancedFormAnalytics(payload);
  }

  async recordShare(userId: string, formId: string): Promise<{ ok: true }> {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      select: { id: true, userId: true },
    });

    if (!form) throw new NotFoundException('Form not found');
    await this.formTeamAccess.assertFormPermission(form, userId, 'view_analytics');

    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);

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

    return { ok: true };
  }

  private resolvePeriod(days: number): PeriodBounds {
    const safeDays = Math.min(Math.max(days, 1), 365);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (safeDays - 1));
    start.setUTCHours(0, 0, 0, 0);
    const prevEnd = new Date(start);
    prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
    prevEnd.setUTCHours(23, 59, 59, 999);
    const prevStart = new Date(prevEnd);
    prevStart.setUTCDate(prevStart.getUTCDate() - (safeDays - 1));
    prevStart.setUTCHours(0, 0, 0, 0);
    return {
      start,
      end,
      prevStart,
      prevEnd,
      days: safeDays,
    };
  }

  private emptyOverview(period: PeriodBounds) {
    return {
      period: {
        days: period.days,
        startDate: period.start.toISOString().slice(0, 10),
        endDate: period.end.toISOString().slice(0, 10),
      },
      summary: {
        views: 0,
        submissions: 0,
        completionRate: 0,
        avgTimeToComplete: 0,
        viewsTrend: 0,
        submissionsTrend: 0,
        completionRateTrend: 0,
      },
      dailyTrend: this.buildDailyTrend([], period),
      topForms: [],
      needsAttention: [],
      deviceBreakdown: [],
      geoBreakdown: this.buildGeoBreakdown([]),
      forms: [],
    };
  }

  private buildGeoBreakdown(
    rows: {
      countryCode: string;
      governorateCode: string;
      _sum: { views: number | null; submissions: number | null };
    }[],
    cityRows: {
      countryCode: string;
      city: string;
      _sum: { views: number | null; submissions: number | null };
    }[] = [],
    unknownCityAgg?: {
      _sum: { views: number | null; submissions: number | null };
    } | null,
  ) {
    const govStats = new Map<
      string,
      { views: number; submissions: number }
    >();
    const countryStats = new Map<
      string,
      { views: number; submissions: number }
    >();

    for (const row of rows) {
      const views = row._sum.views ?? 0;
      const submissions = row._sum.submissions ?? 0;
      const countryCode = row.countryCode || 'XX';

      const country = countryStats.get(countryCode) ?? {
        views: 0,
        submissions: 0,
      };
      country.views += views;
      country.submissions += submissions;
      countryStats.set(countryCode, country);

      if (countryCode === 'IQ' && row.governorateCode) {
        const gov = govStats.get(row.governorateCode) ?? {
          views: 0,
          submissions: 0,
        };
        gov.views += views;
        gov.submissions += submissions;
        govStats.set(row.governorateCode, gov);
      }
    }

    const governorates = IRAQ_GOVERNORATES.map((g) => ({
      code: g.code,
      name: g.nameEn,
      nameAr: g.nameAr,
      views: govStats.get(g.code)?.views ?? 0,
      submissions: govStats.get(g.code)?.submissions ?? 0,
    }));

    const countries = [...countryStats.entries()]
      .map(([code, stats]) => ({
        code,
        name: COUNTRY_LABELS[code]?.name ?? code,
        nameAr: COUNTRY_LABELS[code]?.nameAr,
        views: stats.views,
        submissions: stats.submissions,
      }))
      .sort((a, b) => b.views - a.views);

    const maxViews = Math.max(
      0,
      ...governorates.map((g) => g.views),
      ...countries.map((c) => c.views),
    );
    const maxSubmissions = Math.max(
      0,
      ...governorates.map((g) => g.submissions),
      ...countries.map((c) => c.submissions),
    );

    const cities = cityRows
      .filter((row) => row.city.trim().length > 0)
      .map((row) => ({
        name: row.city,
        countryCode: row.countryCode || 'XX',
        views: row._sum.views ?? 0,
        submissions: row._sum.submissions ?? 0,
      }));

    const unknownViews = unknownCityAgg?._sum.views ?? 0;
    const unknownSubmissions = unknownCityAgg?._sum.submissions ?? 0;
    if (unknownViews > 0 || unknownSubmissions > 0) {
      cities.push({
        name: UNKNOWN_CITY_LABEL,
        countryCode: 'XX',
        views: unknownViews,
        submissions: unknownSubmissions,
      });
    }

    cities.sort((a, b) => b.views - a.views);

    return {
      governorates,
      countries,
      cities,
      maxViews,
      maxSubmissions,
    };
  }

  private sumAgg(
    rows: { _sum: { views: number | null; submissions: number | null } }[],
    key: 'views' | 'submissions',
  ): number {
    return rows.reduce((acc, row) => acc + (row._sum[key] ?? 0), 0);
  }

  private calcTrend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  private buildDailyTrend(
    rows: {
      date: Date;
      _sum: { views: number | null; submissions: number | null };
    }[],
    period: PeriodBounds,
  ) {
    const map = new Map<string, { views: number; submissions: number }>();
    for (const row of rows) {
      const key = row.date.toISOString().slice(0, 10);
      map.set(key, {
        views: row._sum.views ?? 0,
        submissions: row._sum.submissions ?? 0,
      });
    }
    return this.fillDateRange(period, map);
  }

  private buildDailyTrendFromAnalytics(
    rows: { date: Date; views: number; submissions: number }[],
    period: PeriodBounds,
  ) {
    const map = new Map<string, { views: number; submissions: number }>();
    for (const row of rows) {
      const key = row.date.toISOString().slice(0, 10);
      map.set(key, { views: row.views, submissions: row.submissions });
    }
    return this.fillDateRange(period, map);
  }

  private fillDateRange(
    period: PeriodBounds,
    map: Map<string, { views: number; submissions: number }>,
  ) {
    const out: { date: string; views: number; submissions: number }[] = [];
    const cursor = new Date(period.start);
    while (cursor <= period.end) {
      const key = cursor.toISOString().slice(0, 10);
      const entry = map.get(key) ?? { views: 0, submissions: 0 };
      out.push({ date: key, ...entry });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return out;
  }

  private getFieldValue(data: Record<string, unknown>, field: {
    id: string;
    label: string;
  }) {
    if (Object.prototype.hasOwnProperty.call(data, field.id)) {
      return data[field.id];
    }
    if (Object.prototype.hasOwnProperty.call(data, field.label)) {
      return data[field.label];
    }
    return undefined;
  }

  private isAnswered(value: unknown): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value as object).length > 0;
    return true;
  }

  private calculateAvgFieldCompletionRate(
    fields: { id: string; label: string }[],
    submissions: { data: unknown }[],
  ): number {
    if (fields.length === 0 || submissions.length === 0) return 0;

    let totalRate = 0;
    for (const sub of submissions) {
      const data = sub.data as Record<string, unknown>;
      const answered = fields.filter((field) =>
        this.isAnswered(this.getFieldValue(data, field)),
      ).length;
      totalRate += (answered / fields.length) * 100;
    }

    return Math.round(totalRate / submissions.length);
  }

  private calculateFieldAnalytics(fields: any[], submissions: any[]) {
    return fields.map((field) => {
      const responses = submissions.filter((s) => {
        const data = s.data as Record<string, unknown>;
        return this.isAnswered(this.getFieldValue(data, field));
      });

      const distribution: Record<string, number> = {};
      for (const sub of responses) {
        const data = sub.data as Record<string, unknown>;
        const value = this.getFieldValue(data, field);
        let key: string;
        if (INPUT_CHOICE_TYPES.has(field.type)) {
          key = Array.isArray(value)
            ? value.map(String).join('، ')
            : value === true
              ? 'نعم'
              : value === false
                ? 'لا'
                : String(value);
        } else if (field.type === 'SIGNATURE') {
          key = 'توقيع';
        } else if (field.type === 'FILE') {
          key =
            value && typeof value === 'object' && 'name' in (value as object)
              ? String((value as { name?: string }).name ?? 'ملف')
              : 'ملف';
        } else {
          key = Array.isArray(value)
            ? value.map(String).join('، ')
            : String(value);
        }
        distribution[key] = (distribution[key] ?? 0) + 1;
      }

      const topValues = Object.entries(distribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));

      return {
        fieldId: field.id,
        fieldLabel: field.label,
        fieldType: field.type,
        totalResponses: responses.length,
        skipped: submissions.length - responses.length,
        responseRate:
          submissions.length > 0
            ? Math.round((responses.length / submissions.length) * 100)
            : 0,
        topValues,
      };
    });
  }

  private calculateDropOffRate(fields: any[], submissions: any[]) {
    if (submissions.length === 0) return [];

    return fields.map((field, index) => {
      const answered = submissions.filter((s) => {
        const data = s.data as Record<string, unknown>;
        return this.isAnswered(this.getFieldValue(data, field));
      }).length;

      const skipped = submissions.length - answered;
      return {
        fieldId: field.id,
        fieldLabel: field.label,
        fieldOrder: index + 1,
        answered,
        skipped,
        responseRate:
          submissions.length > 0
            ? Math.round((answered / submissions.length) * 100)
            : 0,
      };
    });
  }

  private calculateNps(fields: any[], submissions: any[]) {
    const npsFields = fields.filter(
      (f) =>
        f.type === 'NPS' ||
        (f.type === 'SCALE' &&
          (f.minValue ?? 0) === 0 &&
          (f.maxValue ?? 10) === 10),
    );

    if (npsFields.length === 0 || submissions.length === 0) return null;

    const field = npsFields[0];
    const scores: number[] = [];

    for (const sub of submissions) {
      const data = sub.data as Record<string, unknown>;
      const raw = this.getFieldValue(data, field);
      const score = Number(raw);
      if (!Number.isNaN(score) && score >= 0 && score <= 10) {
        scores.push(score);
      }
    }

    if (scores.length === 0) return null;

    const promoters = scores.filter((s) => s >= 9).length;
    const detractors = scores.filter((s) => s <= 6).length;
    const npsScore = Math.round(
      ((promoters - detractors) / scores.length) * 100,
    );

    return {
      fieldId: field.id,
      fieldLabel: field.label,
      responses: scores.length,
      score: npsScore,
      promoters,
      passives: scores.filter((s) => s === 7 || s === 8).length,
      detractors,
      distribution: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({
        value: n,
        count: scores.filter((s) => s === n).length,
      })),
    };
  }
}
