import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { SecurityLogService } from '../../infrastructure/security/log.service';
import { SecurityDetectorService } from '../../infrastructure/security/detector.service';
import { AnomalyDetectionService } from '../../infrastructure/security/anomaly-detection.service';
import { ThreatAlertService } from '../../infrastructure/security/threat-alert.service';
import * as crypto from 'crypto';
import { UAParser } from 'ua-parser-js';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { AccountLockoutService } from './account-lockout.service';
import { IpVerificationService } from './ip-verification.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

/**
 * 🔒 Auth Service
 *
 * خدمة المصادقة الرئيسية
 * تتعامل مع OAuth (Google/LinkedIn) وإدارة الجلسات
 *
 * ملاحظة أمنية:
 * - إنشاء الجلسات يتم في TokenService.generateTokenPair() فقط
 * - لا يتم ربط OAuth بحساب موجود تلقائياً عبر البريد — يتطلب تأكيد المستخدم
 */

export interface AuthResult {
  user: {
    id: string;
    email: string;
    role: string;
    name?: string;
    username?: string;
    avatar?: string;
  };
  needsProfileCompletion: boolean;
  /**
   * true إذا وُجد حساب بنفس البريد بدون ربط OAuth.
   * في هذه الحالة لا يتم إنشاء جلسة — المستخدم يحتاج لتأكيد الربط.
   */
  requiresLinking?: boolean;
  /**
   * true إذا اكتشف نظام كشف الشذوذ نشاطاً مشبوهاً يتطلب تحقق إضافي
   */
  requiresChallenge?: boolean;
  challengeReasons?: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private securityLogService: SecurityLogService,
    private securityDetectorService: SecurityDetectorService,
    private anomalyDetectionService: AnomalyDetectionService,
    private threatAlertService: ThreatAlertService,
    private notificationsGateway: NotificationsGateway,
    private accountLockoutService: AccountLockoutService,
    private ipVerificationService: IpVerificationService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: {
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.profile?.name,
      username: user.profile?.username,
      avatar: user.profile?.avatar,
    };
  }

  /**
   * 🔒 Shared OAuth login logic for all providers
   *
   * 🔒 الأمان:
   * - البحث يتم أولاً بـ providerId فقط
   * - إذا وُجد حساب بنفس البريد بدون ربط: لا نربط تلقائياً — نُعيد requiresLinking: true
   * - إنشاء الجلسة يتم لاحقاً في /oauth/exchange عبر TokenService (لضمان enforceMaxActiveSessions)
   */
  private async oauthLogin(
    provider: 'google' | 'linkedin',
    providerUser: { providerId: string; email: string; name: string; avatar: string | null },
    userAgent?: string,
    ipAddress?: string,
  ): Promise<AuthResult> {
    const { providerId, email, name, avatar } = providerUser;
    const providerIdField = provider === 'google' ? 'googleId' : 'linkedinId';
    const providerLabel = provider === 'google' ? 'Google' : 'LinkedIn';

    // 1. البحث بـ providerId أولاً (الأسلوب الآمن الوحيد)
    let user = await this.prisma.user.findFirst({
      where: { [providerIdField]: providerId },
      include: { profile: true },
    });

    // 2. إذا لم يوجد بالـ provider ID — تحقق من البريد الإلكتروني
    if (!user) {
      const emailUser = await this.prisma.user.findFirst({
        where: { email },
        include: { profile: true },
      });

      if (emailUser) {
        // 🔒 وُجد حساب بنفس البريد لكن بدون ربط هذا الـ provider
        // لا نربط تلقائياً — نُعيد علامة تطلب تأكيد المستخدم
        await this.securityLogService.createLog({
          userId: emailUser.id,
          action: 'SUSPICIOUS_ACTIVITY',
          status: 'WARNING',
          description: `محاولة ربط ${providerLabel} بحساب موجود عبر البريد بدون تأكيد المستخدم`,
          ipAddress,
          userAgent,
        });

        return {
          user: {
            id: emailUser.id,
            email: emailUser.email,
            role: emailUser.role,
            name: emailUser.profile?.name,
            username: emailUser.profile?.username,
            avatar: emailUser.profile?.avatar,
          },
          needsProfileCompletion: !emailUser.profileCompleted,
          requiresLinking: true,
        };
      }
    }

    // 3. إنشاء مستخدم جديد إذا لم يوجد
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email,
          [providerIdField]: providerId,
          emailVerified: true,
          profileCompleted: false,
          profile: {
            create: {
              id: crypto.randomUUID(),
              username:
                email.split('@')[0] +
                '_' +
                crypto.randomBytes(3).toString('hex'),
              name,
              avatar,
            },
          },
        },
        include: { profile: true },
      });

      // إنشاء اشتراك مجاني للمستخدم الجديد
      await this.subscriptionsService.createFreeSubscription(user.id);
    }

    // 4. 🔍 تحليل تسجيل الدخول للكشف عن الأنشطة المشبوهة
    const parser = new UAParser(userAgent);
    const deviceInfo = parser.getResult();

    const anomaly = await this.anomalyDetectionService.analyzeLogin(user.id, {
      ipAddress: ipAddress || 'unknown',
      userAgent,
      deviceFingerprint: `${deviceInfo.browser.name}:${deviceInfo.os.name}:${deviceInfo.device.type || 'desktop'}`,
    });

    // 🚨 إرسال تنبيهات فورية للتهديدات عالية الخطورة
    if (anomaly.suspicious && anomaly.riskScore >= 40) {
      await this.threatAlertService.alertSuspiciousLogin(
        user.id,
        anomaly.reasons,
        anomaly.riskScore,
        ipAddress,
      );
    }

    // 🔒 إذا كان النشاط مشبوهاً جداً — يتطلب تحقق إضافي (2FA إجباري)
    if (anomaly.action === 'challenge') {
      await this.securityLogService.createLog({
        userId: user.id,
        action: 'SUSPICIOUS_ACTIVITY',
        status: 'WARNING',
        description: `تسجيل دخول مشبوه (خطورة: ${anomaly.riskScore}%) — يتطلب تحقق إضافي: ${anomaly.reasons.join('، ')}`,
        ipAddress,
        userAgent,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.profile?.name,
          username: user.profile?.username,
          avatar: user.profile?.avatar,
        },
        needsProfileCompletion: !user.profileCompleted,
        requiresChallenge: true,
        challengeReasons: anomaly.reasons,
      };
    }

    // 🔒 إذا كان مستوى الخطر عالٍ جداً — حظر تسجيل الدخول
    if (anomaly.action === 'block') {
      await this.securityLogService.createLog({
        userId: user.id,
        action: 'LOGIN_FAILED',
        status: 'FAILED',
        description: `تم حظر تسجيل الدخول — نشاط مشبوه (خطورة: ${anomaly.riskScore}%): ${anomaly.reasons.join('، ')}`,
        ipAddress,
        userAgent,
      });

      // لا نُعيد خطأ صريح — نُعيد كما لو يتطلب تحقق
      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.profile?.name,
          username: user.profile?.username,
          avatar: user.profile?.avatar,
        },
        needsProfileCompletion: !user.profileCompleted,
        requiresChallenge: true,
        challengeReasons: ['تم اكتشاف نشاط غير اعتيادي. يرجى التحقق من هويتك.'],
      };
    }

    // 5. تسجيل الدخول الناجح + إشعارات (بدون إنشاء جلسة — يتم في /oauth/exchange)
    await this.securityLogService.createLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      status: 'SUCCESS',
      description: `تسجيل دخول ناجح عبر ${providerLabel}`,
      ipAddress,
      deviceType: deviceInfo.device.type || 'desktop',
      browser: deviceInfo.browser.name || 'Unknown',
      os: deviceInfo.os.name || 'Unknown',
      userAgent,
    });

    await this.securityDetectorService.checkNewDevice(user.id, {
      browser: deviceInfo.browser.name,
      os: deviceInfo.os.name,
      deviceType: deviceInfo.device.type || 'desktop',
      ipAddress,
      userAgent,
    });

    try {
      await this.notificationsGateway.sendNotification({
        userId: user.id,
        type: 'NEW_LOGIN' as any,
        title: 'تسجيل دخول جديد',
        message: `تم تسجيل الدخول إلى حسابك من ${deviceInfo.browser.name || 'متصفح غير معروف'} على ${deviceInfo.os.name || 'جهاز غير معروف'}`,
        data: {
          browser: deviceInfo.browser.name || 'Unknown',
          os: deviceInfo.os.name || 'Unknown',
          deviceType: deviceInfo.device.type || 'desktop',
        },
      });
    } catch {
      // Non-critical — don't fail login for a notification error
    }

    await this.accountLockoutService.recordSuccessfulAttempt(user.email, ipAddress);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.profile?.name,
        username: user.profile?.username,
        avatar: user.profile?.avatar,
      },
      needsProfileCompletion: !user.profileCompleted,
    };
  }

  async googleLogin(googleUser: any, userAgent?: string, ipAddress?: string) {
    return this.oauthLogin(
      'google',
      {
        providerId: googleUser.googleId,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.avatar,
      },
      userAgent,
      ipAddress,
    );
  }

  async linkedinLogin(linkedinUser: any, userAgent?: string, ipAddress?: string) {
    return this.oauthLogin(
      'linkedin',
      {
        providerId: linkedinUser.linkedinId,
        email: linkedinUser.email,
        name: linkedinUser.name,
        avatar: linkedinUser.avatar,
      },
      userAgent,
      ipAddress,
    );
  }

  /**
   * 🔒 تسجيل الخروج - إبطال الجلسة بدلاً من حذفها
   * يقبل توكن منتهي الصلاحية لاستخراج sessionId وإبطال الجلسة
   */
  async logout(token: string, userId?: string) {
    try {
      let sessionId: string | undefined;
      try {
        const decoded = this.jwtService.decode(token) as { sid?: string } | null;
        sessionId = decoded?.sid;
      } catch {
        // ignore
      }

      if (!sessionId) {
        return { message: 'Logged out successfully' };
      }

      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (session && !session.isRevoked) {
        await this.prisma.session.update({
          where: { id: sessionId },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
            revokedReason: 'User logout',
          },
        });

        await this.securityLogService.createLog({
          userId: session.userId,
          action: 'LOGOUT',
          status: 'SUCCESS',
          description: 'تسجيل خروج',
          ipAddress: session.ipAddress,
          deviceType: session.deviceType,
          browser: session.browser,
          os: session.os,
        });
      }

      return { message: 'Logged out successfully' };
    } catch {
      return { message: 'Logged out successfully' };
    }
  }
}
