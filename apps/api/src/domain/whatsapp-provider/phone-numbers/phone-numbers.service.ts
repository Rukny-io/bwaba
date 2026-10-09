import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  GoneException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fromBuffer } from 'file-type';
import sharp from 'sharp';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { AppsUploadService } from '../../developer/apps/apps-upload.service';
import { S3Service } from '../../../shared/services/s3.service';
import { MetaApiService } from '../shared/meta-api.service';
import { WabaService } from '../accounts/waba.service';
import { TokenEncryptionService } from '../shared/token-encryption.service';
import {
  RegisterPhoneDto,
  UpdatePhoneProfileDto,
} from './dto/phone-number.dto';
import { SendTestMessageDto } from './dto/send-test-message.dto';
import type { Prisma } from '@prisma/client';

const META_PROFILE_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

@Injectable()
export class PhoneNumbersService {
  private readonly logger = new Logger(PhoneNumbersService.name);
  private readonly bucket: string;

  constructor(
    private prisma: PrismaService,
    private metaApi: MetaApiService,
    private wabaService: WabaService,
    private tokenEncryption: TokenEncryptionService,
    private appsUpload: AppsUploadService,
    private s3Service: S3Service,
    private configService: ConfigService,
  ) {
    this.bucket = this.configService.get<string>('S3_BUCKET', 'rukny-storage');
  }

