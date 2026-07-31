import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import * as crypto from 'node:crypto';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { FormsCacheService } from './forms-cache.service';
import { S3Service } from '../../../services/s3.service';
import { CreateFormDto, UpdateFormDto, FormStatus } from '../dto';
import { SecureIds } from '../../../core/common/utils/secure-id.util';
import { EmailService } from '../../../integrations/email/email.service';
import { mapFormFieldData } from '../utils/form-field.mapper';
import { duplicateFormStructure } from '../utils/duplicate-form.helper';
import {
  generateRandomFormSlug,
  normalizeFormSlugInput,
} from '../utils/form-slug.util';
import { GoogleSheetsService } from '../../../integrations/google-sheets/google-sheets.service';
import {
  buildFormCoverS3Key,
  decodeCoverImageDataUrl,
  resolveExistingCoverImageKey,
  validateFormCoverImageBuffer,
} from '../utils/form-cover-image.util';
import { StorageService } from '../../storage/storage.service';
import { FormTeamAccessService } from '../form-team/form-team-access.service';
import { WebhookService } from './webhook.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { assertFormUpdatePlanLimits } from '../utils/form-plan-enforcement.util';
import { FormsDeletionService } from './forms-deletion.service';
import type { FormDeletionRequestMeta } from './forms-deletion.service';
import { isActiveForm } from '../utils/forms-deletion.util';

/**
 * 📝 Forms Commands Service
 * Handles: create, update, delete, updateStatus, duplicate
 *
 * ~300 lines - follows golden rule of ≤300 lines per service
 */
@Injectable()
export class FormsCommandsService {
  private readonly bucket = process.env.S3_BUCKET || 'rukny-storage';
  private readonly FORM_COVER_WIDTH = 1200;
  private readonly FORM_COVER_HEIGHT = 630;
  private readonly MAX_COVER_SIZE = 5 * 1024 * 1024; // 5MB

  constructor(
    private prisma: PrismaService,
    private formsCache: FormsCacheService,
    private s3Service: S3Service,
    private emailService: EmailService,
    @Inject(forwardRef(() => GoogleSheetsService))
    private googleSheetsService: GoogleSheetsService,
    private storageService: StorageService,
    private webhookService: WebhookService,
    private subscriptionsService: SubscriptionsService,
    private formTeamAccess: FormTeamAccessService,
    private formsDeletion: FormsDeletionService,
  ) {}

  /**
   * Create a new form
   * Images are processed outside the transaction to keep it short.
   */
  async create(userId: string, createFormDto: CreateFormDto) {
    const uniqueSlug = await this.resolveCreateSlug(createFormDto.slug);
    await this.validateLinkedEntities(userId, createFormDto);

    const {
      fields,
      steps,
      coverImage,
      bannerImages,
      bannerDisplayMode,
      enableGoogleSheets,
      storageProvider: _storageProvider,
      ...formData
    } = createFormDto;
    const isMultiStep = formData.isMultiStep || (steps && steps.length > 0);
    const formId = SecureIds.form();

    // Process images outside transaction to avoid long-running transaction
    const coverImageKey = coverImage
      ? await this.processCoverImage(coverImage, userId, formId)
      : undefined;
    const bannerImageKeys = bannerImages?.length
      ? await this.processBannerImages(bannerImages, userId, formId)
      : [];

    const form = await this.prisma.$transaction(async (tx) => {
      await tx.form.create({
        data: {
          id: formId,
          ...formData,
          slug: uniqueSlug,
          coverImage: coverImageKey || (bannerImageKeys[0] ?? undefined),
          bannerImages: bannerImageKeys,
          bannerDisplayMode: bannerDisplayMode || 'single',
          userId,
          status: formData.status || 'DRAFT',
          isMultiStep: isMultiStep || false,
        },
      });

      await this.createFormFieldsAndSteps(
        tx,
        formId,
        fields,
        steps,
        isMultiStep,
      );

      return tx.form.findUnique({
        where: { id: formId },
        include: this.getFormInclude(),
      });
    });

    if (form?.status === 'PUBLISHED') {
      void this.sendFormPublishedEmail(form).catch((e) =>
        console.error('Form published email failed:', e),
      );
    }

    if (enableGoogleSheets && form?.id) {
      void this.googleSheetsService
        .createSpreadsheet(form.id, userId)
        .catch((e) =>
          console.error('Auto Google Sheets setup failed:', e?.message || e),
        );
    }

    await this.invalidateFormCaches(form);
    return form;
  }

