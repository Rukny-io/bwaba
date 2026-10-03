import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { AddressesService } from './addresses.service';
import { WhatsAppBusinessService } from '../../integrations/whatsapp-business/whatsapp-business.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { OTP_BCRYPT_ROUNDS } from '../../core/common/constants/crypto.constants';

/**
 * 🚀 خدمة ترقية الحساب - Account Upgrade Service
 *
 * تحويل حساب الضيف إلى حساب كامل
 * - ربط جميع الطلبات والعناوين
 * - إضافة البريد الإلكتروني وكلمة المرور
 */

export interface UpgradeAccountDto {
  phoneNumber: string;
  email: string;
  password: string;
  name?: string;
  upgradeToken: string;
}

export interface UpgradeResult {
  success: boolean;
  message: string;
  userId: string;
  accessToken: string;
  linkedData: {
    ordersCount: number;
    addressesCount: number;
  };
}

const BCRYPT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;
const UPGRADE_TOKEN_MINUTES = 15;

@Injectable()
export class AccountUpgradeService {
  private readonly logger = new Logger(AccountUpgradeService.name);

  // Prisma helper
  private get prismaAny() {
    return this.prisma as any;
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly addressesService: AddressesService,
    private readonly whatsappBusiness: WhatsAppBusinessService,
  ) {}

  /**
   * 📲 طلب OTP لترقية الحساب (رد موحّد لمنع enumeration)
   */
  async requestUpgradeOtp(phoneNumber: string): Promise<{
    success: boolean;
    message: string;
    otpId: string;
    expiresIn: number;
  }> {
    const hasGuestData = await this.hasGuestData(phoneNumber);

    await this.prismaAny.whatsappOtp.updateMany({
      where: {
        phoneNumber,
        type: 'APP_VERIFICATION',
        verified: false,
        expiresAt: { gt: new Date() },
      },
      data: { expiresAt: new Date() },
    });

    const otpCode = this.generateOtpCode();
    const codeHash = await bcrypt.hash(otpCode, OTP_BCRYPT_ROUNDS);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    const otpRecord = await this.prismaAny.whatsappOtp.create({
      data: {
        phoneNumber,
        codeHash,
        type: 'APP_VERIFICATION',
        expiresAt,
      },
    });

    if (hasGuestData) {
      try {
        await this.whatsappBusiness.sendOtp(phoneNumber, otpCode);
      } catch (error) {
        this.logger.error(
          `Failed to send upgrade OTP to ${phoneNumber}: ${(error as Error).message}`,
        );
        throw new BadRequestException({
          message: 'فشل في إرسال رمز التحقق. يرجى المحاولة لاحقاً.',
          code: 'OTP_SEND_FAILED',
        });
      }
    }

    return {
      success: true,
      message:
        'إذا كان الرقم مرتبطاً بطلبات، سيصلك رمز التحقق عبر واتساب خلال دقائق.',
      otpId: otpRecord.id,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
    };
  }

