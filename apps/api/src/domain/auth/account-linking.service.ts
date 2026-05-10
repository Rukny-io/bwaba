import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { SecurityLogService } from '../../infrastructure/security/log.service';
import { RedisService } from '../../core/cache/redis.service';
import * as crypto from 'crypto';

/**
 * 🔗 Account Linking Service
 *
 * يدير ربط وإلغاء ربط حسابات OAuth (Google/LinkedIn) بالحساب الحالي.
 *
 * التدفق:
 * 1. المستخدم مسجل دخول → يطلب ربط provider جديد
 * 2. يتم إنشاء state token في Redis مع userId
 * 3. يُوجَّه لـ OAuth provider
 * 4. بعد العودة، يتم ربط providerId بالحساب الحالي
 *
 * الحمايات:
 * - لا يمكن ربط providerId مستخدم بحساب آخر
 * - لا يمكن إلغاء آخر طريقة تسجيل دخول
 * - كل عملية تُسجَّل في SecurityLog
 */

export type OAuthProvider = 'google' | 'linkedin';

export interface LinkedProvidersResult {
  google: { linked: boolean; email?: string };
  linkedin: { linked: boolean; email?: string };
  quicksign: { available: boolean; email: string };
  canUnlinkGoogle: boolean;
  canUnlinkLinkedin: boolean;
}

export interface LinkingStatePayload {
  userId: string;
  provider: OAuthProvider;
  createdAt: number;
}

