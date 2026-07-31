import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { ACTIVE_FORM_FILTER } from '../../forms/utils/forms-deletion.util';

type FormVisibility = 'active' | 'deleted' | 'all';

@Injectable()
export class AdminFormsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const activeWhere = ACTIVE_FORM_FILTER;
    const deletedWhere = { deletedAt: { not: null } };

    const [total, published, draft, deleted, totalSubmissions] =
      await Promise.all([
        this.prisma.form.count({ where: activeWhere }),
        this.prisma.form.count({
          where: { ...activeWhere, status: 'PUBLISHED' },
        }),
        this.prisma.form.count({ where: { ...activeWhere, status: 'DRAFT' } }),
        this.prisma.form.count({ where: deletedWhere }),
        this.prisma.form_submissions.count({
          where: { form: activeWhere },
        }),
      ]);

    return {
      total,
      published,
      draft,
      deleted,
      totalSubmissions,
    };
  }

  async listForms(options: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    visibility?: FormVisibility;
  }) {
    const { page, limit, search, status, visibility = 'active' } = options;
    const skip = (page - 1) * limit;
    const where = this.buildListWhere({ search, status, visibility });

    const [data, total] = await Promise.all([
      this.prisma.form.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.listFormSelect(),
      }),
      this.prisma.form.count({ where }),
    ]);

    return {
      data: data.map((form) => this.mapFormListItem(form)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async exportForms(filters: {
    search?: string;
    status?: string;
    visibility?: FormVisibility;
  }) {
    const where = this.buildListWhere(filters);
    const forms = await this.prisma.form.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10_000,
      select: {
        ...this.listFormSelect(),
        updatedAt: true,
        deletedAt: true,
        purgeScheduledAt: true,
      },
    });

    return {
      data: forms.map((form) => ({
        id: form.id,
        title: form.title,
        slug: form.slug,
        status: form.status,
        type: form.type,
        viewCount: form.viewCount,
        submissionCount: form.submissionCount,
        ownerEmail: form.user.email,
        ownerName: form.user.profile?.name ?? '',
        ownerUsername: form.user.profile?.username ?? '',
        createdAt: form.createdAt.toISOString(),
        updatedAt: form.updatedAt.toISOString(),
        deletedAt: form.deletedAt?.toISOString() ?? '',
        purgeScheduledAt: form.purgeScheduledAt?.toISOString() ?? '',
      })),
      total: forms.length,
    };
  }

  async getAnalytics(options: {
    days?: number;
    staleDays?: number;
    limit?: number;
  }) {
    const periodDays = Math.min(Math.max(options.days ?? 7, 1), 90);
    const staleDays = Math.min(Math.max(options.staleDays ?? 30, 1), 365);
    const limit = Math.min(Math.max(options.limit ?? 10, 1), 25);

    const since = new Date();
    since.setUTCHours(0, 0, 0, 0);
    since.setUTCDate(since.getUTCDate() - (periodDays - 1));

    const analyticsWhere = {
      date: { gte: since },
      forms: ACTIVE_FORM_FILTER,
    };

    const [totals, grouped, dailyGrouped, staleForms] = await Promise.all([
      this.prisma.form_analytics.aggregate({
        where: analyticsWhere,
        _sum: { views: true, submissions: true },
      }),
      this.prisma.form_analytics.groupBy({
        by: ['formId'],
        where: analyticsWhere,
        _sum: { views: true, submissions: true },
      }),
      this.prisma.form_analytics.groupBy({
        by: ['date'],
        where: analyticsWhere,
        _sum: { views: true, submissions: true },
        orderBy: { date: 'asc' },
      }),
      this.prisma.form.findMany({
        where: {
          ...ACTIVE_FORM_FILTER,
          status: 'PUBLISHED',
          submissionCount: 0,
          createdAt: {
            lte: new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          viewCount: true,
          createdAt: true,
          user: {
            select: {
              email: true,
              profile: { select: { name: true, username: true } },
            },
          },
        },
      }),
    ]);

    const platformViews = totals._sum.views ?? 0;
    const platformSubmissions = totals._sum.submissions ?? 0;
    const platformCompletionRate =
      platformViews > 0
        ? Math.round((platformSubmissions / platformViews) * 1000) / 10
        : null;

    const formIds = grouped.map((row) => row.formId);
    const formsMeta =
      formIds.length > 0
        ? await this.prisma.form.findMany({
            where: { id: { in: formIds } },
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              user: {
                select: {
                  email: true,
                  profile: { select: { name: true, username: true } },
                },
              },
            },
          })
        : [];
    const metaById = new Map(formsMeta.map((f) => [f.id, f]));

    const ranked = grouped
      .map((row) => {
        const views = row._sum.views ?? 0;
        const submissions = row._sum.submissions ?? 0;
        const meta = metaById.get(row.formId);
        return {
          formId: row.formId,
          title: meta?.title ?? 'Unknown form',
          slug: meta?.slug ?? '',
          status: meta?.status ?? 'DRAFT',
          ownerEmail: meta?.user.email ?? '',
          ownerName: meta?.user.profile?.name ?? null,
          ownerUsername: meta?.user.profile?.username ?? null,
          views,
          submissions,
          completionRate:
            views > 0 ? Math.round((submissions / views) * 1000) / 10 : null,
        };
      })
      .filter((row) => row.views > 0 || row.submissions > 0);

    const topByViews = [...ranked]
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
    const topBySubmissions = [...ranked]
      .sort((a, b) => b.submissions - a.submissions)
      .slice(0, limit);

    return {
      periodDays,
      staleDays,
      platform: {
        views: platformViews,
        submissions: platformSubmissions,
        completionRate: platformCompletionRate,
      },
      dailyTrend: dailyGrouped.map((row) => ({
        date: row.date.toISOString().slice(0, 10),
        views: row._sum.views ?? 0,
        submissions: row._sum.submissions ?? 0,
      })),
      topByViews,
      topBySubmissions,
      stalePublishedNoSubmissions: staleForms.map((form) => ({
        id: form.id,
        title: form.title,
        slug: form.slug,
        viewCount: form.viewCount,
        createdAt: form.createdAt.toISOString(),
        daysPublished: Math.floor(
          (Date.now() - form.createdAt.getTime()) / (24 * 60 * 60 * 1000),
        ),
        ownerEmail: form.user.email,
        ownerName: form.user.profile?.name ?? null,
        ownerUsername: form.user.profile?.username ?? null,
      })),
    };
  }

  async getWebhookHealth(formId: string) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      select: {
        id: true,
        title: true,
        webhookEnabled: true,
        webhookUrl: true,
        webhookEvents: true,
      },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentDeliveries, weekDeliveries] = await Promise.all([
      this.prisma.form_webhook_delivery.findMany({
        where: { formId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          eventId: true,
          status: true,
          attempt: true,
          responseCode: true,
          latencyMs: true,
          errorMessage: true,
          webhookUrl: true,
          createdAt: true,
        },
      }),
      this.prisma.form_webhook_delivery.findMany({
        where: { formId, createdAt: { gte: since7d } },
        select: { status: true, latencyMs: true },
      }),
    ]);

    let successCount = 0;
    let failedCount = 0;
    let latencySum = 0;
    let latencyCount = 0;

    for (const d of weekDeliveries) {
      if (d.status === 'success') {
        successCount += 1;
        if (d.latencyMs != null) {
          latencySum += d.latencyMs;
          latencyCount += 1;
        }
      } else if (d.status === 'failed') {
        failedCount += 1;
      }
    }

    const resolvedTotal = successCount + failedCount;

    return {
      formId: form.id,
      formTitle: form.title,
      enabled: form.webhookEnabled,
      webhookUrl: form.webhookUrl,
      webhookEvents: form.webhookEvents,
      periodDays: 7,
      stats: {
        totalAttempts: weekDeliveries.length,
        successCount,
        failedCount,
        failureRate:
          resolvedTotal > 0
            ? Math.round((failedCount / resolvedTotal) * 1000) / 10
            : null,
        successRate:
          resolvedTotal > 0
            ? Math.round((successCount / resolvedTotal) * 1000) / 10
            : null,
        avgLatencyMs:
          latencyCount > 0 ? Math.round(latencySum / latencyCount) : null,
      },
      recentDeliveries: recentDeliveries.map((d) => ({
        id: d.id,
        eventId: d.eventId,
        status: d.status,
        attempt: d.attempt,
        responseCode: d.responseCode,
        latencyMs: d.latencyMs,
        errorMessage: d.errorMessage,
        webhookUrl: d.webhookUrl,
        createdAt: d.createdAt.toISOString(),
      })),
    };
  }

  async listDeletionLogs(options: {
    page: number;
    limit: number;
    formId?: string;
    ownerId?: string;
  }) {
    const { page, limit, formId, ownerId } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (formId) where.formId = formId;
    if (ownerId) where.ownerId = ownerId;

    const [data, total] = await Promise.all([
      this.prisma.formDeletionLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.formDeletionLog.count({ where }),
    ]);

    return {
      data: data.map((log) => this.mapDeletionLog(log)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFormById(id: string) {
    const form = await this.prisma.form.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        type: true,
        status: true,
        coverImage: true,
        viewCount: true,
        submissionCount: true,
        allowMultipleSubmissions: true,
        requiresAuthentication: true,
        oneResponsePerUser: true,
        showProgressBar: true,
        showQuestionNumbers: true,
        shuffleQuestions: true,
        maxSubmissions: true,
        submissionLimit: true,
        opensAt: true,
        closesAt: true,
        closeAfterDate: true,
        notifyOnSubmission: true,
        notificationEmail: true,
        autoResponseEnabled: true,
        isMultiStep: true,
        requireTurnstileOnSubmit: true,
        webhookEnabled: true,
        webhookUrl: true,
        webhookEvents: true,
        linkedEventId: true,
        linkedStoreId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        deletedById: true,
        purgeScheduledAt: true,
        deletionReason: true,
        deletedBy: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, username: true } },
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            verificationLevel: true,
            isRuknyVerified: true,
            profile: { select: { name: true, username: true, avatar: true } },
          },
        },
        fields: {
          select: {
            id: true,
            label: true,
            type: true,
            order: true,
            required: true,
            description: true,
          },
          orderBy: { order: 'asc' },
        },
        steps: {
          select: { id: true, title: true, order: true },
          orderBy: { order: 'asc' },
        },
        integrations: {
          select: {
            id: true,
            type: true,
            name: true,
            isActive: true,
            isAutoSync: true,
            lastSyncAt: true,
            syncedCount: true,
          },
        },
        events: { select: { id: true, title: true, slug: true } },
        stores: { select: { id: true, name: true, slug: true } },
        _count: {
          select: {
            fields: true,
            submissions: true,
            integrations: true,
            steps: true,
          },
        },
      },
    });

    if (!form) {
      throw new NotFoundException('Form not found');
    }

    const deletionLogs = await this.prisma.formDeletionLog.findMany({
      where: { formId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      id: form.id,
      title: form.title,
      slug: form.slug,
      description: form.description,
      type: form.type,
      status: form.status,
      coverImage: form.coverImage,
      viewCount: form.viewCount,
      submissionCount: form.submissionCount,
      allowMultipleSubmissions: form.allowMultipleSubmissions,
      requiresAuthentication: form.requiresAuthentication,
      oneResponsePerUser: form.oneResponsePerUser,
      showProgressBar: form.showProgressBar,
      showQuestionNumbers: form.showQuestionNumbers,
      shuffleQuestions: form.shuffleQuestions,
      maxSubmissions: form.maxSubmissions,
      submissionLimit: form.submissionLimit,
      opensAt: form.opensAt?.toISOString() ?? null,
      closesAt: form.closesAt?.toISOString() ?? null,
      closeAfterDate: form.closeAfterDate,
      notifyOnSubmission: form.notifyOnSubmission,
      notificationEmail: form.notificationEmail,
      autoResponseEnabled: form.autoResponseEnabled,
      isMultiStep: form.isMultiStep,
      requireTurnstileOnSubmit: form.requireTurnstileOnSubmit,
      webhookEnabled: form.webhookEnabled,
      webhookUrl: form.webhookUrl,
      webhookEvents: form.webhookEvents,
      linkedEvent: form.events
        ? { id: form.events.id, title: form.events.title, slug: form.events.slug }
        : null,
      linkedStore: form.stores
        ? { id: form.stores.id, name: form.stores.name, slug: form.stores.slug }
        : null,
      createdAt: form.createdAt.toISOString(),
      updatedAt: form.updatedAt.toISOString(),
      deletedAt: form.deletedAt?.toISOString() ?? null,
      purgeScheduledAt: form.purgeScheduledAt?.toISOString() ?? null,
      deletionReason: form.deletionReason,
      deletedBy: form.deletedBy
        ? {
            id: form.deletedBy.id,
            email: form.deletedBy.email,
            name: form.deletedBy.profile?.name ?? null,
            username: form.deletedBy.profile?.username ?? null,
          }
        : null,
      owner: {
        id: form.user.id,
        email: form.user.email,
        name: form.user.profile?.name ?? null,
        username: form.user.profile?.username ?? null,
        avatar: form.user.profile?.avatar ?? null,
        verificationLevel: form.user.verificationLevel,
        isRuknyVerified: form.user.isRuknyVerified,
      },
      fields: form.fields,
      steps: form.steps.map((step) => ({
        ...step,
      })),
      integrations: form.integrations.map((integration) => ({
        id: integration.id,
        type: integration.type,
        name: integration.name,
        isActive: integration.isActive,
        isAutoSync: integration.isAutoSync,
        lastSyncAt: integration.lastSyncAt?.toISOString() ?? null,
        syncedCount: integration.syncedCount,
      })),
      counts: {
        fields: form._count.fields,
        submissions: form._count.submissions,
        integrations: form._count.integrations,
        steps: form._count.steps,
      },
      deletionLogs: deletionLogs.map((log) => this.mapDeletionLog(log)),
    };
  }

  private buildListWhere(options: {
    search?: string;
    status?: string;
    visibility?: FormVisibility;
  }) {
    const { search, status, visibility = 'active' } = options;
    const where: Record<string, unknown> = {};
    if (visibility === 'active') {
      Object.assign(where, ACTIVE_FORM_FILTER);
    } else if (visibility === 'deleted') {
      where.deletedAt = { not: null };
    }
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private listFormSelect() {
    return {
      id: true,
      title: true,
      slug: true,
      status: true,
      type: true,
      viewCount: true,
      submissionCount: true,
      createdAt: true,
      deletedAt: true,
      purgeScheduledAt: true,
      deletionReason: true,
      user: {
        select: {
          id: true,
          email: true,
          verificationLevel: true,
          isRuknyVerified: true,
          profile: { select: { name: true, username: true, avatar: true } },
        },
      },
    } as const;
  }

  private mapFormListItem(form: {
    id: string;
    title: string;
    slug: string;
    status: string;
    type: string;
    viewCount: number;
    submissionCount: number;
    createdAt: Date;
    deletedAt: Date | null;
    purgeScheduledAt: Date | null;
    deletionReason: string | null;
    user: {
      id: string;
      email: string;
      verificationLevel: number;
      isRuknyVerified: boolean;
      profile: { name: string | null; username: string | null; avatar: string | null } | null;
    };
  }) {
    return {
      id: form.id,
      title: form.title,
      slug: form.slug,
      status: form.status,
      type: form.type,
      viewCount: form.viewCount,
      submissionCount: form.submissionCount,
      createdAt: form.createdAt.toISOString(),
      deletedAt: form.deletedAt?.toISOString() ?? null,
      purgeScheduledAt: form.purgeScheduledAt?.toISOString() ?? null,
      deletionReason: form.deletionReason,
      owner: {
        id: form.user.id,
        email: form.user.email,
        name: form.user.profile?.name ?? null,
        username: form.user.profile?.username ?? null,
        avatar: form.user.profile?.avatar ?? null,
        verificationLevel: form.user.verificationLevel,
        isRuknyVerified: form.user.isRuknyVerified,
      },
    };
  }

  private mapDeletionLog(log: {
    id: string;
    formId: string;
    formTitle: string;
    formSlug: string;
    ownerId: string;
    deletedById: string;
    submissionCount: number;
    fieldCount: number;
    statusAtDelete: string;
    typeAtDelete: string;
    reason: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    purgeScheduledAt: Date;
    restoredAt: Date | null;
    purgedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: log.id,
      formId: log.formId,
      formTitle: log.formTitle,
      formSlug: log.formSlug,
      ownerId: log.ownerId,
      deletedById: log.deletedById,
      submissionCount: log.submissionCount,
      fieldCount: log.fieldCount,
      statusAtDelete: log.statusAtDelete,
      typeAtDelete: log.typeAtDelete,
      reason: log.reason,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      purgeScheduledAt: log.purgeScheduledAt.toISOString(),
      restoredAt: log.restoredAt?.toISOString() ?? null,
      purgedAt: log.purgedAt?.toISOString() ?? null,
      createdAt: log.createdAt.toISOString(),
    };
  }
}
