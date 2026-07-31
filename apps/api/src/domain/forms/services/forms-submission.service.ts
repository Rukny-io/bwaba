import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { SubmitFormDto } from '../dto';
import { ValidationService } from '../../../core/common/validation.service';
import { ConditionalLogicService } from './conditional-logic.service';
import { SecureIds } from '../../../core/common/utils/secure-id.util';
import { NotificationsGateway } from '../../notifications/notifications.gateway';
import { NotificationType } from '@prisma/client';
import { GoogleDriveService } from '../../../integrations/google-drive/google-drive.service';
import { GoogleSheetsService } from '../../../integrations/google-sheets/google-sheets.service';
import { TurnstileService } from '../../../infrastructure/security/turnstile.service';
import { EmailService } from '../../../integrations/email/email.service';
import { CacheManager } from '../../../core/cache/cache.manager';
import { RedisService } from '../../../core/cache/redis.service';
import { CacheKeys } from '../../../core/cache/cache.constants';
import {
  FormAnalyticsTrackerService,
  type AnalyticsTrackContext,
} from './form-analytics-tracker.service';
import { FormWebhookQueueService } from './form-webhook-queue.service';
import { FormGeoResolverService } from './form-geo-resolver.service';
import { FormTeamAccessService } from '../form-team/form-team-access.service';
import { injectRespondentCountryFields } from '../utils/respondent-country.util';
import type { WebhookPayload } from './webhook.service';
import { buildSubmissionAnswersByLabel } from '../utils/submission-answers.util';
import {
  assertFormAcceptsSubmission,
  verifySubmissionTurnstile,
} from '../utils/form-submission.validator';
import {
  idempotencyLockKey,
  idempotencyResultKey,
  normalizeIdempotencyKey,
} from '../utils/form-idempotency.util';
import {
  fieldRequiresEmailVerification,
  getEmailValueForField,
} from '../utils/form-email-verification-check.util';
import {
  fieldRequiresPhoneWhatsappVerification,
  getPhoneValueForField,
} from '../utils/form-phone-verification-check.util';
import { FormsEmailVerificationService } from './forms-email-verification.service';
import { FormsPhoneVerificationService } from './forms-phone-verification.service';
import { FormsPublicUploadService } from './forms-public-upload.service';
import {
  FORMS_IDEMPOTENCY_LOCK_TTL_SECONDS,
  FORMS_IDEMPOTENCY_TTL_SECONDS,
} from '../forms.constants';
import { buildSubmissionSlotKey } from '../utils/form-submission-slot.util';
import {
  claimIdempotencyKey,
  releaseIdempotencyClaim,
} from '../utils/form-idempotency-claim.util';
import { Prisma } from '@prisma/client';

/**
 * 📨 Forms Submission Service
 * Handles: submitForm, validateSubmission, processSubmissionData
 *
 * ~300 lines - follows golden rule of ≤300 lines per service
 */