@Injectable()
export class AccountLinkingService {
  private readonly LINKING_STATE_TTL = 600; // 10 minutes
  private readonly LINKING_STATE_PREFIX = 'account_link:';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private securityLogService: SecurityLogService,
    private redis: RedisService,
  ) {}

  /**
   * 📋 عرض الـ providers المربوطة للمستخدم
   */
  async getLinkedProviders(userId: string): Promise<LinkedProvidersResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        googleId: true,
        linkedinId: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new BadRequestException('المستخدم غير موجود');
    }

    const linkedCount = [user.googleId, user.linkedinId].filter(Boolean).length;
    const hasQuickSign = user.emailVerified;

    return {
      google: {
        linked: !!user.googleId,
        email: user.googleId ? user.email : undefined,
      },
      linkedin: {
        linked: !!user.linkedinId,
        email: user.linkedinId ? user.email : undefined,
      },
      quicksign: {
        available: hasQuickSign,
        email: user.email,
      },
      // يمكن إلغاء الربط فقط إذا بقيت طريقة أخرى
      canUnlinkGoogle: !!user.googleId && (!!user.linkedinId || hasQuickSign),
      canUnlinkLinkedin: !!user.linkedinId && (!!user.googleId || hasQuickSign),
    };
  }

  /**
   * 🔗 بدء عملية ربط provider — إنشاء state token في Redis
   */
  async initiateLinking(
    userId: string,
    provider: OAuthProvider,
  ): Promise<string> {
    // التحقق من أن المستخدم موجود وأن الـ provider غير مربوط
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { googleId: true, linkedinId: true },
    });

    if (!user) {
      throw new BadRequestException('المستخدم غير موجود');
    }

    if (provider === 'google' && user.googleId) {
      throw new ConflictException('حساب Google مربوط بالفعل');
    }

    if (provider === 'linkedin' && user.linkedinId) {
      throw new ConflictException('حساب LinkedIn مربوط بالفعل');
    }

    // إنشاء state token فريد
    const stateToken = crypto.randomBytes(32).toString('hex');
    const key = `${this.LINKING_STATE_PREFIX}${stateToken}`;

    const payload: LinkingStatePayload = {
      userId,
      provider,
      createdAt: Date.now(),
    };

    await this.redis.setex(key, this.LINKING_STATE_TTL, JSON.stringify(payload));

    return stateToken;
  }

  /**
   * ✅ إتمام الربط بعد OAuth callback
   */
  async completeLinking(
    stateToken: string,
    providerData: {
      providerId: string;
      email: string;
      name?: string;
      avatar?: string;
    },
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; provider: OAuthProvider }> {
    // 1. استرجاع state من Redis
    const key = `${this.LINKING_STATE_PREFIX}${stateToken}`;
    const rawPayload = await this.redis.get<string>(key);

    if (!rawPayload) {
      throw new BadRequestException(
        'انتهت صلاحية طلب الربط. يرجى المحاولة مرة أخرى.',
      );
    }

    // حذف فوري (single-use)
    await this.redis.del(key);

    const payload: LinkingStatePayload = JSON.parse(rawPayload);
    const { userId, provider } = payload;

    // 2. التحقق من أن الـ providerId ليس مستخدم بحساب آخر
    const existingUser = await this.findUserByProviderId(
      provider,
      providerData.providerId,
    );

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException(
        `حساب ${provider === 'google' ? 'Google' : 'LinkedIn'} هذا مربوط بحساب آخر بالفعل.`,
      );
    }

    // 3. ربط الـ provider بالحساب
    const updateData: Record<string, string> = {};
    if (provider === 'google') {
      updateData.googleId = providerData.providerId;
    } else {
      updateData.linkedinId = providerData.providerId;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true },
    });

    // 4. تسجيل SecurityLog
    await this.securityLogService.createLog({
      userId,
      action: 'PROVIDER_LINKED' as any,
      status: 'SUCCESS',
      description: `تم ربط حساب ${provider === 'google' ? 'Google' : 'LinkedIn'} بنجاح`,
      ipAddress,
      userAgent,
      metadata: { provider, providerEmail: providerData.email },
    });

    return { success: true, provider };
  }

  /**
   * ❌ إلغاء ربط provider
   */
  async unlinkProvider(
    userId: string,
    provider: OAuthProvider,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ success: boolean }> {
    // 1. التحقق من إمكانية إلغاء الربط
    const canUnlink = await this.canUnlink(userId, provider);
    if (!canUnlink) {
      throw new ForbiddenException(
        'لا يمكن إلغاء ربط آخر طريقة تسجيل دخول. أضف طريقة أخرى أولاً.',
      );
    }

    // 2. التحقق من أن الـ provider مربوط فعلاً
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { googleId: true, linkedinId: true },
    });

    if (!user) {
      throw new BadRequestException('المستخدم غير موجود');
    }

    if (provider === 'google' && !user.googleId) {
      throw new BadRequestException('حساب Google غير مربوط');
    }
    if (provider === 'linkedin' && !user.linkedinId) {
      throw new BadRequestException('حساب LinkedIn غير مربوط');
    }

    // 3. إلغاء الربط
    const updateData: Record<string, null> = {};
    if (provider === 'google') {
      updateData.googleId = null;
    } else {
      updateData.linkedinId = null;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true },
    });

    // 4. تسجيل SecurityLog
    await this.securityLogService.createLog({
      userId,
      action: 'PROVIDER_UNLINKED' as any,
      status: 'WARNING',
      description: `تم إلغاء ربط حساب ${provider === 'google' ? 'Google' : 'LinkedIn'}`,
      ipAddress,
      userAgent,
      metadata: { provider },
    });

    return { success: true };
  }

  /**
   * 🔍 البحث عن مستخدم بـ providerId
   */
  private async findUserByProviderId(
    provider: OAuthProvider,
    providerId: string,
  ): Promise<{ id: string } | null> {
    if (provider === 'google') {
      return this.prisma.user.findUnique({
        where: { googleId: providerId },
        select: { id: true },
      });
    }
    return this.prisma.user.findUnique({
      where: { linkedinId: providerId },
      select: { id: true },
    });
  }

  /**
   * 🔒 التحقق من إمكانية إلغاء الربط
   * يجب أن تبقى طريقة تسجيل دخول واحدة على الأقل
   */
  private async canUnlink(
    userId: string,
    provider: OAuthProvider,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleId: true,
        linkedinId: true,
        emailVerified: true,
      },
    });

    if (!user) return false;

    // عدّ طرق تسجيل الدخول المتاحة
    let methodCount = 0;
    if (user.googleId) methodCount++;
    if (user.linkedinId) methodCount++;
    if (user.emailVerified) methodCount++; // QuickSign

    // يمكن الإلغاء فقط إذا بقيت طريقة أخرى بعد الإلغاء
    return methodCount > 1;
  }

  /**
   * 🔍 التحقق من صلاحية state token (للـ callback)
   */
  async validateLinkingState(
    stateToken: string,
  ): Promise<LinkingStatePayload | null> {
    const key = `${this.LINKING_STATE_PREFIX}${stateToken}`;
    const rawPayload = await this.redis.get<string>(key);
    if (!rawPayload) return null;
    return JSON.parse(rawPayload);
  }
}
