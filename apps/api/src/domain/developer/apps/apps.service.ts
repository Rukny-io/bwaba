import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { SendAppOtpDto } from './dto/app-otp.dto';
import { buildAppVerificationSummary } from './app-verification.util';
import { DevSubscriptionsService } from '../subscriptions/dev-subscriptions.service';
import {
  WhatsAppBusinessService,
  WhatsAppBusinessError,
} from '../../../integrations/whatsapp-business/whatsapp-business.service';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcryptjs';

const OTP_EXPIRY_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_COOLDOWN_SECONDS = 60;
const BCRYPT_ROUNDS = 10;

const APP_SETTINGS_SELECT = {
  id: true,
  appId: true,
  name: true,
  contactEmail: true,
  appType: true,
  description: true,
  businessId: true,
  icon: true,
  profileImage: true,
  websiteUrl: true,
  termsOfUseUrl: true,
  privacyPolicyUrl: true,
  dpoName: true,
  dpoEmail: true,
  dpoPhone: true,
  status: true,
  verified: true,
  accessVerified: true,
  accessReviewRequestedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class AppsService {
  private readonly logger = new Logger(AppsService.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsAppBusinessService,
    private configService: ConfigService,
    private devSubscriptions: DevSubscriptionsService,
  ) {}

  private isDevOtpBypass(): boolean {
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
    if (nodeEnv === 'production') return false;
    return this.configService.get<string>('WHATSAPP_OTP_DEV_BYPASS') === 'true';
  }

  /**
   * Generate a unique 16-digit snowflake-like numeric ID
   */
  private generateAppId(): string {
    const timestamp = Date.now().toString();
    const randomPart = randomInt(100, 999).toString();
    return (timestamp + randomPart).slice(0, 16);
  }

  /**
   * Generate a 6-digit OTP code
   */
  private generateOtpCode(): string {
    return randomInt(100000, 999999).toString();
  }

  /* ────────── OTP: Send ────────── */

  async sendOtp(userId: string, dto: SendAppOtpDto) {
    // Rate limiting: check cooldown
    const recent = await this.prisma.whatsappOtp.findFirst({
      where: {
        userId,
        phoneNumber: dto.phoneNumber,
        type: 'APP_VERIFICATION',
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
        `[DEV] WHATSAPP_OTP_DEV_BYPASS — OTP for ${dto.phoneNumber.slice(0, 4)}***: ${code}`,
      );
    } else {
      if (!this.whatsapp.isEnabled()) {
        throw new ServiceUnavailableException(
          'خدمة التحقق عبر واتساب غير مهيّأة. تواصل مع مسؤول المنصة.',
        );
      }

      try {
        await this.whatsapp.sendOtp(dto.phoneNumber, code);
      } catch (error) {
        if (error instanceof WhatsAppBusinessError) {
          const msg =
            error.userMessage ??
            'تعذّر إرسال رمز التحقق. حاول لاحقاً أو تواصل مع الدعم.';
          if (error.metaCode === 190) {
            throw new ServiceUnavailableException(msg);
          }
          throw new BadRequestException(msg);
        }
        throw error;
      }
    }

    // Store OTP record
    await this.prisma.whatsappOtp.create({
      data: {
        userId,
        phoneNumber: dto.phoneNumber,
        codeHash,
        type: 'APP_VERIFICATION',
        sentVia: 'WHATSAPP',
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    });

    this.logger.log(
      `App verification OTP sent to ${dto.phoneNumber.slice(0, 4)}*** for user ${userId}`,
    );
    return { sent: true, expiresInSeconds: OTP_EXPIRY_MINUTES * 60 };
  }

  /* ────────── OTP: Verify (internal) ────────── */

  private async verifyOtp(
    userId: string,
    phoneNumber: string,
    code: string,
  ): Promise<boolean> {
    const otp = await this.prisma.whatsappOtp.findFirst({
      where: {
        userId,
        phoneNumber,
        type: 'APP_VERIFICATION',
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

    // Increment attempts
    await this.prisma.whatsappOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });

    const isValid = await bcrypt.compare(code, otp.codeHash);
    if (!isValid) {
      throw new BadRequestException('Invalid code. Please try again.');
    }

    // Mark verified
    await this.prisma.whatsappOtp.update({
      where: { id: otp.id },
      data: { verified: true, verifiedAt: new Date() },
    });

    return true;
  }

  /* ────────── OTP: Verify (public endpoint) ────────── */

  async verifyOtpEndpoint(
    userId: string,
    dto: { phoneNumber: string; code: string },
  ) {
    await this.verifyOtp(userId, dto.phoneNumber, dto.code);
    return { verified: true };
  }

  /* ────────── Create App ────────── */

  async create(userId: string, dto: CreateAppDto) {
    await this.checkAppLimit(userId);

    // Verify OTP before creating app
    // Extract phone from the most recent verified OTP for this user
    const verifiedOtp = await this.prisma.whatsappOtp.findFirst({
      where: {
        userId,
        type: 'APP_VERIFICATION',
        verified: true,
        verifiedAt: { gte: new Date(Date.now() - 10 * 60 * 1000) }, // within 10 minutes
      },
      orderBy: { verifiedAt: 'desc' },
    });

    if (!verifiedOtp) {
      throw new ForbiddenException(
        'Phone verification required. Please verify your phone number first.',
      );
    }

    let appId: string;
    let retries = 0;
    do {
      appId = this.generateAppId();
      const exists = await this.prisma.developerApp.findUnique({
        where: { appId },
      });
      if (!exists) break;
      retries++;
    } while (retries < 5);

    const app = await this.prisma.$transaction(async (tx) => {
      const createdApp = await tx.developerApp.create({
        data: {
          appId,
          userId,
          name: dto.name,
          contactEmail: dto.contactEmail,
          appType: dto.appType,
          description: dto.description,
          businessId: dto.businessId,
          icon: dto.icon,
          verified: true,
        },
        select: APP_SETTINGS_SELECT,
      });

      await tx.developerAppWallet.create({
        data: {
          developerAppId: createdApp.id,
        },
      });

      return createdApp;
    });

    this.logger.log(`App created: ${app.appId} for user ${userId}`);
    return this.enrichApp(app);
  }

  private enrichApp<T extends Record<string, unknown>>(app: T) {
    const verification = buildAppVerificationSummary({
      businessId: app.businessId as string | null | undefined,
      verified: Boolean(app.verified),
      accessVerified: Boolean(app.accessVerified),
      accessReviewRequestedAt: app.accessReviewRequestedAt as Date | null | undefined,
      websiteUrl: app.websiteUrl as string | null | undefined,
      termsOfUseUrl: app.termsOfUseUrl as string | null | undefined,
      privacyPolicyUrl: app.privacyPolicyUrl as string | null | undefined,
      dpoName: app.dpoName as string | null | undefined,
      dpoEmail: app.dpoEmail as string | null | undefined,
      icon: app.icon as string | null | undefined,
      profileImage: app.profileImage as string | null | undefined,
      name: String(app.name ?? ''),
    });

    return {
      ...app,
      verification,
    };
  }

  private normalizeOptionalString(value?: string) {
    if (value === undefined) return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  async findAll(userId: string) {
    const apps = await this.prisma.developerApp.findMany({
      where: { userId, status: { not: 'DELETED' } },
      orderBy: { createdAt: 'desc' },
      select: APP_SETTINGS_SELECT,
    });
    return apps.map((app) => this.enrichApp(app));
  }

  async findOne(userId: string, appId: string) {
    const app = await this.prisma.developerApp.findFirst({
      where: { appId, userId, status: { not: 'DELETED' } },
      select: APP_SETTINGS_SELECT,
    });
    if (!app) throw new NotFoundException('App not found');
    return this.enrichApp(app);
  }

  async update(userId: string, appId: string, dto: UpdateAppDto) {
    const app = await this.prisma.developerApp.findFirst({
      where: { appId, userId, status: { not: 'DELETED' } },
    });
    if (!app) throw new NotFoundException('App not found');

    const updated = await this.prisma.developerApp.update({
      where: { id: app.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && {
          description: this.normalizeOptionalString(dto.description),
        }),
        ...(dto.businessId !== undefined && {
          businessId: this.normalizeOptionalString(dto.businessId),
        }),
        ...(dto.icon !== undefined && {
          icon: this.normalizeOptionalString(dto.icon),
        }),
        ...(dto.profileImage !== undefined && {
          profileImage: this.normalizeOptionalString(dto.profileImage),
        }),
        ...(dto.websiteUrl !== undefined && {
          websiteUrl: this.normalizeOptionalString(dto.websiteUrl),
        }),
        ...(dto.termsOfUseUrl !== undefined && {
          termsOfUseUrl: this.normalizeOptionalString(dto.termsOfUseUrl),
        }),
        ...(dto.privacyPolicyUrl !== undefined && {
          privacyPolicyUrl: this.normalizeOptionalString(dto.privacyPolicyUrl),
        }),
        ...(dto.dpoName !== undefined && {
          dpoName: this.normalizeOptionalString(dto.dpoName),
        }),
        ...(dto.dpoEmail !== undefined && {
          dpoEmail: this.normalizeOptionalString(dto.dpoEmail),
        }),
        ...(dto.dpoPhone !== undefined && {
          dpoPhone: this.normalizeOptionalString(dto.dpoPhone),
        }),
      },
      select: APP_SETTINGS_SELECT,
    });

    return this.enrichApp(updated);
  }

  async submitAccessReview(userId: string, appId: string) {
    const app = await this.prisma.developerApp.findFirst({
      where: { appId, userId, status: { not: 'DELETED' } },
      select: APP_SETTINGS_SELECT,
    });
    if (!app) throw new NotFoundException('App not found');

    const summary = buildAppVerificationSummary(app);
    if (!summary.canSubmitAccessReview) {
      throw new BadRequestException(
        'Complete all required settings before submitting for access review.',
      );
    }

    const updated = await this.prisma.developerApp.update({
      where: { id: app.id },
      data: { accessReviewRequestedAt: new Date() },
      select: APP_SETTINGS_SELECT,
    });

    this.logger.log(`Access review submitted for app ${appId} by user ${userId}`);
    return this.enrichApp(updated);
  }

  async remove(userId: string, appId: string) {
    const app = await this.prisma.developerApp.findFirst({
      where: { appId, userId, status: { not: 'DELETED' } },
    });
    if (!app) throw new NotFoundException('App not found');

    await this.prisma.developerApp.update({
      where: { id: app.id },
      data: { status: 'DELETED' },
    });

    this.logger.log(`App soft-deleted: ${appId} by user ${userId}`);
    return { success: true };
  }

  private async checkAppLimit(userId: string) {
    const allowed = await this.devSubscriptions.checkResourceLimit(userId, 'apps');
    if (!allowed) {
      const quotas = await this.devSubscriptions.getResourceQuotas(userId);
      throw new ForbiddenException(
        `App limit reached (${quotas.appsUsed}/${quotas.appsLimit >= Number.MAX_SAFE_INTEGER ? '∞' : quotas.appsLimit}). Upgrade to Pro for unlimited apps.`,
      );
    }
  }
}
