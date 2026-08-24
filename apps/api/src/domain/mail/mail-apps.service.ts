import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailAppStatus, MailAppType, MailDomainStatus, Prisma } from '@prisma/client';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import {
  WhatsAppBusinessService,
  WhatsAppBusinessError,
} from '../../integrations/whatsapp-business/whatsapp-business.service';
import { normalizePhoneNumber } from '../forms/utils/form-phone-verification-check.util';
import {
  CreateMailAppDto,
  SendMailAppOtpDto,
  UpdateMailAppDto,
  VerifyMailAppOtpDto,
} from './dto/mail-app.dto';
import { MAIL_APP_ID_PATTERN } from './mail-app-id.util';
import { MailSubscriptionsService } from './mail-subscriptions.service';

const OTP_EXPIRY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_COOLDOWN_SECONDS = 60;
const BCRYPT_ROUNDS = 10;
const OTP_TYPE = 'MAIL_APP_VERIFICATION' as const;

@Injectable()
export class MailAppsService {
  private readonly logger = new Logger(MailAppsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappBusiness: WhatsAppBusinessService,
    private readonly configService: ConfigService,
    private readonly subscriptions: MailSubscriptionsService,
  ) {}

  private isDevOtpBypass(): boolean {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    if (nodeEnv === 'production') return false;
    return this.configService.get<string>('WHATSAPP_OTP_DEV_BYPASS') === 'true';
  }

  /** 16-digit public id — Mail product only (not DeveloperApp). */
  private generateAppId(): string {
    const timestamp = Date.now().toString();
    const randomPart = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0');
    return (timestamp + randomPart).slice(0, 16);
  }

  private generateOtpCode(): string {
    return randomInt(100000, 999999).toString();
  }

  private async sendWhatsAppOtp(
    phoneNumber: string,
    code: string,
  ): Promise<string | null> {
    if (!this.whatsappBusiness.isEnabled()) {
      return 'خدمة WhatsApp غير مهيّأة. أضف WHATSAPP_BUSINESS_TOKEN و WHATSAPP_PHONE_NUMBER_ID في البيئة.';
    }

    try {
      await this.whatsappBusiness.sendOtp(phoneNumber, code);
      return null;
    } catch (error) {
      const userMessage =
        error instanceof WhatsAppBusinessError ? error.userMessage : undefined;
      this.logger.warn(
        `WhatsApp Business OTP failed for mail app verification: ${(error as Error).message}`,
      );
      return (
        userMessage ||
        'فشل إرسال رمز التحقق عبر WhatsApp. تحقق من WHATSAPP_BUSINESS_TOKEN و WHATSAPP_PHONE_NUMBER_ID وقالب rukny_otp_cart في Meta.'
      );
    }
  }

