import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { FormsCacheService } from './forms-cache.service';
import { S3Service } from '../../../services/s3.service';
import {
  FormAnalyticsTrackerService,
  type AnalyticsTrackContext,
} from './form-analytics-tracker.service';
import { FormTeamAccessService } from '../form-team/form-team-access.service';
import { FormTeamRole, InvitationStatus } from '@prisma/client';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import {
  ACTIVE_FORM_FILTER,
  isActiveForm,
} from '../utils/forms-deletion.util';

/** Transformed form payload stored in cache before branding metadata is applied. */
type PublicFormData = {
  id: string;
  userId?: string | null;
  webhookSecret?: string | null;
  deletedAt?: Date | string | null;
} & Record<string, any>;

type PublicFormWithBranding = Omit<PublicFormData, 'webhookSecret'> & {
  showBranding: boolean;
};

/**
 * 🔍 Forms Queries Service
 * Handles: findAll, findById, findBySlug, findPublicByUsername
 *
 * ~280 lines - follows golden rule of ≤300 lines per service
 */
@Injectable()
export class FormsQueriesService {
  private readonly bucket = process.env.S3_BUCKET || 'rukny-storage';

  // Cache TTLs in seconds
  private readonly CACHE_TTL = {
    FORM_BY_SLUG: 300, // 5 min - public form structure
    PUBLIC_FORMS: 120, // 2 min - user's public forms list
  };

  constructor(
    private prisma: PrismaService,
    private formsCache: FormsCacheService,
    private s3Service: S3Service,
    private analyticsTracker: FormAnalyticsTrackerService,
    private formTeamAccess: FormTeamAccessService,
    private subscriptions: SubscriptionsService,
  ) {}