  /**
   * Update a form
   */
  async update(userId: string, formId: string, updateFormDto: UpdateFormDto) {
    const form = await this.prisma.form.findUnique({ where: { id: formId } });

    if (!form) throw new NotFoundException('Form not found');
    await this.formTeamAccess.assertFormPermission(form, userId, 'edit_form');

    const limits = await this.subscriptionsService.getUserLimits(userId);
    assertFormUpdatePlanLimits(limits, updateFormDto);

    // Check slug uniqueness if changed
    if (updateFormDto.slug && updateFormDto.slug !== form.slug) {
      const existing = await this.prisma.form.findUnique({
        where: { slug: updateFormDto.slug },
      });
      if (existing) throw new ConflictException('Slug already taken');
    }

    const { fields, steps, coverImage, bannerImages, ...formData } =
      updateFormDto;

    if (formData.webhookEnabled === true && !form.webhookSecret) {
      (formData as Record<string, unknown>).webhookSecret =
        crypto.randomBytes(32).toString('hex');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Process cover image
      let coverImageKey = form.coverImage;
      if (coverImage !== undefined) {
        coverImageKey = coverImage
          ? await this.processCoverImage(coverImage, userId, formId)
          : null;
      }

      // Process banner images
      let bannerImageKeys = form.bannerImages;
      if (bannerImages !== undefined) {
        bannerImageKeys = await this.processBannerImages(
          bannerImages || [],
          userId,
          formId,
        );
      }

      // Update form
      await tx.form.update({
        where: { id: formId },
        data: {
          ...formData,
          coverImage: coverImageKey,
          bannerImages: bannerImageKeys,
        },
      });

      // Update fields if provided (preserve ids so submission data stays linked)
      if (fields) {
        await tx.formField.deleteMany({ where: { formId } });
        if (fields.length > 0) {
          await tx.formField.createMany({
            data: fields.map((field: any) =>
              this.mapFieldData(field, formId, null, { preserveId: true }),
            ),
          });
        }
      }

      return tx.form.findUnique({
        where: { id: formId },
        include: this.getFormInclude(),
      });
    });

    await this.invalidateFormCaches(updated, form.slug);

    if (
      formData.status === 'PUBLISHED' &&
      form.status === 'DRAFT' &&
      updated
    ) {
      void this.sendFormPublishedEmail(updated).catch((e) =>
        console.error('Form published email failed:', e),
      );
    }

