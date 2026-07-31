import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../core/cache/redis.service';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import * as crypto from 'crypto';

/**
 * 🔐 Two-Factor Authentication Service
 *
 * خدمة المصادقة الثنائية باستخدام TOTP (Time-based One-Time Password)
 * متوافق مع Google Authenticator, Microsoft Authenticator, Authy وغيرها
 *
 * الميزات:
 * - إنشاء مفتاح سري فريد لكل مستخدم
 * - توليد QR Code للتطبيقات
 * - التحقق من رموز OTP
 * - رموز احتياطية للاسترداد
 * - تشفير المفاتيح في قاعدة البيانات
 */

export interface TwoFactorSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export interface TwoFactorVerifyResult {
  valid: boolean;
  usedBackupCode?: boolean;
}

@Injectable()
export class TwoFactorService {
  private readonly APP_NAME = 'Rukny';
  private readonly ENCRYPTION_KEY: Buffer;
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private redis: RedisService,
  ) {
    // 🔒 F-04: مفتاح التشفير يجب أن يكون 32 bytes مُرمّزة كـ 64 hex character بالضبط.
    // لا نقبل مفاتيح نصية ضعيفة (entropy منخفض) بعد الآن.
    const key = this.configService.get<string>('TWO_FACTOR_ENCRYPTION_KEY');

    if (!key) {
      throw new Error(
        '❌ TWO_FACTOR_ENCRYPTION_KEY is required. ' +
          'Generate one with: openssl rand -hex 32',
      );
    }

    if (!/^[0-9a-fA-F]{64}$/.test(key)) {
      throw new Error(
        '❌ TWO_FACTOR_ENCRYPTION_KEY must be exactly 64 hex characters (32 random bytes). ' +
          'Generate one with: openssl rand -hex 32',
      );
    }

    this.ENCRYPTION_KEY = Buffer.from(key, 'hex');
  }

  /**
   * 🔒 F-05: pepper (keyed hash) للرموز الاحتياطية.
   * نستخدم HMAC-SHA256 بمفتاح سرّي بدلاً من SHA-256 غير المملّح حتى يبقى
   * البحث بالـ hash ممكناً مع منع هجمات القاموس على تسريب قاعدة البيانات.
   */
  private hashBackupCode(normalizedCode: string): string {
    return crypto
      .createHmac('sha256', this.ENCRYPTION_KEY)
      .update(normalizedCode)
      .digest('hex');
  }

  /**
   * 🔐 تشفير المفتاح السري
   */
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.ENCRYPTION_ALGORITHM,
      this.ENCRYPTION_KEY, // 🔒 استخدام Buffer مباشرة
      iv,
    );

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // تنسيق: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * 🔓 فك تشفير المفتاح السري
   * يدعم كلا التنسيقين: المشفر (iv:authTag:encrypted) والقديم (base32 مباشر)
   */
  private decrypt(encryptedText: string): string {
    if (!encryptedText || typeof encryptedText !== 'string') {
      throw new BadRequestException('المفتاح السري غير موجود أو غير صالح');
    }

    const parts = encryptedText.split(':');

    // 🔒 F-04: لا نقبل الأسرار غير المشفّرة (base32 مباشر) بعد الآن.
    // أي سر ليس بالتنسيق iv:authTag:ciphertext يُعتبر غير صالح ويجب على
    // المستخدم إعادة إعداد 2FA. هذا يمنع هجوم downgrade عبر كتابة سر معروف في DB.
    if (parts.length !== 3) {
      throw new BadRequestException(
        'تنسيق المفتاح السري غير صالح. يرجى إعادة إعداد المصادقة الثنائية.',
      );
    }

    const [ivHex, authTagHex, encrypted] = parts;

    try {
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv(
        this.ENCRYPTION_ALGORITHM,
        this.ENCRYPTION_KEY, // 🔒 استخدام Buffer مباشرة
        iv,
      );

      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new BadRequestException('فشل في فك تشفير المفتاح السري');
    }
  }

  /**
   * 🎲 توليد رموز احتياطية
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // 🔒 F-05: 8 bytes = 64-bit entropy (16 hex chars) بدلاً من 32-bit
      const code = crypto.randomBytes(8).toString('hex').toUpperCase();
      // تنسيق: XXXX-XXXX-XXXX-XXXX
      codes.push(code.replace(/(.{4})(?=.)/g, '$1-'));
    }
    return codes;
  }

  /**
   * 🔒 F-05: تجزئة الرموز الاحتياطية باستخدام HMAC (keyed hash) بدلاً من SHA-256 عادي
   */
  private hashBackupCodes(codes: string[]): string[] {
    return codes.map((code) =>
      this.hashBackupCode(code.replace(/[-\s]/g, '').toUpperCase()),
    );
  }

  /**
   * 📱 إعداد المصادقة الثنائية (الخطوة 1)
   *
   * ينشئ مفتاحاً سرياً جديداً و QR Code
   * لا يتم تفعيل 2FA حتى يتم التحقق من الرمز
   */
  async generateSetup(userId: string): Promise<TwoFactorSetupResult> {
    // التحقق من المستخدم
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        profile: {
          select: { username: true },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('المستخدم غير موجود');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException(
        'المصادقة الثنائية مفعلة بالفعل. قم بإلغاء التفعيل أولاً',
      );
    }

    // Idempotent: return the existing pending setup instead of rotating secrets.
    if (user.twoFactorSecret) {
      try {
        const secret = this.decrypt(user.twoFactorSecret);
        const otpauthUrl = generateURI({
          issuer: this.APP_NAME,
          label: user.email,
          secret,
        });
        const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
        const backupCodes = await this.readPendingBackupCodes(userId);

        return {
          secret,
          qrCodeUrl,
          backupCodes,
          manualEntryKey: secret,
        };
      } catch {
        // Secret is corrupt — fall through and issue a fresh setup.
      }
    }

    // إنشاء مفتاح سري جديد باستخدام otplib
    const secret = generateSecret(); // توليد مفتاح base32
    const otpauthUrl = generateURI({
      issuer: this.APP_NAME,
      label: user.email,
      secret,
    });

    // توليد QR Code
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // توليد رموز احتياطية
    const backupCodes = this.generateBackupCodes(10);

    // حفظ المفتاح المشفر مؤقتاً (pending)
    // سيتم تفعيله عند التحقق من أول رمز
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: this.encrypt(secret),
        // لا نفعّل حتى يتم التحقق
        twoFactorEnabled: false,
      },
      select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
    });

    // حفظ الرموز الاحتياطية المشفرة
    await this.saveBackupCodes(userId, backupCodes);

    // احتفاظ مؤقت بالرموز الأصلية حتى يُفعّل المستخدم 2FA
    await this.cachePendingBackupCodes(userId, backupCodes);

    return {
      secret: secret,
      qrCodeUrl,
      backupCodes,
      manualEntryKey: secret, // للإدخال اليدوي
    };
  }

  /**
   * ✅ التحقق من رمز OTP وتفعيل 2FA (الخطوة 2)
   */
  async verifyAndEnable(
    userId: string,
    token: string,
  ): Promise<{ success: boolean; backupCodes: string[] }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new BadRequestException('المستخدم غير موجود');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException(
        'لم يتم إعداد المصادقة الثنائية. قم بالإعداد أولاً',
      );
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('المصادقة الثنائية مفعلة بالفعل');
    }

    // فك تشفير المفتاح
    const secret = this.decrypt(user.twoFactorSecret);

    // التحقق من الرمز باستخدام otplib (±1 خطوة زمنية لاختلاف ساعة الجهاز)
    const cleanToken = token.replace(/\s/g, ''); // إزالة المسافات
    const result = verifySync({
      token: cleanToken,
      secret,
      epochTolerance: 1,
    });

    if (!result.valid) {
      throw new UnauthorizedException(
        'رمز التحقق غير صحيح. تأكد من إدخال الرمز الظاهر في التطبيق',
      );
    }

    // تفعيل 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
      select: { id: true, twoFactorEnabled: true },
    });

    // استرجاع الرموز الاحتياطية الأصلية (مرة واحدة بعد التفعيل)
    const backupCodes = await this.takePendingBackupCodes(userId);

    return {
      success: true,
      backupCodes,
    };
  }

  /**
   * 🔓 التحقق من رمز OTP عند تسجيل الدخول
   */
  async verifyToken(
    userId: string,
    token: string,
  ): Promise<TwoFactorVerifyResult> {
    if (!userId) {
      throw new BadRequestException('معرف المستخدم مطلوب');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        twoFactorSecret: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      throw new BadRequestException('المستخدم غير موجود');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('المصادقة الثنائية غير مفعلة لهذا الحساب');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException(
        'المفتاح السري غير موجود. يرجى إعادة إعداد المصادقة الثنائية',
      );
    }

    // فك تشفير المفتاح
    const secret = this.decrypt(user.twoFactorSecret);

    // التحقق من الرمز باستخدام otplib (±1 خطوة زمنية لاختلاف ساعة الجهاز)
    const cleanToken = token.replace(/\s/g, '');
    const result = verifySync({
      token: cleanToken,
      secret,
      epochTolerance: 1,
    });

    if (result.valid) {
      return { valid: true };
    }

    // محاولة التحقق من الرموز الاحتياطية
    const backupCodeUsed = await this.verifyBackupCode(userId, token);
    if (backupCodeUsed) {
      return { valid: true, usedBackupCode: true };
    }

    return { valid: false };
  }

  /**
   * ❌ إلغاء تفعيل المصادقة الثنائية
   */
  async disable(userId: string, token: string): Promise<{ success: boolean }> {
    // التحقق من الرمز أولاً
    const verification = await this.verifyToken(userId, token);

    if (!verification.valid) {
      throw new UnauthorizedException('رمز التحقق غير صحيح');
    }

    // إلغاء التفعيل
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
      select: { id: true, twoFactorEnabled: true, twoFactorSecret: true },
    });

    // حذف الرموز الاحتياطية
    await this.deleteBackupCodes(userId);

    return { success: true };
  }

  /**
   * 🔄 إعادة توليد الرموز الاحتياطية
   */
  async regenerateBackupCodes(
    userId: string,
    token: string,
  ): Promise<{ backupCodes: string[] }> {
    // التحقق من الرمز
    const verification = await this.verifyToken(userId, token);

    if (!verification.valid) {
      throw new UnauthorizedException('رمز التحقق غير صحيح');
    }

    // توليد رموز جديدة
    const newBackupCodes = this.generateBackupCodes(10);

    // حذف القديمة وحفظ الجديدة
    await this.deleteBackupCodes(userId);
    await this.saveBackupCodes(userId, newBackupCodes);

    return { backupCodes: newBackupCodes };
  }

  /**
   * 📊 حالة المصادقة الثنائية للمستخدم
   */
  async getStatus(userId: string): Promise<{
    enabled: boolean;
    backupCodesRemaining: number;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    const backupCodesCount = await this.prisma.twoFactorBackupCode.count({
      where: { userId, used: false },
    });

    return {
      enabled: user?.twoFactorEnabled || false,
      backupCodesRemaining: backupCodesCount,
    };
  }

  /**
   * 💾 حفظ الرموز الاحتياطية
   */
  private async saveBackupCodes(
    userId: string,
    codes: string[],
  ): Promise<void> {
    const hashedCodes = this.hashBackupCodes(codes);

    await this.prisma.twoFactorBackupCode.createMany({
      data: hashedCodes.map((codeHash) => ({
        id: crypto.randomUUID(),
        userId,
        codeHash,
        used: false,
      })),
    });
  }

  /**
   * 🔍 التحقق من رمز احتياطي
   */
  private async verifyBackupCode(
    userId: string,
    code: string,
  ): Promise<boolean> {
    const normalizedCode = code.replace(/[-\s]/g, '').toUpperCase();
    const codeHash = this.hashBackupCode(normalizedCode);

    const backupCode = await this.prisma.twoFactorBackupCode.findFirst({
      where: {
        userId,
        codeHash,
        used: false,
      },
    });

    if (backupCode) {
      // تعليم الرمز كمستخدم
      await this.prisma.twoFactorBackupCode.update({
        where: { id: backupCode.id },
        data: {
          used: true,
          usedAt: new Date(),
        },
      });
      return true;
    }

    return false;
  }

  private pendingBackupKey(userId: string): string {
    return `2fa:pending-backup:${userId}`;
  }

  private async cachePendingBackupCodes(
    userId: string,
    codes: string[],
  ): Promise<void> {
    await this.redis.set(this.pendingBackupKey(userId), codes, 1800);
  }

  private async readPendingBackupCodes(userId: string): Promise<string[]> {
    const codes = await this.redis.get<string[]>(this.pendingBackupKey(userId));
    return codes ?? [];
  }

  private async takePendingBackupCodes(userId: string): Promise<string[]> {
    const codes = await this.redis.get<string[]>(this.pendingBackupKey(userId));
    await this.redis.del(this.pendingBackupKey(userId));
    return codes ?? [];
  }

  /**
   * 🗑️ حذف الرموز الاحتياطية
   */
  private async deleteBackupCodes(userId: string): Promise<void> {
    await this.prisma.twoFactorBackupCode.deleteMany({
      where: { userId },
    });
  }

  /**
   * 🔍 التحقق مما إذا كان المستخدم يحتاج 2FA
   */
  async requiresTwoFactor(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    return user?.twoFactorEnabled || false;
  }
}
