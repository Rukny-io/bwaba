import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SecurityAction, SecurityStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { S3Service } from '../../../services/s3.service';
import { StorageService } from '../../storage/storage.service';
import { FormsCacheService } from './forms-cache.service';
import { FormTeamAccessService } from '../form-team/form-team-access.service';
import { SecurityLogService } from '../../../infrastructure/security/log.service';
import { RedisService } from '../../../core/cache/redis.service';
import { SecureIds } from '../../../core/common/utils/secure-id.util';
import { FORM_DELETION_RETENTION_DAYS } from '../forms-deletion.constants';
import {
  computePurgeDate,
  isActiveForm,
  sanitizeDeletionReason,
  secureFormTitleMatch,
} from '../utils/forms-deletion.util';

export type FormDeletionRequestMeta = {
  ipAddress?: string;
  userAgent?: string;
};

@Injectable()
export class FormsDeletionService {
  private readonly logger = new Logger(FormsDeletionService.name);
  private readonly bucket = process.env.S3_BUCKET || 'rukny-storage';
  private readonly deleteRateLimitPerHour = 15;

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly storageService: StorageService,
    private readonly formsCache: FormsCacheService,
    private readonly formTeamAccess: FormTeamAccessService,
    private readonly securityLogService: SecurityLogService,
    private readonly redis: RedisService,
  ) {}

  async softDelete(
    userId: string,
    formId: string,
    confirmTitle: string,
    reason: string | undefined,
    meta: FormDeletionRequestMeta,
  ) {
    await this.assertDeleteRateLimit(userId);

    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: {
        _count: { select: { fields: true, submissions: true } },
      },
    });

    if (!form) throw new NotFoundException('Form not found');
    if (!isActiveForm(form)) {
      throw new BadRequestException('Form is already scheduled for deletion');
    }

    await this.formTeamAccess.assertFormPermission(form, userId, 'delete_form');

    if (!secureFormTitleMatch(form.title, confirmTitle)) {
      await this.securityLogService.createLog({
        userId,
        action: SecurityAction.FORM_SOFT_DELETED,
        status: SecurityStatus.FAILED,
        description: 'Form deletion rejected — title confirmation mismatch',
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        metadata: { formId, formTitle: form.title },
      });
      throw new BadRequestException('Form title confirmation does not match');
    }

    const now = new Date();
    const purgeScheduledAt = computePurgeDate(FORM_DELETION_RETENTION_DAYS);
    const sanitizedReason = sanitizeDeletionReason(reason);

    await this.prisma.$transaction(async (tx) => {
      await tx.form.update({
        where: { id: formId },
        data: {
          deletedAt: now,
          deletedById: userId,
          purgeScheduledAt,
          deletionReason: sanitizedReason,
          status: 'ARCHIVED',
        },
      });

      await tx.formDeletionLog.create({
        data: {
          id: SecureIds.generic(),
          formId: form.id,
          formTitle: form.title,
          formSlug: form.slug,
          ownerId: form.userId,
          deletedById: userId,
          submissionCount: form._count.submissions,
          fieldCount: form._count.fields,
          statusAtDelete: form.status,
          typeAtDelete: form.type,
          reason: sanitizedReason,
          ipAddress: meta.ipAddress?.slice(0, 64) ?? null,
          userAgent: meta.userAgent?.slice(0, 512) ?? null,
          purgeScheduledAt,
        },
      });
    });

    await this.invalidateCaches(form);
    await this.securityLogService.createLog({
      userId,
      action: SecurityAction.FORM_SOFT_DELETED,
      status: SecurityStatus.SUCCESS,
      description: `Form soft-deleted: ${form.title}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: {
        formId: form.id,
        formSlug: form.slug,
        ownerId: form.userId,
        submissionCount: form._count.submissions,
        purgeScheduledAt: purgeScheduledAt.toISOString(),
        retentionDays: FORM_DELETION_RETENTION_DAYS,
      },
    });

    return {
      id: form.id,
      deletedAt: now.toISOString(),
      purgeScheduledAt: purgeScheduledAt.toISOString(),
      submissionCount: form._count.submissions,
      retentionDays: FORM_DELETION_RETENTION_DAYS,
    };
  }

  async restore(
    userId: string,
    formId: string,
    confirmTitle: string,
    meta: FormDeletionRequestMeta,
  ) {
    const form = await this.prisma.form.findUnique({ where: { id: formId } });
    if (!form) throw new NotFoundException('Form not found');
    if (isActiveForm(form)) {
      throw new BadRequestException('Form is not deleted');
    }
    if (form.purgeScheduledAt && form.purgeScheduledAt <= new Date()) {
      throw new BadRequestException('Restoration period has expired');
    }

    await this.formTeamAccess.assertFormPermission(form, userId, 'delete_form');

    if (!secureFormTitleMatch(form.title, confirmTitle)) {
      throw new BadRequestException('Form title confirmation does not match');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.form.update({
        where: { id: formId },
        data: {
          deletedAt: null,
          deletedById: null,
          purgeScheduledAt: null,
          deletionReason: null,
        },
      });

      await tx.formDeletionLog.updateMany({
        where: { formId, purgedAt: null, restoredAt: null },
        data: { restoredAt: new Date() },
      });
    });

    await this.invalidateCaches(form);
    await this.securityLogService.createLog({
      userId,
      action: SecurityAction.FORM_RESTORED,
      status: SecurityStatus.SUCCESS,
      description: `Form restored: ${form.title}`,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      metadata: { formId: form.id, formSlug: form.slug, ownerId: form.userId },
    });

    return { id: form.id, restored: true };
  }

  async hardDeleteForm(formId: string, deletedByUserId?: string) {
    const form = await this.prisma.form.findUnique({ where: { id: formId } });
    if (!form) return false;

    await this.cleanupFormAssets(form);
    await this.prisma.form.delete({ where: { id: formId } });

    await this.prisma.formDeletionLog.updateMany({
      where: { formId, purgedAt: null },
      data: { purgedAt: new Date() },
    });

    if (deletedByUserId) {
      await this.securityLogService.createLog({
        userId: deletedByUserId,
        action: SecurityAction.FORM_HARD_DELETED,
        status: SecurityStatus.SUCCESS,
        description: `Form permanently purged: ${form.title}`,
        metadata: { formId: form.id, formSlug: form.slug, ownerId: form.userId },
      });
    }

    await this.invalidateCaches(form);
    return true;
  }

  async purgeExpiredForms(): Promise<number> {
    const now = new Date();
    const due = await this.prisma.form.findMany({
      where: {
        deletedAt: { not: null },
        purgeScheduledAt: { lte: now },
      },
      select: { id: true, title: true, userId: true },
      take: 25,
    });

    let purged = 0;
    for (const form of due) {
      try {
        const ok = await this.hardDeleteForm(form.id);
        if (ok) purged += 1;
      } catch (err) {
        this.logger.error(
          `Failed to purge form ${form.id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    if (purged > 0) {
      this.logger.log(`Permanently purged ${purged} soft-deleted form(s)`);
    }
    return purged;
  }

  private async cleanupFormAssets(form: {
    id: string;
    userId: string;
    coverImage: string | null;
    bannerImages: string[];
  }) {
    const keys = [form.coverImage, ...form.bannerImages].filter(
      (key): key is string =>
        Boolean(key) &&
        (key!.startsWith('forms/') || key!.startsWith('users/')),
    );

    for (const key of keys) {
      try {
        await this.s3Service.deleteObject(this.bucket, key);
      } catch (err) {
        this.logger.warn(`S3 cleanup failed for ${key}: ${err?.message || err}`);
      }
    }

    try {
      await this.storageService.deleteFilesByEntity(form.userId, form.id);
    } catch (err) {
      this.logger.warn(
        `Storage entity cleanup failed for form ${form.id}: ${err?.message || err}`,
      );
    }
  }

  private async invalidateCaches(form: {
    id: string;
    slug: string;
    userId: string;
  }) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: form.userId },
      select: { username: true },
    });

    await this.formsCache.invalidateForm({
      slug: form.slug,
      userId: form.userId,
      username: profile?.username ?? undefined,
    });
  }

  private async assertDeleteRateLimit(userId: string) {
    const key = `form:soft-delete:${userId}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, 3600);
    }
    if (count > this.deleteRateLimitPerHour) {
      throw new ForbiddenException(
        'Too many deletion requests. Please try again later.',
      );
    }
  }
}