  /**
   * Find all forms with filters and pagination
   */
  async findAll(filters?: {
    userId?: string;
    type?: string;
    status?: string;
    linkedEventId?: string;
    linkedStoreId?: string;
    page?: number;
    limit?: number;
    visibility?: 'active' | 'deleted' | 'all';
  }) {
    const {
      userId,
      type,
      status,
      linkedEventId,
      linkedStoreId,
      page = 1,
      limit = 20,
      visibility = 'active',
    } = filters || {};
    const skip = (page - 1) * limit;

    const where: any = {};
    if (visibility === 'active') {
      Object.assign(where, ACTIVE_FORM_FILTER);
    } else if (visibility === 'deleted') {
      where.deletedAt = { not: null };
    }
    if (userId) {
      const ownerIds = await this.formTeamAccess.listAccessibleOwnerIds(userId);
      where.userId = ownerIds.length === 1 ? userId : { in: ownerIds };
    }
    if (type) where.type = type;
    if (status) where.status = status;
    if (linkedEventId) where.linkedEventId = linkedEventId;
    if (linkedStoreId) where.linkedStoreId = linkedStoreId;

    const [forms, total] = await Promise.all([
      this.prisma.form.findMany({
        where,
        include: {
          _count: { select: { fields: true, submissions: true } },
          events: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.form.count({ where }),
    ]);

    const sharedWorkspacesByOwnerId = userId
      ? await this.loadSharedWorkspaceMeta(userId)
      : new Map<
          string,
          { id: string; name: string; role: FormTeamRole; avatar: string | null }
        >();

    // Convert S3 keys to presigned URLs
    const formsWithUrls = await Promise.all(
      forms.map((form) => this.transformFormImages(form)),
    );

    const enriched = formsWithUrls.map((form) =>
      this.applySharingMeta(form, userId, sharedWorkspacesByOwnerId),
    );

    if (userId) {
      enriched.sort((a, b) => {
        const aOwn = a.userId === userId ? 0 : 1;
        const bOwn = b.userId === userId ? 0 : 1;
        if (aOwn !== bOwn) return aOwn - bOwn;
        if (aOwn === 1) {
          const workspaceCmp = (a.sharedWorkspace?.name ?? '').localeCompare(
            b.sharedWorkspace?.name ?? '',
            'ar',
          );
          if (workspaceCmp !== 0) return workspaceCmp;
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    }

    return {
      forms: enriched.map(({ webhookSecret: _webhookSecret, ...form }) => form),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  private async loadSharedWorkspaceMeta(userId: string) {
    const memberships = await this.prisma.formTeamMember.findMany({
      where: { userId, status: InvitationStatus.ACCEPTED },
      include: {
        workspace: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, username: true, avatar: true } },
          },
        },
      },
    });

    const entries = await Promise.all(
      memberships.map(async (membership) => {
        const name =
          membership.workspace.profile?.name?.trim() ||
          membership.workspace.profile?.username?.trim() ||
          membership.workspace.email;
        const avatar = membership.workspace.profile?.avatar
          ? await this.getPresignedUrl(membership.workspace.profile.avatar)
          : null;

        return [
          membership.workspaceId,
          {
            id: membership.workspaceId,
            name,
            role: membership.role,
            avatar,
          },
        ] as const;
      }),
    );

    return new Map(entries);
  }

  /**
   * Find public forms by username (with caching)
   */
  async findPublicByUsername(username: string, limit = 10) {
    const cacheKey = this.formsCache.publicFormsKey(username, limit);
    const cached = await this.formsCache.get<{ forms: unknown[]; featured: unknown }>(
      cacheKey,
    );
    if (cached) return cached;

    const profile = await this.prisma.profile.findUnique({
      where: { username },
      select: { userId: true },
    });

    if (!profile) return { forms: [], featured: null };

    const forms = await this.prisma.form.findMany({
      where: {
        userId: profile.userId,
        status: 'PUBLISHED',
        ...ACTIVE_FORM_FILTER,
      },
      select: {
        id: true,
        title: true,
        description: true,
        slug: true,
        type: true,
        coverImage: true,
        theme: true,
        createdAt: true,
        closesAt: true,
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const featured = forms.find((f: any) => f.coverImage) || forms[0] || null;

    const transformedForms = await Promise.all(
      forms.map(async (f: any) => ({
        ...f,
        coverImage: await this.getPresignedUrl(f.coverImage),
        expiresAt: f.closesAt,
      })),
    );

    const result = {
      forms: transformedForms,
      featured: featured
        ? {
            ...featured,
            coverImage: await this.getPresignedUrl(featured.coverImage),
            expiresAt: featured.closesAt,
          }
        : null,
    };

    await this.formsCache.set(cacheKey, result, this.CACHE_TTL.PUBLIC_FORMS);
    return result;
  }

  /**
   * Find form by ID
   */
  async findById(formId: string, userId?: string) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: this.getDetailInclude(),
    });

    if (!form) throw new NotFoundException('Form not found');
    if (!userId && !isActiveForm(form)) {
      throw new NotFoundException('Form not found');
    }
    if (userId) {
      await this.formTeamAccess.assertFormReadAccess(
        form,
        userId,
        'Not authorized to access this form',
      );
    }

    const transformed = await this.transformFormWithUser(form);
    const enriched = userId
      ? this.applySharingMeta(
          transformed,
          userId,
          await this.loadSharedWorkspaceMeta(userId),
        )
      : { ...transformed, isShared: false, sharedWorkspace: null };

    return this.sanitizePublicForm(enriched);
  }

  /**
   * Find form by slug (with caching for public access)
   */
  async findBySlug(
    slug: string,
    trackContext?: AnalyticsTrackContext,
    options?: { skipViewTrack?: boolean },
  ): Promise<PublicFormWithBranding> {
    const cacheKey = this.formsCache.formBySlugKey(slug);
    const cached = await this.formsCache.get<PublicFormData>(cacheKey);
    if (cached) {
      if (!isActiveForm(cached)) {
        throw new NotFoundException('Form not found');
      }
      if (!options?.skipViewTrack) {
        this.incrementViewCount(cached.id, trackContext).catch(() => {});
      }
      return this.attachPublicBrandingMeta(cached);
    }

    const form = await this.prisma.form.findUnique({
      where: { slug },
      include: this.getDetailInclude(),
    });

    if (!form) throw new NotFoundException('Form not found');
    if (!isActiveForm(form) || form.status !== 'PUBLISHED') {
      throw new NotFoundException('Form not found');
    }

    if (!options?.skipViewTrack) {
      this.incrementViewCount(form.id, trackContext).catch(() => {});
    }

    const transformed = await this.transformFormWithUser(form);

    // Cache only published forms
    if (form.status === 'PUBLISHED') {
      await this.formsCache.set(
        cacheKey,
        transformed,
        this.CACHE_TTL.FORM_BY_SLUG,
      );
    }

    return this.attachPublicBrandingMeta(transformed);
  }

  private async attachPublicBrandingMeta(
    form: PublicFormData,
  ): Promise<PublicFormWithBranding> {
    const sanitized = this.sanitizePublicForm(form);
    if (!form.userId) {
      return { ...sanitized, showBranding: true };
    }
    const limits = await this.subscriptions.getUserLimits(form.userId);
    return {
      ...sanitized,
      showBranding: !limits.removeWatermark,
    };
  }

  async trackPublicView(slug: string, trackContext?: AnalyticsTrackContext) {
    const form = await this.prisma.form.findUnique({
      where: { slug },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!form || !isActiveForm(form) || form.status !== 'PUBLISHED') {
      throw new NotFoundException('Form not found');
    }

    await this.incrementViewCount(form.id, trackContext);
    return { ok: true as const };
  }

  /**
   * Get form steps
   */
  async getWebhookDeliveries(userId: string, formId: string, limit?: number) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      select: { id: true, userId: true },
    });
    if (!form) throw new NotFoundException('Form not found');
    await this.formTeamAccess.assertFormPermission(
      form,
      userId,
      'manage_webhooks',
    );
    return this.prisma.form_webhook_delivery.findMany({
      where: { formId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit ?? 50, 1), 100),
      select: {
        id: true,
        eventId: true,
        status: true,
        attempt: true,
        responseCode: true,
        latencyMs: true,
        errorMessage: true,
        createdAt: true,
        webhookUrl: true,
      },
    });
  }

  async getFormSteps(userId: string, formId: string) {
    const form = await this.prisma.form.findUnique({ where: { id: formId } });

    if (!form) throw new NotFoundException('Form not found');
    await this.formTeamAccess.assertFormPermission(form, userId, 'edit_form');

    return this.prisma.form_steps.findMany({
      where: { formId },
      orderBy: { order: 'asc' },
      include: { form_fields: { orderBy: { order: 'asc' } } },
    });
  }

  private applySharingMeta<T extends { userId: string }>(
    form: T,
    viewerUserId: string | undefined,
    workspaceByOwnerId: Map<
      string,
      { id: string; name: string; role: FormTeamRole; avatar: string | null }
    >,
  ) {
    const isShared = Boolean(viewerUserId && form.userId !== viewerUserId);
    const workspaceMeta = isShared
      ? workspaceByOwnerId.get(form.userId)
      : undefined;

    return {
      ...form,
      isShared,
      sharedWorkspace: workspaceMeta
        ? {
            id: workspaceMeta.id,
            name: workspaceMeta.name,
            role: workspaceMeta.role,
            avatar: workspaceMeta.avatar,
          }
        : null,
    };
  }

  // ============ Private Helpers ============

  private async incrementViewCount(
    formId: string,
    trackContext?: AnalyticsTrackContext,
  ) {
    await this.prisma.form
      .update({
        where: { id: formId },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});
    void this.analyticsTracker.recordView(formId, trackContext);
  }

  private async getPresignedUrl(key: string | null): Promise<string | null> {
    if (!key || key.startsWith('http')) return key;
    try {
      return await this.s3Service.getPresignedGetUrl(this.bucket, key, 3600);
    } catch (e) {
      return null;
    }
  }

  private async transformFormImages(form: any) {
    if (!form?.coverImage || form.coverImage.startsWith('http')) return form;
    return { ...form, coverImage: await this.getPresignedUrl(form.coverImage) };
  }

  /** Strip secrets from API responses (owner may re-configure via update). */
  private sanitizePublicForm<T extends Record<string, unknown>>(
    form: T,
  ): Omit<T, 'webhookSecret'> {
    if (!form) return form as Omit<T, 'webhookSecret'>;
    const { webhookSecret: _ws, ...rest } = form;
    return rest as Omit<T, 'webhookSecret'>;
  }

  private async transformFormWithUser(form: any) {
    const coverImage = await this.getPresignedUrl(form.coverImage);

    const bannerImages: string[] = [];
    if (form.bannerImages?.length) {
      for (const img of form.bannerImages) {
        const url = await this.getPresignedUrl(img);
        if (url) bannerImages.push(url);
      }
    }

    let userWithUrls = form.user;
    if (form.user?.profile) {
      const avatar = await this.getPresignedUrl(form.user.profile.avatar);
      const coverImageUser = await this.getPresignedUrl(
        form.user.profile.coverImage,
      );
      userWithUrls = {
        ...form.user,
        profile: { ...form.user.profile, avatar, coverImage: coverImageUser },
      };
    }

    return { ...form, coverImage, bannerImages, user: userWithUrls };
  }

  private getDetailInclude() {
    return {
      fields: { orderBy: { order: 'asc' as const } },
      steps: {
        orderBy: { order: 'asc' as const },
        include: { form_fields: { orderBy: { order: 'asc' as const } } },
      },
      user: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
              username: true,
              avatar: true,
              coverImage: true,
              bio: true,
            },
          },
        },
      },
      events: { select: { id: true, title: true, slug: true } },
      _count: { select: { submissions: true } },
    };
  }
}
