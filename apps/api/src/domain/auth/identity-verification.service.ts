import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { readFileSync } from 'fs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { SecurityLogService } from '../../infrastructure/security/log.service';
import { IdentityUploadService } from './identity-upload.service';
import {
  IDENTITY_ADMIN_VIEW_TTL_SECONDS,
  IDENTITY_DOC_RETENTION_DAYS,
  IDENTITY_MAX_FILE_BYTES,
  IDENTITY_UPLOAD_SLOTS,
  IdentityDocumentSlot,
  IdentityDocumentType,
} from './identity.constants';

export interface SubmitIdentityDto {
  sessionId: string;
  documentType: IdentityDocumentType;
}

export interface IdentityPresignDto {
  sessionId: string;
  slot: IdentityDocumentSlot;
  contentType: string;
  fileName: string;
  fileSize: number;
}

export interface IdentityUploadDataDto {
  sessionId: string;
  slot: IdentityDocumentSlot;
  image: string;
}

@Injectable()
export class IdentityVerificationService {
  private readonly logger = new Logger(IdentityVerificationService.name);

  constructor(
    private prisma: PrismaService,
    private securityLogService: SecurityLogService,
    private identityUpload: IdentityUploadService,
  ) {}

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { verificationLevel: true, twoFactorEnabled: true },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const latestVerification = await this.prisma.identityVerification.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });

    const canUpload =
      user.twoFactorEnabled &&
      user.verificationLevel < 3 &&
      !(
        latestVerification &&
        ['pending', 'underReview', 'approved'].includes(
          latestVerification.status,
        )
      );

    return {
      verificationLevel: user.verificationLevel,
      twoFactorEnabled: user.twoFactorEnabled,
      canUpload,
      documentTypes: ['national_id', 'passport', 'driving_license'] as const,
      requiredDocuments: {
        primary: 'national_id | passport | driving_license',
        residence: 'required',
      },
      currentRequest: latestVerification
        ? {
            id: latestVerification.id,
            status: latestVerification.status,
            documentType: latestVerification.documentType,
            submittedAt: latestVerification.submittedAt,
            rejectionReason: latestVerification.rejectionReason,
          }
        : null,
    };
  }

  createUploadSession(userId: string) {
    return this.identityUpload.createUploadSession(userId);
  }

  requestPresignedUpload(userId: string, dto: IdentityPresignDto) {
    return this.identityUpload.requestPresignedUpload(
      userId,
      dto.sessionId,
      dto.slot,
      dto.contentType,
      dto.fileName,
      dto.fileSize,
    );
  }

  uploadSlotFile(
    userId: string,
    sessionId: string,
    slot: IdentityDocumentSlot,
    file: Express.Multer.File,
  ) {
    if (!sessionId?.trim()) {
      throw new BadRequestException('جلسة الرفع مطلوبة');
    }
    if (!slot) {
      throw new BadRequestException('نوع الملف غير صالح');
    }
    if (!file) {
      throw new BadRequestException('الملف مطلوب');
    }

    const buffer = file.buffer?.length
      ? file.buffer
      : file.path
        ? readFileSync(file.path)
        : null;

    if (!buffer?.length) {
      throw new BadRequestException('الملف مطلوب');
    }

    return this.identityUpload.uploadSlotFile(
      userId,
      sessionId.trim(),
      slot,
      buffer,
      file.mimetype,
      file.originalname,
    );
  }

  /** JSON/base64 upload — reliable through BFF (no multipart) */
  uploadSlotData(userId: string, dto: IdentityUploadDataDto) {
    if (!dto.sessionId?.trim()) {
      throw new BadRequestException('جلسة الرفع مطلوبة');
    }
    if (!dto.slot || !IDENTITY_UPLOAD_SLOTS.includes(dto.slot)) {
      throw new BadRequestException('نوع الملف غير صالح');
    }
    if (!dto.image?.trim()) {
      throw new BadRequestException('الملف مطلوب');
    }

    const { mime, buffer } = this.parseIdentityImageDataUrl(dto.image);

    return this.identityUpload.uploadSlotFile(
      userId,
      dto.sessionId.trim(),
      dto.slot,
      buffer,
      mime,
      'identity-document.jpg',
    );
  }

  private parseIdentityImageDataUrl(image: string): {
    mime: string;
    buffer: Buffer;
  } {
    const trimmed = image.trim();
    const match = trimmed.match(/^data:([^;]+);base64,([\s\S]+)$/i);
    if (!match) {
      throw new BadRequestException(
        'صورة غير صالحة. استخدم JPEG أو PNG أو WebP',
      );
    }

    const mime = match[1].trim().toLowerCase();
    const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');

    if (!buffer.length) {
      throw new BadRequestException('الملف مطلوب');
    }
    if (buffer.length > IDENTITY_MAX_FILE_BYTES) {
      throw new BadRequestException('حجم الملف يتجاوز الحد المسموح (5 MB)');
    }

    return { mime, buffer };
  }

  async submitVerification(
    userId: string,
    dto: SubmitIdentityDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const documentType = dto.documentType?.trim() as IdentityDocumentType;
    if (
      !['national_id', 'passport', 'driving_license'].includes(documentType)
    ) {
      throw new BadRequestException('نوع المستند غير صالح');
    }

    if (!dto.sessionId?.trim()) {
      throw new BadRequestException('جلسة الرفع مطلوبة');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { verificationLevel: true, twoFactorEnabled: true },
    });

    if (!user?.twoFactorEnabled) {
      throw new BadRequestException(
        'يجب تفعيل المصادقة الثنائية قبل رفع المستندات',
      );
    }

    if (user.verificationLevel >= 3) {
      throw new BadRequestException('هويتك موثّقة بالفعل');
    }

    const pendingRequest = await this.prisma.identityVerification.findFirst({
      where: { userId, status: { in: ['pending', 'underReview'] } },
    });

    if (pendingRequest) {
      throw new BadRequestException('يوجد طلب قيد المراجعة بالفعل');
    }

    const slots = await this.identityUpload.finalizeSessionUploads(
      userId,
      dto.sessionId,
      documentType,
    );

    const verification = await this.prisma.identityVerification.create({
      data: {
        userId,
        documentType,
        documentFrontUrl: slots.primary_front,
        documentBackUrl: slots.primary_back ?? null,
        residenceFrontKey: slots.residence_front,
        residenceBackKey: slots.residence_back,
        selfieUrl: null,
        uploadSessionId: dto.sessionId,
        status: 'pending',
      },
    });

    await this.securityLogService.createLog({
      userId,
      action: 'IDENTITY_VERIFICATION_SUBMITTED' as any,
      status: 'SUCCESS',
      description: `Identity verification submitted (${documentType})`,
      ipAddress,
      userAgent,
      metadata: { verificationId: verification.id },
    });

    return {
      success: true,
      verificationId: verification.id,
      status: 'pending',
      message: 'تم استلام مستنداتك بنجاح وجاري مراجعتها من قبل الإدارة',
    };
  }

  async approveVerification(verificationId: string, adminId: string) {
    const verification = await this.prisma.identityVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (verification.status !== 'pending') {
      throw new BadRequestException(
        `لا يمكن قبول طلب حالته: ${verification.status}`,
      );
    }

    const purgeAt = new Date();
    purgeAt.setDate(purgeAt.getDate() + IDENTITY_DOC_RETENTION_DAYS);

    await this.prisma.$transaction([
      this.prisma.identityVerification.update({
        where: { id: verificationId },
        data: {
          status: 'approved',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          documentsPurgeAt: purgeAt,
        },
      }),
      this.prisma.user.update({
        where: { id: verification.userId },
        data: { verificationLevel: 3 },
      }),
    ]);

    return { success: true, message: 'تم قبول طلب التحقق بنجاح' };
  }

  async rejectVerification(
    verificationId: string,
    adminId: string,
    reason: string,
  ) {
    const verification = await this.prisma.identityVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (verification.status !== 'pending') {
      throw new BadRequestException(
        `لا يمكن رفض طلب حالته: ${verification.status}`,
      );
    }

    const purgeAt = new Date();
    purgeAt.setDate(purgeAt.getDate() + IDENTITY_DOC_RETENTION_DAYS);

    await this.prisma.identityVerification.update({
      where: { id: verificationId },
      data: {
        status: 'rejected',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason?.trim() || 'المستندات غير واضحة أو غير صالحة',
        documentsPurgeAt: purgeAt,
      },
    });

    return { success: true, message: 'تم رفض الطلب' };
  }

  async revokeUserVerification(userId: string, adminId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        emailVerified: true,
        phoneVerified: true,
        verificationLevel: true,
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (user.verificationLevel < 3) {
      throw new BadRequestException('المستخدم غير موثّق بالهوية');
    }

    let verificationLevel = 0;
    if (user.phoneVerified) verificationLevel = 2;
    else if (user.emailVerified) verificationLevel = 1;

    await this.prisma.user.update({
      where: { id: userId },
      data: { verificationLevel },
    });

    await this.securityLogService.createLog({
      userId,
      action: 'IDENTITY_VERIFICATION_REVOKED' as any,
      status: 'SUCCESS',
      description:
        reason?.trim() || 'Admin revoked identity verification for this account',
      metadata: { adminId, previousLevel: user.verificationLevel },
    });

    return {
      success: true,
      message: 'Identity verification revoked',
      verificationLevel,
    };
  }

  async grantUserVerification(
    userId: string,
    adminId: string,
    note?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, verificationLevel: true },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (user.verificationLevel >= 3) {
      throw new BadRequestException('المستخدم موثّق بالهوية بالفعل');
    }

    const adminNote =
      note?.trim() || 'Admin granted identity verification without document review';

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { verificationLevel: 3 },
      });

      const pending = await tx.identityVerification.findFirst({
        where: { userId, status: 'pending' },
        orderBy: { submittedAt: 'desc' },
      });

      if (pending) {
        await tx.identityVerification.update({
          where: { id: pending.id },
          data: {
            status: 'approved',
            reviewedBy: adminId,
            reviewedAt: new Date(),
            rejectionReason: null,
            metadata: {
              adminGrant: true,
              note: adminNote,
            },
          },
        });
      }
    });

    await this.securityLogService.createLog({
      userId,
      action: 'IDENTITY_VERIFICATION_GRANTED' as any,
      status: 'SUCCESS',
      description: adminNote,
      metadata: { adminId, withoutReview: true },
    });

    return {
      success: true,
      message: 'Identity verification granted',
      verificationLevel: 3,
    };
  }

  async getAdminDocumentViewUrl(
    verificationId: string,
    slot: IdentityDocumentSlot,
    adminId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const allowed: IdentityDocumentSlot[] = [
      'primary_front',
      'primary_back',
      'residence_front',
      'residence_back',
      'selfie',
    ];
    if (!allowed.includes(slot)) {
      throw new BadRequestException('Invalid document slot');
    }
    const verification = await this.prisma.identityVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (verification.documentsDeletedAt) {
      throw new BadRequestException('تم حذف مستندات هذا الطلب');
    }

    const field = this.identityUpload.slotToRecordField(slot);
    const key = verification[field] as string | null | undefined;

    if (!key) {
      throw new NotFoundException('المستند غير متوفر');
    }

    await this.securityLogService.createLog({
      userId: verification.userId,
      action: 'IDENTITY_DOC_VIEWED' as any,
      status: 'SUCCESS',
      description: `Admin viewed identity document (${slot})`,
      ipAddress,
      userAgent,
      metadata: { verificationId, adminId, slot },
    });

    const url = await this.identityUpload.getAdminPresignedViewUrl(
      key,
      verification.userId,
      IDENTITY_ADMIN_VIEW_TTL_SECONDS,
    );

    return {
      url,
      expiresIn: IDENTITY_ADMIN_VIEW_TTL_SECONDS,
      slot,
    };
  }

  async purgeExpiredIdentityDocuments(): Promise<number> {
    const now = new Date();
    const due = await this.prisma.identityVerification.findMany({
      where: {
        documentsPurgeAt: { lte: now },
        documentsDeletedAt: null,
        status: { in: ['approved', 'rejected'] },
      },
      take: 50,
    });

    let purged = 0;
    for (const record of due) {
      const keys = this.identityUpload.collectVerificationKeys(record);
      await this.identityUpload.deleteIdentityKeys(keys);

      await this.prisma.identityVerification.update({
        where: { id: record.id },
        data: {
          documentFrontUrl: '',
          documentBackUrl: null,
          residenceFrontKey: null,
          residenceBackKey: null,
          selfieUrl: null,
          documentsDeletedAt: now,
        },
      });
      purged++;
    }

    return purged;
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async scheduledDocumentPurge(): Promise<void> {
    if (process.env.ENABLE_CLEANUP_CRON === 'false') return;
    try {
      const count = await this.purgeExpiredIdentityDocuments();
      if (count > 0) {
        this.logger.log(`Purged identity documents for ${count} verification(s)`);
      }
    } catch (err) {
      this.logger.warn(`Identity document purge failed: ${err}`);
    }
  }
}