  private toView(
    app: {
      id: string;
      appId: string;
      userId: string;
      slotIndex: number;
      name: string;
      contactEmail: string | null;
      appType: MailAppType;
      description: string | null;
      status: MailAppStatus;
      primaryDomain: string | null;
      domainStatus?: MailDomainStatus;
      domainCheckedAt?: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
    subscription?: { plan: string; status: string; mailboxCount: number } | null,
  ) {
    const active =
      subscription && subscription.status === 'ACTIVE' ? subscription : null;
    return {
      id: app.id,
      appId: app.appId,
      slotIndex: app.slotIndex,
      name: app.name,
      contactEmail: app.contactEmail,
      appType: app.appType,
      description: app.description,
      status: app.status,
      primaryDomain: app.primaryDomain,
      domainStatus: app.domainStatus ?? MailDomainStatus.NONE,
      domainCheckedAt: app.domainCheckedAt?.toISOString() ?? null,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      subscription: active
        ? {
            plan: active.plan,
            status: active.status,
            mailboxCount: active.mailboxCount,
          }
        : null,
    };
  }

  async sendOtp(userId: string, dto: SendMailAppOtpDto) {
    const phoneNumber = normalizePhoneNumber(dto.phoneNumber);
    if (!phoneNumber || phoneNumber.length < 10) {
      throw new BadRequestException('رقم الهاتف غير صالح.');
    }

    const recent = await this.prisma.whatsappOtp.findFirst({
      where: {
        userId,
        phoneNumber,
        type: OTP_TYPE,
        createdAt: { gte: new Date(Date.now() - OTP_COOLDOWN_SECONDS * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recent) {
      const waitSeconds = Math.ceil(
        (recent.createdAt.getTime() +
          OTP_COOLDOWN_SECONDS * 1000 -
          Date.now()) /
          1000,
      );
      throw new BadRequestException(
        `Please wait ${waitSeconds} seconds before requesting a new code.`,
      );
    }

    const code = this.generateOtpCode();
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);

    if (this.isDevOtpBypass()) {
      this.logger.warn(
        `[DEV] WHATSAPP_OTP_DEV_BYPASS — Mail OTP for ${phoneNumber.slice(0, 4)}***: ${code}`,
      );
    } else {
      const sendError = await this.sendWhatsAppOtp(phoneNumber, code);
      if (sendError) {
        throw new BadRequestException(sendError);
      }
    }

    await this.prisma.whatsappOtp.create({
      data: {
        userId,
        phoneNumber,
        codeHash,
        type: OTP_TYPE,
        sentVia: 'WHATSAPP',
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    });

    this.logger.log(
      `Mail app verification OTP sent to ${phoneNumber.slice(0, 4)}*** for user ${userId}`,
    );
    return { sent: true, expiresInSeconds: OTP_EXPIRY_MINUTES * 60 };
  }

  private async verifyOtp(
    userId: string,
    phoneNumber: string,
    code: string,
  ): Promise<boolean> {
    const otp = await this.prisma.whatsappOtp.findFirst({
      where: {
        userId,
        phoneNumber,
        type: OTP_TYPE,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new BadRequestException(
        'No valid OTP found. Please request a new code.',
      );
    }

    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Too many attempts. Please request a new code.',
      );
    }

    await this.prisma.whatsappOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });

    const isValid = await bcrypt.compare(code, otp.codeHash);
    if (!isValid) {
      throw new BadRequestException('Invalid code. Please try again.');
    }

    await this.prisma.whatsappOtp.update({
      where: { id: otp.id },
      data: { verified: true, verifiedAt: new Date() },
    });

    return true;
  }

  async verifyOtpEndpoint(userId: string, dto: VerifyMailAppOtpDto) {
    const phoneNumber = normalizePhoneNumber(dto.phoneNumber);
    if (!phoneNumber) {
      throw new BadRequestException('رقم الهاتف غير صالح.');
    }
    await this.verifyOtp(userId, phoneNumber, dto.code);
    return { verified: true };
  }

  async listApps(userId: string) {
    const apps = await this.prisma.mailApp.findMany({
      where: { userId, status: MailAppStatus.ACTIVE },
      include: { subscription: true },
      orderBy: { slotIndex: 'asc' },
    });
    return {
      apps: apps.map((app) => this.toView(app, app.subscription)),
    };
  }

  async getApp(userId: string, appId: string) {
    if (!MAIL_APP_ID_PATTERN.test(appId)) {
      throw new BadRequestException('Invalid Mail app id.');
    }
    const app = await this.prisma.mailApp.findFirst({
      where: { userId, appId, status: MailAppStatus.ACTIVE },
      include: { subscription: true },
    });
    if (!app) throw new NotFoundException('Mail app not found.');
    return { app: this.toView(app, app.subscription) };
  }

  private async allocateSlotIndex(userId: string): Promise<number> {
    const agg = await this.prisma.mailApp.aggregate({
      where: { userId },
      _max: { slotIndex: true },
    });
    return (agg._max.slotIndex ?? -1) + 1;
  }

  async createApp(userId: string, dto: CreateMailAppDto) {
    const name = dto.name.trim();
    if (name.length < 2) {
      throw new BadRequestException('Name must be at least 2 characters.');
    }

    const verifiedOtp = await this.prisma.whatsappOtp.findFirst({
      where: {
        userId,
        type: OTP_TYPE,
        verified: true,
        verifiedAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
      orderBy: { verifiedAt: 'desc' },
    });

    if (!verifiedOtp) {
      throw new ForbiddenException(
        'Phone verification required. Please verify your phone number first.',
      );
    }

    const otpMatches = await bcrypt.compare(dto.otpCode, verifiedOtp.codeHash);
    if (!otpMatches) {
      throw new ForbiddenException(
        'Phone verification required. Please verify your phone number first.',
      );
    }

    let appId = this.generateAppId();
    let slotIndex = await this.allocateSlotIndex(userId);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const app = await this.prisma.mailApp.create({
          data: {
            userId,
            appId,
            slotIndex,
            name,
            contactEmail: dto.contactEmail.trim(),
            appType: dto.appType ?? MailAppType.BUSINESS,
            description: dto.description?.trim() || null,
            status: MailAppStatus.ACTIVE,
          },
        });
        return { app: this.toView(app) };
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          appId = this.generateAppId();
          slotIndex = await this.allocateSlotIndex(userId);
          continue;
        }
        throw error;
      }
    }
    throw new BadRequestException('Could not allocate a Mail app id. Try again.');
  }

  async updateApp(userId: string, appId: string, dto: UpdateMailAppDto) {
    const { app: previous } = await this.getApp(userId, appId);

    const primaryDomain =
      dto.primaryDomain === undefined
        ? undefined
        : dto.primaryDomain
          ? dto.primaryDomain.trim().toLowerCase()
          : null;

    let domainStatus = dto.domainStatus;
    if (primaryDomain === null) {
      domainStatus = MailDomainStatus.NONE;
    }

    let domainCheckedAt: Date | null | undefined;
    if (dto.domainCheckedAt === null) {
      domainCheckedAt = null;
    } else if (dto.domainCheckedAt) {
      const parsed = new Date(dto.domainCheckedAt);
      domainCheckedAt = Number.isNaN(parsed.getTime()) ? undefined : parsed;
    } else if (domainStatus !== undefined || primaryDomain !== undefined) {
      domainCheckedAt = new Date();
    }

    const app = await this.prisma.mailApp.update({
      where: { appId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.contactEmail !== undefined
          ? { contactEmail: dto.contactEmail.trim() }
          : {}),
        ...(primaryDomain !== undefined ? { primaryDomain } : {}),
        ...(domainStatus !== undefined ? { domainStatus } : {}),
        ...(domainCheckedAt !== undefined ? { domainCheckedAt } : {}),
      },
    });

    if (
      app.domainStatus === MailDomainStatus.ACTIVE &&
      previous.domainStatus !== MailDomainStatus.ACTIVE
    ) {
      await this.subscriptions.provisionStarterAfterDomainVerified(
        userId,
        appId,
      );
    }

    return { app: this.toView(app) };
  }

  async archiveApp(userId: string, appId: string) {
    await this.getApp(userId, appId);
    const app = await this.prisma.mailApp.update({
      where: { appId },
      data: { status: MailAppStatus.ARCHIVED },
    });
    return { app: this.toView(app) };
  }
}
