import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';

const ANALYTICS_DAYS = 7;

type FormRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  submissionCount: number;
  updatedAt: Date;
  googleSheets: {
    connected: boolean;
    spreadsheetUrl: string | null;
    isAutoSync: boolean;
    lastSyncAt: Date | null;
    syncedCount: number;
  };
  webhook: {
    enabled: boolean;
    url: string | null;
    events: string[];
    configured: boolean;
  };
  email: {
    enabled: boolean;
    address: string | null;
    configured: boolean;
  };
};

@Injectable()
export class FormsIntegrationsDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string) {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - ANALYTICS_DAYS * 24 * 60 * 60 * 1000);

    const [forms, recentDeliveries, failedDeliveries24h, deliveries7d] =
      await Promise.all([
        this.prisma.form.findMany({
          where: { userId },
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            submissionCount: true,
            updatedAt: true,
            webhookEnabled: true,
            webhookUrl: true,
            webhookEvents: true,
            notifyOnSubmission: true,
            notificationEmail: true,
            integrations: {
              where: { type: 'google_sheets', isActive: true },
              select: {
                spreadsheetId: true,
                spreadsheetUrl: true,
                isAutoSync: true,
                lastSyncAt: true,
                syncedCount: true,
              },
              take: 1,
            },
          },
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.form_webhook_delivery.findMany({
          where: { form: { userId } },
          orderBy: { createdAt: 'desc' },
          take: 30,
          select: {
            id: true,
            formId: true,
            eventId: true,
            status: true,
            responseCode: true,
            latencyMs: true,
            errorMessage: true,
            createdAt: true,
            webhookUrl: true,
            form: { select: { title: true, slug: true } },
          },
        }),
        this.prisma.form_webhook_delivery.count({
          where: {
            form: { userId },
            status: 'failed',
            createdAt: { gte: since24h },
          },
        }),
        this.prisma.form_webhook_delivery.findMany({
          where: {
            form: { userId },
            createdAt: { gte: since7d },
          },
          select: {
            status: true,
            latencyMs: true,
            createdAt: true,
          },
        }),
      ]);

    let sheetsConnected = 0;
    let sheetsAutoSync = 0;
    let webhooksActive = 0;
    let emailNotifications = 0;

    const formRows: FormRow[] = forms.map((form) => {
      const sheets = form.integrations[0] ?? null;
      const sheetsConnectedForForm = Boolean(sheets?.spreadsheetId);

      if (sheetsConnectedForForm) sheetsConnected += 1;
      if (sheets?.isAutoSync) sheetsAutoSync += 1;
      if (form.webhookEnabled && form.webhookUrl) webhooksActive += 1;
      if (form.notifyOnSubmission && form.notificationEmail) {
        emailNotifications += 1;
      }

      return {
        id: form.id,
        title: form.title,
        slug: form.slug,
        status: form.status,
        submissionCount: form.submissionCount,
        updatedAt: form.updatedAt,
        googleSheets: {
          connected: sheetsConnectedForForm,
          spreadsheetUrl: sheets?.spreadsheetUrl ?? null,
          isAutoSync: sheets?.isAutoSync ?? false,
          lastSyncAt: sheets?.lastSyncAt ?? null,
          syncedCount: sheets?.syncedCount ?? 0,
        },
        webhook: {
          enabled: form.webhookEnabled,
          url: form.webhookUrl,
          events: form.webhookEvents,
          configured: Boolean(form.webhookEnabled && form.webhookUrl),
        },
        email: {
          enabled: form.notifyOnSubmission,
          address: form.notificationEmail,
          configured: Boolean(form.notifyOnSubmission && form.notificationEmail),
        },
      };
    });

    const healthAlerts = this.buildHealthAlerts(
      formRows,
      failedDeliveries24h,
      recentDeliveries,
    );
    const webhookAnalytics = this.buildWebhookAnalytics(deliveries7d);

    return {
      summary: {
        totalForms: forms.length,
        sheetsConnected,
        sheetsAutoSync,
        webhooksActive,
        emailNotifications,
        failedDeliveries24h,
      },
      healthAlerts,
      webhookAnalytics,
      forms: formRows.map((f) => ({
        ...f,
        updatedAt: f.updatedAt.toISOString(),
        googleSheets: {
          ...f.googleSheets,
          lastSyncAt: f.googleSheets.lastSyncAt?.toISOString() ?? null,
        },
      })),
      recentDeliveries: recentDeliveries.map((d) => ({
        id: d.id,
        formId: d.formId,
        formTitle: d.form.title,
        formSlug: d.form.slug,
        eventId: d.eventId,
        status: d.status,
        responseCode: d.responseCode,
        latencyMs: d.latencyMs,
        errorMessage: d.errorMessage,
        createdAt: d.createdAt.toISOString(),
        webhookUrl: d.webhookUrl,
        type: 'webhook' as const,
      })),
    };
  }

  private buildHealthAlerts(
    forms: FormRow[],
    failedDeliveries24h: number,
    recentDeliveries: { formId: string; status: string }[],
  ) {
    const alerts: {
      id: string;
      severity: 'warning' | 'error' | 'info';
      title: string;
      description: string;
      formId?: string;
      formSlug?: string;
    }[] = [];

    if (failedDeliveries24h > 0) {
      alerts.push({
        id: 'webhook-failures-24h',
        severity: 'error',
        title: `${failedDeliveries24h} فشل Webhook خلال 24 ساعة`,
        description: 'راجع سجل النشاط وتحقق من صحة الرابط والتوقيع.',
      });
    }

    for (const form of forms) {
      if (form.webhook.enabled && !form.webhook.url) {
        alerts.push({
          id: `webhook-no-url-${form.id}`,
          severity: 'warning',
          title: `Webhook مفعّل بدون رابط — ${form.title}`,
          description: 'أضف رابط Webhook أو عطّل الإرسال.',
          formId: form.id,
          formSlug: form.slug,
        });
      }

      if (form.email.enabled && !form.email.address) {
        alerts.push({
          id: `email-no-address-${form.id}`,
          severity: 'warning',
          title: `بريد مفعّل بدون عنوان — ${form.title}`,
          description: 'حدّد بريد التنبيه أو أوقف الإشعار.',
          formId: form.id,
          formSlug: form.slug,
        });
      }

      if (
        form.status === 'PUBLISHED' &&
        form.submissionCount > 0 &&
        !form.googleSheets.connected &&
        !form.webhook.configured &&
        !form.email.configured
      ) {
        alerts.push({
          id: `no-integration-${form.id}`,
          severity: 'info',
          title: `نموذج منشور بلا تكامل — ${form.title}`,
          description: 'لديك استجابات لكن لا يوجد Sheets أو Webhook أو بريد.',
          formId: form.id,
          formSlug: form.slug,
        });
      }

      if (form.googleSheets.connected && !form.googleSheets.isAutoSync) {
        alerts.push({
          id: `sheets-no-autosync-${form.id}`,
          severity: 'warning',
          title: `المزامنة التلقائية معطّلة — ${form.title}`,
          description: 'الجدول مربوط لكن التصدير يدوي — فعّل المزامنة التلقائية.',
          formId: form.id,
          formSlug: form.slug,
        });
      }

      if (
        form.googleSheets.connected &&
        form.googleSheets.isAutoSync &&
        form.submissionCount === 0
      ) {
        alerts.push({
          id: `sheets-ready-${form.id}`,
          severity: 'info',
          title: `Sheets جاهز — ${form.title}`,
          description: 'الجدول مربوط — ستُزامَن الاستجابات القادمة تلقائياً.',
          formId: form.id,
          formSlug: form.slug,
        });
      }

      const recentFails = recentDeliveries.filter(
        (d) => d.formId === form.id && d.status === 'failed',
      ).length;
      if (form.webhook.configured && recentFails >= 3) {
        alerts.push({
          id: `webhook-repeated-fail-${form.id}`,
          severity: 'error',
          title: `فشل متكرر — ${form.title}`,
          description: 'آخر محاولات Webhook فاشلة. تحقق من الخادم المستقبِل.',
          formId: form.id,
          formSlug: form.slug,
        });
      }
    }

    return alerts.slice(0, 10);
  }

  private buildWebhookAnalytics(
    deliveries: { status: string; latencyMs: number | null; createdAt: Date }[],
  ) {
    const dayKeys: string[] = [];
    const now = new Date();
    for (let i = ANALYTICS_DAYS - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dayKeys.push(d.toISOString().slice(0, 10));
    }

    const byDay = new Map(
      dayKeys.map((date) => [date, { date, success: 0, failed: 0, queued: 0 }]),
    );

    let successCount = 0;
    let failedCount = 0;
    let latencySum = 0;
    let latencyCount = 0;

    for (const d of deliveries) {
      const key = d.createdAt.toISOString().slice(0, 10);
      const bucket = byDay.get(key);
      if (!bucket) continue;

      if (d.status === 'success') {
        bucket.success += 1;
        successCount += 1;
      } else if (d.status === 'failed') {
        bucket.failed += 1;
        failedCount += 1;
      } else {
        bucket.queued += 1;
      }

      if (d.latencyMs != null && d.status === 'success') {
        latencySum += d.latencyMs;
        latencyCount += 1;
      }
    }

    const total = successCount + failedCount;
    const successRate = total > 0 ? Math.round((successCount / total) * 1000) / 10 : 0;
    const avgLatencyMs =
      latencyCount > 0 ? Math.round(latencySum / latencyCount) : 0;

    return {
      periodDays: ANALYTICS_DAYS,
      successRate,
      avgLatencyMs,
      totalDeliveries: deliveries.length,
      successCount,
      failedCount,
      dailyTrend: dayKeys.map((date) => byDay.get(date)!),
    };
  }
}
