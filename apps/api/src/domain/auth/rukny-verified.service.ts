import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { SecurityLogService } from '../../infrastructure/security/log.service';
import { CacheManager } from '../../core/cache/cache.manager';
import { RedisService } from '../../core/cache/redis.service';

export type RuknyVerifiedCategory = 'personal' | 'business' | 'creator';

export interface SubmitRuknyVerifiedDto {
  category: RuknyVerifiedCategory;
  displayName: string;
  publicBio: string;
  websiteUrl?: string;
  socialLinks?: {
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
    website?: string;
  };
}

@Injectable()
export class RuknyVerifiedService {
  constructor(
    private prisma: PrismaService,
    private securityLogService: SecurityLogService,
    private cacheManager: CacheManager,
    private redisService: RedisService,
  ) {}

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isRuknyVerified: true,
        ruknyVerifiedAt: true,
        verifiedCategory: true,
        verifiedDisplayName: true,
        emailVerified: true,
        phone: true,
        twoFactorEnabled: true,
        verificationLevel: true,
        profile: {
          select: { name: true, username: true, avatar: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (user.isRuknyVerified) {
      return {
        status: 'verified' as const,
        verifiedAt: user.ruknyVerifiedAt,
        verifiedCategory: user.verifiedCategory,
        verifiedDisplayName: user.verifiedDisplayName,
        canApply: false,
        eligibility: this.buildEligibility(user),
      };
    }

    const latest = await this.prisma.ruknyVerifiedApplication.findFirst({
      where: { userId },
      orderBy: { submittedAt: 'desc' },
    });

    if (latest?.status === 'pending') {
      return {
        status: 'pending' as const,
        application: {
          id: latest.id,
          category: latest.category,
          displayName: latest.displayName,
          submittedAt: latest.submittedAt,
        },
        canApply: false,
        eligibility: this.buildEligibility(user),
      };
    }

    if (latest?.status === 'rejected') {
      return {
        status: 'rejected' as const,
        rejectionReason: latest.rejectionReason,
        canApply: this.buildEligibility(user).canApply,
        eligibility: this.buildEligibility(user),
      };
    }

    return {
      status: 'none' as const,
      canApply: this.buildEligibility(user).canApply,
      eligibility: this.buildEligibility(user),
    };
  }

  async submitApplication(
    userId: string,
    dto: SubmitRuknyVerifiedDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        isRuknyVerified: true,
        emailVerified: true,
        phone: true,
        twoFactorEnabled: true,
        verificationLevel: true,
        profile: {
          select: { name: true, username: true, avatar: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (user.isRuknyVerified) {
      throw new BadRequestException('حسابك موثّق بالفعل');
    }

    const pending = await this.prisma.ruknyVerifiedApplication.findFirst({
      where: { userId, status: 'pending' },
    });

    if (pending) {
      throw new BadRequestException('لديك طلب قيد المراجعة بالفعل');
    }

    const eligibility = this.buildEligibility(user);
    if (!eligibility.canApply) {
      throw new BadRequestException(
        'أكمل جميع المتطلبات وانتظر موافقة الإدارة قبل تقديم الطلب',
      );
    }

    const category = dto.category?.trim();
    if (!['personal', 'business', 'creator'].includes(category)) {
      throw new BadRequestException('نوع التوثيق غير صالح');
    }

    const displayName = dto.displayName?.trim();
    const publicBio = dto.publicBio?.trim();

    if (!displayName || displayName.length < 2) {
      throw new BadRequestException('الاسم المعتمد مطلوب');
    }

    if (!publicBio || publicBio.length < 20) {
      throw new BadRequestException('يرجى كتابة وصف يوضح سبب طلب التوثيق');
    }

    const application = await this.prisma.ruknyVerifiedApplication.create({
      data: {
        userId,
        category,
        displayName,
        publicBio,
        websiteUrl: dto.websiteUrl?.trim() || null,
        socialLinks: dto.socialLinks ?? undefined,
        status: 'pending',
      },
    });

    await this.securityLogService.createLog({
      userId,
      action: 'RUKNY_VERIFIED_APPLIED' as any,
      status: 'SUCCESS',
      description: `Rukny Verified application submitted (${category})`,
      ipAddress,
      userAgent,
      metadata: { applicationId: application.id },
    });

    return {
      success: true,
      applicationId: application.id,
      status: 'pending',
      message: 'تم استلام طلبك وسيتم مراجعته قريباً',
    };
  }

  async approveApplication(applicationId: string, adminId: string) {
    const application = await this.prisma.ruknyVerifiedApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (application.status !== 'pending') {
      throw new BadRequestException(`لا يمكن قبول طلب بحالة: ${application.status}`);
    }

    await this.prisma.$transaction([
      this.prisma.ruknyVerifiedApplication.update({
        where: { id: applicationId },
        data: {
          status: 'approved',
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      }),
      this.prisma.user.update({
        where: { id: application.userId },
        data: {
          isRuknyVerified: true,
          ruknyVerifiedAt: new Date(),
          verifiedCategory: application.category,
          verifiedDisplayName: application.displayName,
        },
      }),
    ]);

    const profile = await this.prisma.profile.findUnique({
      where: { userId: application.userId },
      select: { username: true },
    });
    if (profile?.username) {
      await this.cacheManager.invalidate(`profile:username:${profile.username}`);
    }
    await this.redisService.del(`user:profile:${application.userId}`);

    return { success: true, message: 'تم قبول طلب Rukny Verified' };
  }

  async rejectApplication(
    applicationId: string,
    adminId: string,
    reason: string,
  ) {
    const application = await this.prisma.ruknyVerifiedApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (application.status !== 'pending') {
      throw new BadRequestException(`لا يمكن رفض طلب بحالة: ${application.status}`);
    }

    await this.prisma.ruknyVerifiedApplication.update({
      where: { id: applicationId },
      data: {
        status: 'rejected',
        rejectionReason: reason?.trim() || 'لم يستوفِ متطلبات التوثيق',
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    return { success: true, message: 'تم رفض طلب Rukny Verified' };
  }

  async grantVerifiedStatus(
    userId: string,
    adminId: string,
    dto: {
      category: RuknyVerifiedCategory;
      displayName: string;
      publicBio?: string;
      note?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isRuknyVerified: true,
        profile: { select: { name: true, username: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (user.isRuknyVerified) {
      throw new BadRequestException('المستخدم حاصل على Rukny Verified بالفعل');
    }

    const displayName = dto.displayName?.trim();
    if (!displayName) {
      throw new BadRequestException('اسم العرض مطلوب');
    }

    const allowed: RuknyVerifiedCategory[] = ['personal', 'business', 'creator'];
    if (!allowed.includes(dto.category)) {
      throw new BadRequestException('فئة التوثيق غير صالحة');
    }

    const adminNote =
      dto.note?.trim() || 'Admin granted Rukny Verified without application review';

    await this.prisma.$transaction([
      this.prisma.ruknyVerifiedApplication.create({
        data: {
          userId,
          category: dto.category,
          displayName,
          publicBio: dto.publicBio?.trim() || adminNote,
          status: 'approved',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: null,
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          isRuknyVerified: true,
          ruknyVerifiedAt: new Date(),
          verifiedCategory: dto.category,
          verifiedDisplayName: displayName,
        },
      }),
    ]);

    if (user.profile?.username) {
      await this.cacheManager.invalidate(`profile:username:${user.profile.username}`);
    }
    await this.redisService.del(`user:profile:${userId}`);

    await this.securityLogService.createLog({
      userId,
      action: 'SECURITY_SETTINGS_CHANGED' as any,
      status: 'SUCCESS',
      description: `Rukny Verified granted (${dto.category}): ${displayName}. ${adminNote}`,
      metadata: { adminId, category: dto.category, withoutReview: true },
    });

    return { success: true, message: 'Rukny Verified granted' };
  }

  async revokeVerifiedStatus(userId: string, adminId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isRuknyVerified: true,
        profile: { select: { username: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    if (!user.isRuknyVerified) {
      throw new BadRequestException('المستخدم غير موثّق Rukny Verified');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isRuknyVerified: false,
        ruknyVerifiedAt: null,
        verifiedCategory: null,
        verifiedDisplayName: null,
      },
    });

    if (user.profile?.username) {
      await this.cacheManager.invalidate(`profile:username:${user.profile.username}`);
    }
    await this.redisService.del(`user:profile:${userId}`);

    await this.securityLogService.createLog({
      userId,
      action: 'SECURITY_SETTINGS_CHANGED' as any,
      status: 'SUCCESS',
      description:
        reason?.trim() || 'Admin revoked Rukny Verified status',
      metadata: { adminId },
    });

    return { success: true, message: 'Rukny Verified revoked' };
  }

  async listApplications(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [data, total] = await Promise.all([
      this.prisma.ruknyVerifiedApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              isRuknyVerified: true,
              profile: { select: { name: true, username: true } },
            },
          },
        },
      }),
      this.prisma.ruknyVerifiedApplication.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private buildEligibility(user: {
    emailVerified: boolean;
    phone: string | null;
    twoFactorEnabled: boolean;
    verificationLevel: number;
    profile: { name: string | null; username: string | null; avatar: string | null } | null;
  }) {
    const email = user.emailVerified;
    const phone = Boolean(user.phone?.trim());
    const profile =
      Boolean(user.profile?.name?.trim()) &&
      Boolean(user.profile?.username?.trim()) &&
      Boolean(user.profile?.avatar);
    const twoFactor = user.twoFactorEnabled;
    const identity = user.verificationLevel >= 3;

    return {
      email,
      phone,
      profile,
      twoFactor,
      identity,
      canApply: email && phone && profile && twoFactor && identity,
    };
  }
}
