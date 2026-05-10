import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { SecurityLogService } from '../../infrastructure/security/log.service';

export interface SubmitIdentityDto {
  documentType: 'national_id' | 'passport' | 'driving_license';
  documentFrontUrl: string; // pre-uploaded to S3 temporarily or directly here
  documentBackUrl?: string;
  selfieUrl?: string;
}

@Injectable()
export class IdentityVerificationService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private securityLogService: SecurityLogService,
  ) {}

  /**
   * 📋 الحصول على حالة التحقق الحالية
   */
  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { verificationLevel: true },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const latestVerification = await this.prisma.identityVerification.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });

    return {
      verificationLevel: user.verificationLevel,
      currentRequest: latestVerification ? {
        id: latestVerification.id,
        status: latestVerification.status,
        documentType: latestVerification.documentType,
        submittedAt: latestVerification.submittedAt,
        rejectionReason: latestVerification.rejectionReason,
      } : null,
    };
  }

  /**
   * 📤 رفع طلب تحقق جديد
   */
  async submitVerification(
    userId: string,
    dto: SubmitIdentityDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 1. التحقق من أنه لا يوجد طلب معلق
    const pendingRequest = await this.prisma.identityVerification.findFirst({
      where: { userId, status: 'pending' },
    });

    if (pendingRequest) {
      throw new BadRequestException('يوجد طلب قيد المراجعة بالفعل');
    }

    // 2. إنشاء الطلب
    const verification = await this.prisma.identityVerification.create({
      data: {
        userId,
        documentType: dto.documentType,
        documentFrontUrl: dto.documentFrontUrl,
        documentBackUrl: dto.documentBackUrl,
        selfieUrl: dto.selfieUrl,
        status: 'pending',
      },
    });

    // 3. تسجيل الحدث
    await this.securityLogService.createLog({
      userId,
      action: 'IDENTITY_VERIFICATION_SUBMITTED' as any,
      status: 'SUCCESS',
      description: `تم تقديم طلب تحقق من الهوية بنوع: ${dto.documentType}`,
      ipAddress,
      userAgent,
      metadata: { verificationId: verification.id },
    });

    return {
      success: true,
      verificationId: verification.id,
      status: 'pending',
      message: 'تم استلام طلبك بنجاح وجاري مراجعته',
    };
  }

  /**
   * 👑 (للمشرفين) قبول الطلب
   */
  async approveVerification(verificationId: string, adminId: string) {
    const verification = await this.prisma.identityVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (verification.status !== 'pending') {
      throw new BadRequestException(`لا يمكن قبول طلب حالته: ${verification.status}`);
    }

    // تحديث حالة الطلب
    await this.prisma.identityVerification.update({
      where: { id: verificationId },
      data: {
        status: 'approved',
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    // ترقية مستوى حساب المستخدم
    await this.prisma.user.update({
      where: { id: verification.userId },
      data: { verificationLevel: 3 }, // مستوى 3 = هوية مثبتة بالمستندات
    });

    return { success: true, message: 'تم قبول طلب التحقق بنجاح' };
  }

  /**
   * 👑 (للمشرفين) رفض الطلب
   */
  async rejectVerification(verificationId: string, adminId: string, reason: string) {
    const verification = await this.prisma.identityVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (verification.status !== 'pending') {
      throw new BadRequestException(`لا يمكن رفض طلب حالته: ${verification.status}`);
    }

    await this.prisma.identityVerification.update({
      where: { id: verificationId },
      data: {
        status: 'rejected',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    return { success: true, message: 'تم رفض الطلب' };
  }
}