  /**
   * ✅ التحقق من OTP وإصدار upgradeToken + ملخص البيانات
   */
  async verifyUpgradeOtp(input: {
    phoneNumber: string;
    code: string;
    otpId: string;
  }): Promise<{
    success: boolean;
    upgradeToken: string;
    expiresIn: number;
    summary: {
      ordersCount: number;
      addressesCount: number;
      totalSpent: number;
      canUpgrade: boolean;
    };
  }> {
    const { phoneNumber, code, otpId } = input;
    const otpRecord = await this.prismaAny.whatsappOtp.findUnique({
      where: { id: otpId },
    });

    if (!otpRecord || otpRecord.type !== 'APP_VERIFICATION') {
      throw new BadRequestException({
        message: 'رمز التحقق غير صالح',
        code: 'INVALID_OTP_ID',
      });
    }

    if (otpRecord.phoneNumber !== phoneNumber) {
      throw new BadRequestException({
        message: 'رقم الهاتف غير متطابق',
        code: 'PHONE_MISMATCH',
      });
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException({
        message: 'انتهت صلاحية رمز التحقق',
        code: 'OTP_EXPIRED',
      });
    }

    if (otpRecord.verified) {
      throw new BadRequestException({
        message: 'تم استخدام هذا الرمز مسبقاً',
        code: 'OTP_ALREADY_USED',
      });
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      throw new BadRequestException({
        message: 'تم تجاوز الحد الأقصى للمحاولات',
        code: 'MAX_ATTEMPTS_EXCEEDED',
      });
    }

    await this.prismaAny.whatsappOtp.update({
      where: { id: otpId },
      data: { attempts: { increment: 1 } },
    });

    const isValid = await bcrypt.compare(code, otpRecord.codeHash);
    if (!isValid) {
      const remaining = MAX_OTP_ATTEMPTS - (otpRecord.attempts + 1);
      throw new BadRequestException({
        message: `رمز التحقق غير صحيح. المحاولات المتبقية: ${remaining}`,
        code: 'INVALID_OTP_CODE',
        remainingAttempts: remaining,
      });
    }

    if (!(await this.hasGuestData(phoneNumber))) {
      throw new BadRequestException({
        message: 'لا توجد بيانات ضيف مرتبطة بهذا الرقم',
        code: 'NO_GUEST_DATA',
      });
    }

    await this.prismaAny.whatsappOtp.update({
      where: { id: otpId },
      data: { verified: true, verifiedAt: new Date() },
    });

    const summary = await this.getGuestDataSummaryForPhone(phoneNumber);
    const upgradeToken = this.jwtService.sign(
      {
        purpose: 'account_upgrade',
        phoneNumber,
      },
      { expiresIn: `${UPGRADE_TOKEN_MINUTES}m` },
    );

    return {
      success: true,
      upgradeToken,
      expiresIn: UPGRADE_TOKEN_MINUTES * 60,
      summary,
    };
  }