    return this.transformCoverImage(updated);
  }

  /**
   * Update form status
   */
  async updateStatus(userId: string, formId: string, status: FormStatus) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: {
        user: { include: { profile: true } },
      },
    });

    if (!form) throw new NotFoundException('Form not found');
    await this.formTeamAccess.assertFormPermission(form, userId, 'publish_form');

    const updated = await this.prisma.form.update({
      where: { id: formId },
      data: { status },
      include: {
        user: { include: { profile: true } },
      },
    });

    if (status === 'PUBLISHED' && form.status === 'DRAFT') {
      void this.sendFormPublishedEmail(updated).catch((e) =>
        console.error('Form published email failed:', e),
      );
    }

    await this.invalidateFormCaches(updated);
    return updated;
  }

  /**
   * Soft-delete a form (30-day retention before permanent purge).
   */
  async delete(
    userId: string,
    formId: string,
    confirmTitle: string,
    reason: string | undefined,
    meta: FormDeletionRequestMeta,
  ) {
    return this.formsDeletion.softDelete(
      userId,
      formId,
      confirmTitle,
      reason,
      meta,
    );
  }

  async restore(
    userId: string,
    formId: string,
    confirmTitle: string,
    meta: FormDeletionRequestMeta,
  ) {
    return this.formsDeletion.restore(userId, formId, confirmTitle, meta);
  }

  /**
   * Duplicate a form
   */
  async duplicate(userId: string, formId: string) {
    const original = await this.prisma.form.findUnique({
      where: { id: formId },
    });

    if (!original) throw new NotFoundException('Form not found');
    if (!isActiveForm(original)) {
      throw new BadRequestException('Cannot duplicate a deleted form');
    }
    await this.formTeamAccess.assertFormPermission(
      original,
      userId,
      'create_form',
    );

    const slug = await this.ensureUniqueSlug(
      `${original.slug}-copy`,
      true,
    );
    const newFormId = SecureIds.form();

    const {
      id: _id,
      createdAt: _c,
      updatedAt: _u,
      viewCount: _v,
      submissionCount: _s,
      ...formData
    } = original;

    const duplicated = await this.prisma.$transaction(async (tx) => {
      await tx.form.create({
        data: {
          id: newFormId,
          ...formData,
          title: `${original.title} (Copy)`,
          slug,
          status: 'DRAFT',
          viewCount: 0,
          submissionCount: 0,
        },
      });

      await duplicateFormStructure(tx, formId, newFormId);

      return tx.form.findUnique({
        where: { id: newFormId },
        include: {
          fields: { orderBy: { order: 'asc' } },
          steps: {
            orderBy: { order: 'asc' },
            include: { form_fields: { orderBy: { order: 'asc' } } },
          },
        },
      });
    });

    await this.invalidateFormCaches(duplicated);
    return duplicated;
  }

  // ============ Private Helpers ============

  private async validateLinkedEntities(userId: string, dto: CreateFormDto) {
    if (dto.linkedEventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: dto.linkedEventId },
      });
      if (!event || event.userId !== userId) {
        throw new NotFoundException('Linked event not found or unauthorized');
      }
    }

    if (dto.linkedStoreId) {
      const store = await this.prisma.store.findUnique({
        where: { id: dto.linkedStoreId },
      });
      if (!store || store.userId !== userId) {
        throw new NotFoundException('Linked store not found or unauthorized');
      }
    }
  }

  private async createFormFieldsAndSteps(
    tx: any,
    formId: string,
    fields?: any[],
    steps?: any[],
    isMultiStep?: boolean,
  ) {
    if (isMultiStep && steps?.length) {
      for (const step of steps) {
        const stepId = SecureIds.generic();
        await tx.form_steps.create({
          data: {
            id: stepId,
            formId,
            title: step.title,
            description: step.description,
            order: step.order,
            updatedAt: new Date(),
          },
        });

        if (step.fields?.length) {
          await tx.formField.createMany({
            data: step.fields.map((field: any) =>
              this.mapFieldData(field, formId, stepId, { preserveId: true }),
            ),
          });
        }
      }
    } else if (fields?.length) {
      await tx.formField.createMany({
        data: fields.map((field: any) =>
          this.mapFieldData(field, formId, null, { preserveId: true }),
        ),
      });
    }
  }

  private mapFieldData(
    field: any,
    formId: string,
    stepId?: string | null,
    options?: { preserveId?: boolean },
  ) {
    return mapFormFieldData(field, formId, stepId, options);
  }

  private async processCoverImage(
    coverImage: string,
    userId: string,
    formId: string,
  ): Promise<string | undefined> {
    if (!coverImage) return undefined;

    const existingKey = resolveExistingCoverImageKey(coverImage, userId, formId);
    if (existingKey) return existingKey;

    const buffer = decodeCoverImageDataUrl(coverImage);
    await validateFormCoverImageBuffer(buffer);

    const sharp = await import('sharp');
    const processed = await sharp
      .default(buffer)
      .resize(this.FORM_COVER_WIDTH, this.FORM_COVER_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 85 })
      .toBuffer();

    const s3Key = buildFormCoverS3Key(userId, formId);
    await this.s3Service.uploadBuffer(
      this.bucket,
      s3Key,
      processed,
      'image/webp',
    );

    await this.storageService.registerFormCoverFile(
      userId,
      formId,
      s3Key,
      processed.length,
    );

    return s3Key;
  }

  private async processBannerImages(
    images: string[],
    userId: string,
    formId: string,
  ): Promise<string[]> {
    const results: string[] = [];
    for (const img of images) {
      const processed = await this.processCoverImage(img, userId, formId);
      if (processed) results.push(processed);
    }
    return results;
  }

  /** Create: random 6-char slug when omitted; otherwise normalize and ensure uniqueness. */
  private async resolveCreateSlug(provided?: string): Promise<string> {
    const trimmed = provided?.trim();
    if (!trimmed) {
      return this.generateUniqueRandomSlug();
    }
    const base = normalizeFormSlugInput(trimmed);
    if (!base) {
      return this.generateUniqueRandomSlug();
    }
    return this.ensureUniqueSlug(base, true);
  }

  private async generateUniqueRandomSlug(): Promise<string> {
    const maxAttempts = 32;
    for (let i = 0; i < maxAttempts; i++) {
      const slug = generateRandomFormSlug();
      const existing = await this.prisma.form.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!existing) return slug;
    }
    throw new ConflictException('Could not generate a unique form slug');
  }

  private async ensureUniqueSlug(
    baseSlug: string,
    appendCounterOnCollision: boolean,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;
    while (await this.prisma.form.findUnique({ where: { slug } })) {
      if (!appendCounterOnCollision) {
        return this.generateUniqueRandomSlug();
      }
      slug = `${baseSlug}-${counter++}`;
    }
    return slug;
  }

  private async sendFormPublishedEmail(form: {
    id: string;
    title: string;
    slug: string;
    user?: {
      email: string;
      profile?: { name?: string | null } | null;
    } | null;
  }) {
    if (form?.user?.email) {
      try {
        const userName =
          form.user.profile?.name || form.user.email.split('@')[0];
        await this.emailService.sendFormCreatedNotification(
          form.user.email,
          userName,
          {
            formTitle: form.title,
            formSlug: form.slug,
            formId: form.id,
          },
        );
      } catch (e) {
        console.error('Error sending form published notification:', e);
      }
    }
  }

  private async invalidateFormCaches(
    form?: { id?: string; slug?: string; userId?: string } | null,
    previousSlug?: string,
  ) {
    if (!form?.userId) return;

    const profile = await this.prisma.profile.findUnique({
      where: { userId: form.userId },
      select: { username: true },
    });

    await this.formsCache.invalidateForm({
      slug: form.slug,
      userId: form.userId,
      username: profile?.username ?? undefined,
    });

    if (previousSlug && previousSlug !== form.slug) {
      await this.formsCache.invalidateForm({ slug: previousSlug });
    }
  }

  private async transformCoverImage(form: any) {
    if (form?.coverImage && !form.coverImage.startsWith('http')) {
      try {
        const url = await this.s3Service.getPresignedGetUrl(
          this.bucket,
          form.coverImage,
          3600,
        );
        return { ...form, coverImage: url };
      } catch (e) {
        return { ...form, coverImage: null };
      }
    }
    return form;
  }

  private getFormInclude() {
    return {
      fields: { orderBy: { order: 'asc' as const } },
      steps: {
        orderBy: { order: 'asc' as const },
        include: { form_fields: { orderBy: { order: 'asc' as const } } },
      },
      _count: { select: { submissions: true } },
      user: { include: { profile: true } },
    };
  }

  async testWebhook(userId: string, formId: string) {
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      select: {
        id: true,
        userId: true,
        webhookUrl: true,
        webhookSecret: true,
        webhookEnabled: true,
      },
    });

    if (!form) throw new NotFoundException('Form not found');
    await this.formTeamAccess.assertFormPermission(
      form,
      userId,
      'manage_webhooks',
    );
    if (!form.webhookUrl) {
      throw new BadRequestException('Webhook URL is not configured');
    }

    const result = await this.webhookService.testWebhook(
      form.webhookUrl,
      form.webhookSecret ?? undefined,
    );

    return {
      success: result.success,
      statusCode: result.statusCode,
      latencyMs: result.latencyMs,
      errorMessage: result.errorMessage,
    };
  }

  async regenerateWebhookSecret(userId: string, formId: string) {
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

    const webhookSecret = crypto.randomBytes(32).toString('hex');

    await this.prisma.form.update({
      where: { id: formId },
      data: { webhookSecret },
    });

    return { webhookSecret };
  }
}