  /**
   * Resolve phone by UUID or phoneNumberId
   */
  private async resolveDeveloperAppId(userId: string, appId: string) {
    const app = await this.prisma.developerApp.findFirst({
      where: { appId, userId, status: 'ACTIVE' },
      select: { id: true },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    return app.id;
  }

  private phoneWhere(
    phoneId: string,
    userId: string,
    developerAppId: string,
  ): Prisma.DeveloperPhoneNumberWhereInput {
    return {
      OR: [
        { id: phoneId },
        { phoneId },
        { phoneNumberId: phoneId },
      ],
      account: {
        is: {
          userId,
          developerAppId,
        },
      },
    };
  }

  /**
   * قائمة أرقام الهاتف
   */
  async findAll(userId: string, appId: string) {
    const developerAppId = await this.resolveDeveloperAppId(userId, appId);

    try {
      await this.wabaService.syncPhonesForApp(userId, appId);
    } catch (error) {
      this.logger.warn(
        `Phone list sync skipped for app ${appId}: ${error instanceof Error ? error.message : error}`,
      );
    }

    return this.prisma.developerPhoneNumber.findMany({
      where: {
        account: {
          is: {
            userId,
            status: 'ACTIVE',
            developerAppId,
          },
        },
      },
      include: {
        account: {
          select: { id: true, businessName: true, wabaId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * تفاصيل رقم هاتف
   */
  async findOne(userId: string, appId: string, phoneId: string) {
    const developerAppId = await this.resolveDeveloperAppId(userId, appId);
    const phone = await this.prisma.developerPhoneNumber.findFirst({
      where: this.phoneWhere(phoneId, userId, developerAppId),
      include: {
        account: {
          select: { id: true, businessName: true, wabaId: true },
        },
      },
    });

    if (!phone) throw new NotFoundException('Phone number not found');
    return phone;
  }

  /**
   * تسجيل رقم هاتف
   */
  async register(
    userId: string,
    appId: string,
    phoneId: string,
    dto: RegisterPhoneDto,
  ) {
    const developerAppId = await this.resolveDeveloperAppId(userId, appId);
    const phone = await this.prisma.developerPhoneNumber.findFirst({
      where: this.phoneWhere(phoneId, userId, developerAppId),
      include: {
        account: true,
      },
    });

    if (!phone) throw new NotFoundException('Phone number not found');
    if (!phone.account.accessTokenEncrypted) {
      throw new BadRequestException('WABA account token not available');
    }

    const accessToken = this.tokenEncryption.decrypt(
      phone.account.accessTokenEncrypted,
    );

    try {
      await this.metaApi.registerPhoneNumber(
        phone.phoneNumberId,
        accessToken,
        dto.pin,
      );

      await this.prisma.developerPhoneNumber.update({
        where: { id: phone.id },
        data: { status: 'ACTIVE' },
      });

      return { success: true, status: 'ACTIVE' };
    } catch (error) {
      const metaError = error?.response?.data?.error || {};
      const metaMessage =
        typeof metaError.message === 'string' ? metaError.message : '';
      const metaCode = metaError.code != null ? String(metaError.code) : '';

      // Meta #133005 — number already has a two-step PIN; caller must use that PIN.
      if (
        metaCode === '133005' ||
        /pin mismatch|two step verification pin/i.test(metaMessage)
      ) {
        throw new BadRequestException(
          'Two-step PIN mismatch. Enter the existing 6-digit PIN for this number in Meta (WhatsApp Manager), or reset it there first.',
        );
      }

      // Meta #133016 — register/deregister rate limit for this phone number.
      if (
        metaCode === '133016' ||
        /too many attempts for this phone number/i.test(metaMessage)
      ) {
        throw new BadRequestException(
          'Too many registration attempts for this phone number. Wait about 1 hour (sometimes up to a few hours), then try again with the correct PIN. Do not keep retrying.',
        );
      }

      if (/already registered|already been registered/i.test(metaMessage)) {
        await this.prisma.developerPhoneNumber.update({
          where: { id: phone.id },
          data: { status: 'ACTIVE' },
        });
        return { success: true, status: 'ACTIVE', alreadyRegistered: true };
      }

      throw new BadRequestException(
        metaMessage || 'Failed to register phone number',
      );
    }
  }

  private async prepareMetaProfileImage(
    buffer: Buffer,
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    const detected = await fromBuffer(buffer);
    const mimeType = detected?.mime;

    if (mimeType && META_PROFILE_MIME_TYPES.has(mimeType)) {
      return { buffer, mimeType };
    }

    if (mimeType === 'image/webp' || !mimeType) {
      const converted = await sharp(buffer).rotate().jpeg({ quality: 90 }).toBuffer();
      return { buffer: converted, mimeType: 'image/jpeg' };
    }

    throw new BadRequestException(
      'Profile picture must be JPEG or PNG (WebP is converted automatically)',
    );
  }

  private async pushProfilePictureToMeta(
    phoneNumberId: string,
    accessToken: string,
    storageKey: string,
    userId: string,
    appId: string,
  ) {
    this.appsUpload.assertKeyBelongsToApp(userId, appId, storageKey, 'profile');

    const raw = await this.s3Service.getObject(this.bucket, storageKey);
    if (!raw?.length) {
      throw new BadRequestException('Profile picture file not found');
    }

    const { buffer, mimeType } = await this.prepareMetaProfileImage(raw);
    const handle = await this.metaApi.uploadResumableFile(
      accessToken,
      buffer,
      mimeType,
    );

    await this.metaApi.updateBusinessProfile(phoneNumberId, accessToken, {
      profile_picture_handle: handle,
    });

    return handle;
  }

  /**
   * رفع صورة البروفايل إلى التخزين و Meta
   */
  async uploadProfilePicture(
    userId: string,
    appId: string,
    phoneId: string,
    image: string,
  ) {
    const developerAppId = await this.resolveDeveloperAppId(userId, appId);
    const phone = await this.prisma.developerPhoneNumber.findFirst({
      where: this.phoneWhere(phoneId, userId, developerAppId),
      include: { account: true },
    });

    if (!phone) throw new NotFoundException('Phone number not found');
    if (!phone.account.accessTokenEncrypted) {
      throw new BadRequestException('WABA account token not available');
    }

    const accessToken = this.tokenEncryption.decrypt(
      phone.account.accessTokenEncrypted,
    );

    try {
      const { key } = await this.appsUpload.uploadImageData(
        userId,
        appId,
        'profile',
        image,
      );

      await this.pushProfilePictureToMeta(
        phone.phoneNumberId,
        accessToken,
        key,
        userId,
        appId,
      );

      await this.prisma.developerPhoneNumber.update({
        where: { id: phone.id },
        data: { profilePictureUrl: key },
      });

      this.logger.log(`WhatsApp profile picture updated for ${phone.phoneNumberId}`);

      return { success: true, profilePictureUrl: key };
    } catch (error) {
      const errorData = error.response?.data?.error || {};
      throw new BadRequestException({
        message: 'Failed to upload profile picture',
        error: errorData.message || error.message,
      });
    }
  }

  /**
   * تحديث بروفايل الرقم
   */
  async updateProfile(
    userId: string,
    appId: string,
    phoneId: string,
    dto: UpdatePhoneProfileDto,
  ) {
    const developerAppId = await this.resolveDeveloperAppId(userId, appId);
    const phone = await this.prisma.developerPhoneNumber.findFirst({
      where: this.phoneWhere(phoneId, userId, developerAppId),
      include: {
        account: true,
      },
    });

    if (!phone) throw new NotFoundException('Phone number not found');
    if (!phone.account.accessTokenEncrypted) {
      throw new BadRequestException('WABA account token not available');
    }

    const accessToken = this.tokenEncryption.decrypt(
      phone.account.accessTokenEncrypted,
    );

    try {
      const metaPayload: Record<string, any> = {};
      if (dto.about !== undefined) metaPayload.about = dto.about;
      if (dto.address !== undefined) metaPayload.address = dto.address;
      if (dto.description !== undefined)
        metaPayload.description = dto.description;
      if (dto.email !== undefined) metaPayload.email = dto.email;
      if (dto.websites !== undefined) metaPayload.websites = dto.websites;

      const pictureChanged =
        dto.profilePictureUrl !== undefined &&
        dto.profilePictureUrl !== phone.profilePictureUrl;

      if (pictureChanged && dto.profilePictureUrl) {
        await this.pushProfilePictureToMeta(
          phone.phoneNumberId,
          accessToken,
          dto.profilePictureUrl,
          userId,
          appId,
        );
      }

      if (Object.keys(metaPayload).length > 0) {
        await this.metaApi.updateBusinessProfile(
          phone.phoneNumberId,
          accessToken,
          metaPayload,
        );
      }

      // تحديث محلي (includes profilePictureUrl for local display)
      await this.prisma.developerPhoneNumber.update({
        where: { id: phone.id },
        data: {
          aboutText: dto.about,
          profilePictureUrl: dto.profilePictureUrl,
          address: dto.address,
          description: dto.description,
          email: dto.email,
          websites: dto.websites ?? undefined,
        },
      });

      return { success: true };
    } catch (error) {
      const errorData = error.response?.data?.error || {};
      throw new BadRequestException({
        message: 'Failed to update profile',
        error: errorData.message || error.message,
      });
    }
  }

  async sendTestMessage(
    userId: string,
    appId: string,
    phoneId: string,
    dto: SendTestMessageDto,
  ): Promise<never> {
    throw new GoneException(
      'Test sending is disabled because WhatsApp test keys are not sandboxed. Use the paid WhatsApp API with an rk_live_ key.',
    );
  }
}
