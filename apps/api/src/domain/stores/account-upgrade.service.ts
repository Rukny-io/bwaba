import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { AddressesService } from './addresses.service';
import * as bcrypt from 'bcryptjs';

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
  ) {}

  /**
   * 🚀 ترقية حساب ضيف إلى حساب كامل
   */
  async upgradeAccount(dto: UpgradeAccountDto): Promise<UpgradeResult> {
    const { phoneNumber, email, password, name } = dto;

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
  async getGuestDataSummary(phoneNumber: string): Promise<{
    ordersCount: number;
    addressesCount: number;
    totalSpent: number;
    canUpgrade: boolean;
  }> {
    // عدد الطلبات
    const ordersCount = await this.prismaAny.orders.count({
      where: { phoneNumber },
    });

    // عدد العناوين
    const addressesCount = await this.prisma.addresses.count({
      where: { phoneNumber },
    });

    // إجمالي المشتريات
    const totalSpentResult = await this.prismaAny.orders.aggregate({
      where: { phoneNumber },
      _sum: { total: true },
    });

    // التحقق من إمكانية الترقية (لا يوجد حساب كامل بنفس الرقم)
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