  /**
   * 🚀 ترقية حساب ضيف إلى حساب كامل
   */
  async upgradeAccount(dto: UpgradeAccountDto): Promise<UpgradeResult> {
    const { phoneNumber, email, password, name, upgradeToken } = dto;
    this.assertUpgradeToken(phoneNumber, upgradeToken);

    // 1. التحقق من عدم وجود حساب بنفس البريد
    const existingEmail = await this.prisma.user.findFirst({
      where: { email },
    });

    if (existingEmail) {
      throw new ConflictException({
        message: 'البريد الإلكتروني مستخدم بالفعل',
        code: 'EMAIL_EXISTS',
      });
    }

    // 2. البحث عن مستخدم ضيف بنفس الرقم
    let user = await this.prismaAny.user.findFirst({
      where: {
        phoneNumber,
        accountType: 'GUEST_CHECKOUT',
      },
    });

    // 3. إذا لم يوجد مستخدم ضيف، ننشئ حساب جديد مباشرة
    if (!user) {
      // التحقق من عدم وجود حساب آخر بنفس الرقم
      const existingPhone = await this.prismaAny.user.findFirst({
        where: { phoneNumber },
      });

      if (existingPhone) {
        throw new ConflictException({
          message: 'رقم الهاتف مرتبط بحساب آخر',
          code: 'PHONE_EXISTS',
        });
      }
    }

    // 4. تشفير كلمة المرور
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // 5. ترقية أو إنشاء الحساب
    if (user) {
      // ترقية حساب الضيف
      user = await this.prismaAny.user.update({
        where: { id: user.id },
        data: {
          email,
          accountType: 'REGULAR',
          role: 'BASIC',
          passwordHash,
          passwordUpdatedAt: new Date(),
          profile: {
            create: {
              username: this.generateUsername(email),
              name: name || email.split('@')[0],
            },
          },
        },
      });

      this.logger.log(`Guest account upgraded: ${user.id}`);
    } else {
      // إنشاء حساب جديد
      user = await this.prismaAny.user.create({
        data: {
          email,
          phoneNumber,
          phoneVerified: false, // سيحتاج للتحقق
          accountType: 'REGULAR',
          role: 'BASIC',
          passwordHash,
          passwordUpdatedAt: new Date(),
          profile: {
            create: {
              username: this.generateUsername(email),
              name: name || email.split('@')[0],
            },
          },
        },
      });

      this.logger.log(`New account created: ${user.id}`);
    }

    // 6. ربط العناوين غير المرتبطة
    const linkedAddresses = await this.addressesService.linkAddressesToUser(
      phoneNumber,
      user.id,
    );

    // 7. ربط الطلبات غير المرتبطة (للضيوف)
    const linkedOrders = await this.prismaAny.orders.updateMany({
      where: {
        phoneNumber,
        userId: null,
      },
      data: { userId: user.id },
    });

    this.logger.log(`Linked ${linkedOrders.count} orders to user ${user.id}`);

    // 8. إنشاء JWT Token
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        phone: phoneNumber,
        role: user.role,
      },
      { expiresIn: '7d' },
    );

    return {
      success: true,
      message: 'تم ترقية حسابك بنجاح! يمكنك الآن الوصول لجميع طلباتك وعناوينك.',
      userId: user.id,
      accessToken,
      linkedData: {
        ordersCount: linkedOrders.count,
        addressesCount: linkedAddresses.linkedCount,
      },
    };
  }

  /**
   * 🔗 ربط بيانات الضيف بحساب موجود
   */
  async linkGuestDataToExistingAccount(
    phoneNumber: string,
    userId: string,
  ): Promise<{ ordersLinked: number; addressesLinked: number }> {
    // ربط العناوين
    const addresses = await this.addressesService.linkAddressesToUser(
      phoneNumber,
      userId,
    );

    // ربط الطلبات
    const orders = await this.prismaAny.orders.updateMany({
      where: {
        phoneNumber,
        userId: null,
      },
      data: { userId },
    });

    // تحديث رقم الهاتف في الحساب إذا لم يكن موجوداً
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user && !(user as any).phoneNumber) {
      await this.prismaAny.user.update({
        where: { id: userId },
        data: {
          phoneNumber,
          phoneVerified: true,
          phoneVerifiedAt: new Date(),
        },
      });
    }

    return {
      ordersLinked: orders.count,
      addressesLinked: addresses.linkedCount,
    };
  }

  /**
   * 📊 جلب إحصائيات بيانات الضيف قبل الترقية
   */
  getMaskedGuestSummary(): {
    ordersCount: number;
    addressesCount: number;
    totalSpent: number;
    canUpgrade: boolean;
    requiresVerification: boolean;
  } {
    return {
      ordersCount: 0,
      addressesCount: 0,
      totalSpent: 0,
      canUpgrade: true,
      requiresVerification: true,
    };
  }

  async getGuestDataSummary(
    phoneNumber: string,
    upgradeToken?: string,
  ): Promise<{
    ordersCount: number;
    addressesCount: number;
    totalSpent: number;
    canUpgrade: boolean;
    requiresVerification?: boolean;
  }> {
    if (!upgradeToken) {
      return this.getMaskedGuestSummary();
    }

    this.assertUpgradeToken(phoneNumber, upgradeToken);
    return this.getGuestDataSummaryForPhone(phoneNumber);
  }

  private async getGuestDataSummaryForPhone(phoneNumber: string) {
    const ordersCount = await this.prismaAny.orders.count({
      where: { phoneNumber },
    });

    const addressesCount = await this.prisma.addresses.count({
      where: { phoneNumber },
    });

    const totalSpentResult = await this.prismaAny.orders.aggregate({
      where: { phoneNumber },
      _sum: { total: true },
    });

    const existingFullAccount = await this.prismaAny.user.findFirst({
      where: {
        phoneNumber,
        accountType: 'REGULAR',
      },
    });

    return {
      ordersCount,
      addressesCount,
      totalSpent: Number(totalSpentResult._sum?.total || 0),
      canUpgrade: !existingFullAccount,
    };
  }

  private assertUpgradeToken(phoneNumber: string, upgradeToken: string) {
    try {
      const payload = this.jwtService.verify<{ purpose?: string; phoneNumber?: string }>(
        upgradeToken,
      );
      if (
        payload.purpose !== 'account_upgrade' ||
        payload.phoneNumber !== phoneNumber
      ) {
        throw new UnauthorizedException('رمز التحقق غير صالح');
      }
    } catch {
      throw new UnauthorizedException('رمز التحقق منتهي أو غير صالح');
    }
  }

  private async hasGuestData(phoneNumber: string): Promise<boolean> {
    const [ordersCount, addressesCount] = await Promise.all([
      this.prismaAny.orders.count({ where: { phoneNumber } }),
      this.prisma.addresses.count({ where: { phoneNumber } }),
    ]);
    return ordersCount > 0 || addressesCount > 0;
  }

  private generateOtpCode(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * 🎲 توليد اسم مستخدم فريد
   */
  private generateUsername(email: string): string {
    const base = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const random = Math.floor(Math.random() * 10000);
    return `${base}${random}`;
  }
}