@Injectable()
export class FormsSubmissionService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private validationService: ValidationService,
    private conditionalLogicService: ConditionalLogicService,
    private notificationsGateway: NotificationsGateway,
    private turnstileService: TurnstileService,
    private emailService: EmailService,
    private analyticsTracker: FormAnalyticsTrackerService,
    private webhookQueue: FormWebhookQueueService,
    private cacheManager: CacheManager,
    private redis: RedisService,
    private emailVerification: FormsEmailVerificationService,
    private phoneVerification: FormsPhoneVerificationService,
    private publicUpload: FormsPublicUploadService,
    private geoResolver: FormGeoResolverService,
    @Inject(forwardRef(() => GoogleDriveService))
    private googleDriveService: GoogleDriveService,
    @Inject(forwardRef(() => GoogleSheetsService))
    private googleSheetsService: GoogleSheetsService,
    private formTeamAccess: FormTeamAccessService,
  ) {}

  /**
   * Submit a form response
   */
  async submitForm(
    formId: string,
    submitFormDto: SubmitFormDto,
    userId?: string,
    idempotencyKey?: string,
    trackContext?: AnalyticsTrackContext,
  ) {
    const normalizedIdempotencyKey = normalizeIdempotencyKey(idempotencyKey);
    let idempotencyLockHeld = false;
    let idempotencyDbClaimed = false;

    if (normalizedIdempotencyKey) {
      const cached = await this.getIdempotentSubmission(
        formId,
        normalizedIdempotencyKey,
      );
      if (cached) return cached;

      const acquired = await this.redis.setNX(
        idempotencyLockKey(formId, normalizedIdempotencyKey),
        '1',
        FORMS_IDEMPOTENCY_LOCK_TTL_SECONDS,
      );
      if (!acquired) {
        await this.delay(250);
        const retry = await this.getIdempotentSubmission(
          formId,
          normalizedIdempotencyKey,
        );
        if (retry) return retry;
        throw new ConflictException({
          message: 'A submission with this idempotency key is already being processed',
          code: 'IDEMPOTENCY_IN_PROGRESS',
        });
      }
      idempotencyLockHeld = true;

      const claim = await claimIdempotencyKey(
        this.prisma,
        formId,
        normalizedIdempotencyKey,
      );
      if (claim === 'completed') {
        const existing = await this.getIdempotentSubmission(
          formId,
          normalizedIdempotencyKey,
        );
        if (existing) return existing;
      }
      idempotencyDbClaimed = true;
    }

    let userSubmitLockHeld = false;
    const userSubmitLockKey =
      userId && formId ? `form:submit:user:${formId}:${userId}` : null;

    try {
      const form = await this.prisma.form.findUnique({
        where: { id: formId },
        include: { fields: true },
      });

      if (!form) throw new NotFoundException('Form not found');

      if (
        userId &&
        userSubmitLockKey &&
        (!form.allowMultipleSubmissions || form.oneResponsePerUser)
      ) {
        const acquiredUserLock = await this.redis.setNX(
          userSubmitLockKey,
          '1',
          60,
        );
        if (!acquiredUserLock) {
          throw new ConflictException({
            message: 'You have already submitted this form or a submission is in progress',
            code: 'DUPLICATE_SUBMISSION',
          });
        }
        userSubmitLockHeld = true;
      }

      await assertFormAcceptsSubmission(this.prisma, form, userId);

      const submissionData = await verifySubmissionTurnstile(
        this.turnstileService,
        form.fields,
        submitFormDto.data || {},
        submitFormDto.turnstileToken,
        form.requireTurnstileOnSubmit,
        trackContext?.ip,
      );

      const normalizedData = await this.publicUpload.normalizeSubmissionFiles(
        formId,
        form.fields,
        submissionData,
      );

      const geo = await this.geoResolver.resolveFromIp(
        trackContext?.ip ?? submitFormDto.ipAddress,
        trackContext?.headers,
      );
      const dataWithGeo = injectRespondentCountryFields(
        form.fields,
        normalizedData,
        geo,
      );

      const { visibleFieldIds, requiredFieldIds } =
        this.conditionalLogicService.getVisibleFields(
          form.fields,
          dataWithGeo,
        );

      const decorativeTypes = new Set([
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
        'CONDITIONAL_LOGIC',
        'HIDDEN',
        'CALCULATED',
        'RESPONDENT_COUNTRY',
      ]);

      const fieldsToValidate = form.fields
        .filter(
          (f) =>
            visibleFieldIds.includes(f.id) && !decorativeTypes.has(f.type),
        )
        .map((f) => ({
          ...f,
          required: requiredFieldIds.includes(f.id) || f.required,
        }));

      const validation = this.validationService.validateFormSubmission(
        fieldsToValidate,
        dataWithGeo,
      );
      if (!validation.isValid) {
        throw new BadRequestException({
          message: 'Form validation failed',
          errors: validation.errors,
          errorMessages: this.validationService.flattenErrors(validation.errors),
        });
      }

      await this.assertVerifiedEmailFields(
        formId,
        fieldsToValidate,
        dataWithGeo,
      );
      await this.assertVerifiedPhoneFields(
        formId,
        fieldsToValidate,
        dataWithGeo,
      );

      const submissionId = SecureIds.submission();

      const processedData = await this.processSubmissionData(
        formId,
        form.fields,
        dataWithGeo,
        submissionId,
      );

      const submissionSlotKey = buildSubmissionSlotKey(form, userId);

      const submission = await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT id FROM forms WHERE id = ${formId} FOR UPDATE`;

        const submissionCount = await tx.form_submissions.count({
          where: { formId },
        });
        if (form.maxSubmissions && submissionCount >= form.maxSubmissions) {
          throw new BadRequestException('Form has reached maximum submissions');
        }
        if (form.submissionLimit && submissionCount >= form.submissionLimit) {
          throw new BadRequestException('Form has reached its submission limit');
        }

        if (submissionSlotKey) {
          try {
            await tx.form_submission_slot.create({
              data: { formId, slotKey: submissionSlotKey },
            });
          } catch (error) {
            if (
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === 'P2002'
            ) {
              throw new ConflictException({
                message: 'You have already submitted this form',
                code: 'DUPLICATE_SUBMISSION',
              });
            }
            throw error;
          }
        }

        const created = await tx.form_submissions.create({
          data: {
            id: submissionId,
            formId,
            userId,
            data: processedData,
            ipAddress: submitFormDto.ipAddress,
            userAgent: submitFormDto.userAgent,
            timeToComplete: submitFormDto.timeToComplete,
            updatedAt: new Date(),
          },
        });

        await tx.form.update({
          where: { id: formId },
          data: { submissionCount: { increment: 1 } },
        });

        return created;
      });

      if (normalizedIdempotencyKey) {
        await this.redis.set(
          idempotencyResultKey(formId, normalizedIdempotencyKey),
          submission.id,
          FORMS_IDEMPOTENCY_TTL_SECONDS,
        );
        await this.persistIdempotency(
          formId,
          normalizedIdempotencyKey,
          submission.id,
        );
        await this.redis.del(
          idempotencyLockKey(formId, normalizedIdempotencyKey),
        );
        idempotencyLockHeld = false;
      }

      await this.clearVerifiedEmailsAfterSubmit(
        formId,
        fieldsToValidate,
        submissionData,
      );
      await this.clearVerifiedPhonesAfterSubmit(
        formId,
        fieldsToValidate,
        submissionData,
      );

      void this.analyticsTracker.recordSubmission(
        formId,
        form.fields,
        processedData,
        {
          userAgent: submitFormDto.userAgent,
          ip: trackContext?.ip ?? submitFormDto.ipAddress,
          headers: trackContext?.headers,
        },
        submitFormDto.timeToComplete,
      );

      void this.sendNotifications(form, submission, processedData).catch(
        console.error,
      );

      if (form.notifyOnSubmission && form.notificationEmail) {
        void this.emailService
          .sendFormSubmissionNotification(
            form.notificationEmail,
            form.title,
            processedData,
            formId,
          )
          .catch(console.error);
      }

      if (form.autoResponseEnabled && form.autoResponseMessage && userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        });
        if (user?.email) {
          void this.emailService
            .sendAutoResponse(user.email, form.title, form.autoResponseMessage)
            .catch(console.error);
        }
      }

      void this.googleSheetsService
        .addSubmissionToSheet(formId, submission.id)
        .catch(console.error);

      try {
        if (form.userId) {
          await this.cacheManager.invalidate(
            CacheKeys.dashboardStats(form.userId),
          );
        }
      } catch {
        /* non-blocking */
      }

      if (userSubmitLockHeld && userSubmitLockKey) {
        await this.redis.del(userSubmitLockKey);
        userSubmitLockHeld = false;
      }

      return submission;
    } catch (error) {
      if (idempotencyDbClaimed && normalizedIdempotencyKey) {
        await releaseIdempotencyClaim(
          this.prisma,
          formId,
          normalizedIdempotencyKey,
        ).catch(() => {});
      }
      throw error;
    } finally {
      if (
        idempotencyLockHeld &&
        normalizedIdempotencyKey
      ) {
        await this.redis.del(
          idempotencyLockKey(formId, normalizedIdempotencyKey),
        );
      }
      if (userSubmitLockHeld && userSubmitLockKey) {
        await this.redis.del(userSubmitLockKey);
      }
    }
  }

  /**
   * Get form submissions with cursor pagination
   */
  async getSubmissions(
    userId: string,
    formId: string,
    options?: { cursor?: string; limit?: number; search?: string },
  ) {
    const form = await this.prisma.form.findUnique({ where: { id: formId } });

    if (!form) throw new NotFoundException('Form not found');
    await this.formTeamAccess.assertFormPermission(
      form,
      userId,
      'view_submissions',
    );

    const limit = Math.min(options?.limit || 50, 100);
    const searchFilter = options?.search?.trim();
    const userInclude = {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { name: true } },
        },
      },
    } as const;

    let submissions: Awaited<
      ReturnType<typeof this.prisma.form_submissions.findMany>
    >;

    if (searchFilter) {
      const pattern = `%${searchFilter.replace(/[%_\\]/g, '\\$&')}%`;
      const cursorClause = options?.cursor
        ? Prisma.sql`AND s."completedAt" < (SELECT "completedAt" FROM form_submissions WHERE id = ${options.cursor})`
        : Prisma.empty;

      const idRows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT s.id
        FROM form_submissions s
        LEFT JOIN users u ON u.id = s."userId"
        WHERE s."formId" = ${formId}
        AND (
          s.data::text ILIKE ${pattern}
          OR u.email ILIKE ${pattern}
          OR s.id ILIKE ${pattern}
        )
        ${cursorClause}
        ORDER BY s."completedAt" DESC
        LIMIT ${limit + 1}
      `;

      const idList = idRows.map((row) => row.id);
      const rows = await this.prisma.form_submissions.findMany({
        where: { id: { in: idList } },
        include: userInclude,
      });
      const order = new Map(idList.map((id, index) => [id, index]));
      submissions = rows.sort(
        (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
      );
    } else {
      submissions = await this.prisma.form_submissions.findMany({
        where: { formId },
        take: limit + 1,
        ...(options?.cursor && { cursor: { id: options.cursor }, skip: 1 }),
        include: userInclude,
        orderBy: { completedAt: 'desc' },
      });
    }

    const hasMore = submissions.length > limit;
    const data = hasMore ? submissions.slice(0, limit) : submissions;

    return {
      submissions: data,
      pagination: {
        hasMore,
        nextCursor:
          hasMore && data.length > 0 ? data[data.length - 1].id : null,
        total: await this.prisma.form_submissions.count({ where: { formId } }),
      },
    };
  }

  /**
   * Delete a submission
   */
  async deleteSubmission(userId: string, formId: string, submissionId: string) {
    const form = await this.prisma.form.findUnique({ where: { id: formId } });

    if (!form) throw new NotFoundException('Form not found');
    await this.formTeamAccess.assertFormPermission(
      form,
      userId,
      'edit_form',
    );

    const submission = await this.prisma.form_submissions.findUnique({
      where: { id: submissionId, formId },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    await this.prisma.form_submissions.delete({ where: { id: submissionId } });
    await this.prisma.form.update({
      where: { id: formId },
      data: { submissionCount: { decrement: 1 } },
    });

    void this.maybeEnqueueWebhook(
      form,
      'form.submission.deleted',
      {
        event: 'form.submission.deleted',
        timestamp: new Date().toISOString(),
        formId: form.id,
        formSlug: form.slug,
        submissionId,
        data: submission.data,
      },
    ).catch(console.error);
  }

  // ============ Private Helpers ============

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async getIdempotentSubmission(formId: string, key: string) {
    const existingId = await this.redis.get<string>(
      idempotencyResultKey(formId, key),
    );
    if (existingId && typeof existingId === 'string') {
      const fromRedis = await this.prisma.form_submissions.findUnique({
        where: { id: existingId },
      });
      if (fromRedis) return fromRedis;
    }

    const row = await this.prisma.form_submission_idempotency.findUnique({
      where: {
        formId_idempotencyKey: { formId, idempotencyKey: key },
      },
    });
    if (
      row?.submissionId &&
      row.expiresAt.getTime() > Date.now()
    ) {
      return this.prisma.form_submissions.findUnique({
        where: { id: row.submissionId },
      });
    }

    return null;
  }

  private async persistIdempotency(
    formId: string,
    key: string,
    submissionId: string,
  ): Promise<void> {
    const expiresAt = new Date(
      Date.now() + FORMS_IDEMPOTENCY_TTL_SECONDS * 1000,
    );
    await this.prisma.form_submission_idempotency.upsert({
      where: {
        formId_idempotencyKey: { formId, idempotencyKey: key },
      },
      create: {
        formId,
        idempotencyKey: key,
        submissionId,
        expiresAt,
      },
      update: {
        submissionId,
        expiresAt,
      },
    });
  }

  private async assertVerifiedEmailFields(
    formId: string,
    fields: Array<{
      id: string;
      label: string;
      type: string;
      validationRules?: unknown;
      options?: unknown;
    }>,
    data: Record<string, unknown>,
  ): Promise<void> {
    for (const field of fields) {
      if (!fieldRequiresEmailVerification(field)) continue;
      const email = getEmailValueForField(field, data);
      if (!email) continue;
      const verified = await this.emailVerification.isEmailVerified(
        formId,
        email,
      );
      if (!verified) {
        throw new BadRequestException({
          message: 'Email address must be verified before submitting',
          code: 'EMAIL_NOT_VERIFIED',
          fieldId: field.id,
        });
      }
    }
  }

  private async assertVerifiedPhoneFields(
    formId: string,
    fields: Array<{
      id: string;
      label: string;
      type: string;
      validationRules?: unknown;
      options?: unknown;
    }>,
    data: Record<string, unknown>,
  ): Promise<void> {
    for (const field of fields) {
      if (!fieldRequiresPhoneWhatsappVerification(field)) continue;
      const phone = getPhoneValueForField(field, data);
      if (!phone) continue;
      const verified = await this.phoneVerification.isPhoneVerified(
        formId,
        phone,
      );
      if (!verified) {
        throw new BadRequestException({
          message: 'Phone number must be verified before submitting',
          code: 'PHONE_NOT_VERIFIED',
          fieldId: field.id,
        });
      }
    }
  }

  private async clearVerifiedEmailsAfterSubmit(
    formId: string,
    fields: Array<{
      id: string;
      label: string;
      type: string;
      validationRules?: unknown;
      options?: unknown;
    }>,
    data: Record<string, unknown>,
  ): Promise<void> {
    for (const field of fields) {
      if (!fieldRequiresEmailVerification(field)) continue;
      const email = getEmailValueForField(field, data);
      if (email) {
        await this.emailVerification.clearVerified(formId, email);
      }
    }
  }

  private async clearVerifiedPhonesAfterSubmit(
    formId: string,
    fields: Array<{
      id: string;
      label: string;
      type: string;
      validationRules?: unknown;
      options?: unknown;
    }>,
    data: Record<string, unknown>,
  ): Promise<void> {
    for (const field of fields) {
      if (!fieldRequiresPhoneWhatsappVerification(field)) continue;
      const phone = getPhoneValueForField(field, data);
      if (phone) {
        await this.phoneVerification.clearVerified(formId, phone);
      }
    }
  }

  private async sendNotifications(form: any, submission: any, data: any) {
    // Real-time notification to form owner
    try {
      await this.notificationsGateway.sendNotification({
        userId: form.userId,
        type: NotificationType.FORM_SUBMISSION,
        title: 'استجابة نموذج جديدة',
        message: `تم استلام استجابة جديدة على النموذج "${form.title}"`,
        data: {
          formId: form.id,
          formTitle: form.title,
          formSlug: form.slug,
          submissionId: submission.id,
          responseCount: (form.submissionCount || 0) + 1,
        },
      });
    } catch (e) {
      console.error('Failed to send real-time notification:', e);
    }

    void this.maybeEnqueueWebhook(
      form,
      'form.submission.created',
      {
        event: 'form.submission.created',
        timestamp: new Date().toISOString(),
        formId: form.id,
        formSlug: form.slug,
        submissionId: submission.id,
        answers: buildSubmissionAnswersByLabel(form.fields ?? [], data),
        data,
      },
    ).catch(console.error);
  }

  private async maybeEnqueueWebhook(
    form: {
      id: string;
      slug: string;
      webhookEnabled: boolean;
      webhookUrl: string | null;
      webhookSecret: string | null;
      webhookEvents: string[];
    },
    event: WebhookPayload['event'],
    payload: WebhookPayload,
  ): Promise<void> {
    if (!form.webhookEnabled || !form.webhookUrl) return;

    const subscribed =
      form.webhookEvents?.length > 0
        ? form.webhookEvents
        : ['form.submission.created'];

    if (!subscribed.includes(event)) return;

    await this.webhookQueue.enqueueDelivery(
      form.id,
      form.webhookUrl,
      form.webhookSecret,
      payload,
    );
  }

  private async processSubmissionData(
    formId: string,
    fields: any[],
    data: Record<string, any>,
    submissionId: string,
  ): Promise<Record<string, any>> {
    const processedData = { ...data };
    const isDriveConnected = await this.isDriveConnected(formId);
    const apiUrl = this.config.get('API_URL') || 'http://localhost:3001';

    for (const field of fields) {
      const fieldKey =
        data[field.id] !== undefined
          ? field.id
          : data[field.label] !== undefined
            ? field.label
            : null;
      if (!fieldKey || !data[fieldKey]) continue;

      const value = data[fieldKey];

      try {
        if (field.type === 'SIGNATURE' && this.isBase64Image(value)) {
          processedData[fieldKey] = await this.publicUpload.persistSignature(
            formId,
            submissionId,
            field.id,
            this.normalizeBase64(value),
          );
          continue;
        }

        if (!isDriveConnected) continue;

        // Process FILE fields (Google Drive when connected)
        if (field.type === 'FILE') {
          if (value?.key && value?.url) {
            processedData[fieldKey] = value;
            continue;
          }
          processedData[fieldKey] = await this.processFileField(
            value,
            formId,
            submissionId,
            apiUrl,
          );
        }
      } catch (e) {
        console.error(`Error processing field ${field.id}:`, e);
      }
    }

    return processedData;
  }

  private async processFileField(
    value: any,
    formId: string,
    submissionId: string,
    apiUrl: string,
  ) {
    const files = Array.isArray(value) ? value : [value];
    const results: any[] = [];

    for (const file of files) {
      if (file.url || file.secureUrl || file.fileId) {
        results.push(file);
        continue;
      }

      const fileData = this.normalizeBase64(file.data);
      if (!fileData?.startsWith('data:')) {
        results.push(file);
        continue;
      }

      const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = file.name || file.originalName || `file_${Date.now()}`;
      const fileType = file.type || file.mimeType || 'application/octet-stream';

      const result = await this.googleDriveService.uploadFile(
        formId,
        {
          buffer,
          originalname: fileName,
          mimetype: fileType,
        },
        submissionId,
      );

      results.push({
        name: fileName,
        type: fileType,
        size: file.size,
        fileId: result.fileId,
        formId,
        webViewLink: result.webViewLink,
        secureUrl: `${apiUrl}/api/v1/integrations/google-drive/secure/${formId}/${result.fileId}`,
      });
    }

    return Array.isArray(value) ? results : results[0];
  }

  private isBase64Image(value: any): boolean {
    if (typeof value !== 'string') return false;
    return (
      value.startsWith('data:image') ||
      value.startsWith('image/') ||
      /^data:image\/[\w+.-]+base64,/i.test(value.slice(0, 80))
    );
  }

  private normalizeBase64(value: string): string {
    if (!value) return value;
    let normalized = value.trim();
    normalized = normalized.replace(
      /^(data:image\/[\w+.-]+)base64,/i,
      '$1;base64,',
    );
    if (!normalized.startsWith('data:') && normalized.includes(';base64,')) {
      return `data:${normalized}`;
    }
    return normalized;
  }

  private async isDriveConnected(formId: string): Promise<boolean> {
    const integration = await this.prisma.formIntegration.findFirst({
      where: { formId, type: 'google_sheets', isActive: true },
    });
    return !!integration;
  }
}
