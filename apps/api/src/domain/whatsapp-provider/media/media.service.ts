import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { MetaApiService } from '../shared/meta-api.service';
import { TokenEncryptionService } from '../shared/token-encryption.service';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'video/mp4',
  'video/3gpp',
  'audio/aac',
  'audio/mp4',
  'audio/amr',
  'audio/mpeg',
  'audio/ogg',
  'application/pdf',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const MAX_MEDIA_BYTES = 16 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 100 * 1024 * 1024;

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metaApi: MetaApiService,
    private readonly tokenEncryption: TokenEncryptionService,
  ) {}

  async uploadMedia(
    userId: string,
    apiKeyId: string,
    file: Express.Multer.File,
    phoneNumberId?: string,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('File is required');
    }

    const mimeType = file.mimetype?.trim();
    if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new BadRequestException(
        `Unsupported media type. Allowed: ${[...ALLOWED_MIME_TYPES].join(', ')}`,
      );
    }

    const maxSize = DOCUMENT_MIME_TYPES.has(mimeType)
      ? MAX_DOCUMENT_BYTES
      : MAX_MEDIA_BYTES;

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Maximum size is ${Math.floor(maxSize / (1024 * 1024))}MB for this type.`,
      );
    }

    const apiKey = await this.prisma.developerApiKey.findFirst({
      where: { id: apiKeyId, userId, status: 'ACTIVE' },
      select: { developerAppId: true },
    });

    if (!apiKey?.developerAppId) {
      throw new BadRequestException('API key is not linked to an app');
    }

    const { account, phoneNumber } = await this.resolveActivePhone(
      userId,
      apiKey.developerAppId,
      phoneNumberId,
    );

    if (!account.accessTokenEncrypted) {
      throw new BadRequestException('WABA account token is not available');
    }

    const accessToken = this.tokenEncryption.decrypt(
      account.accessTokenEncrypted,
    );

    const filename = file.originalname?.trim() || 'upload';

    const result = await this.metaApi.uploadMedia(
      phoneNumber.phoneNumberId,
      accessToken,
      file.buffer,
      mimeType,
      filename,
    );

    return {
      id: result.id,
      mime_type: mimeType,
      phone_number_id: phoneNumber.phoneNumberId,
    };
  }

  private async resolveActivePhone(
    userId: string,
    developerAppId: string,
    phoneNumberId?: string,
  ) {
    const accounts = await this.prisma.developerWhatsappAccount.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        developerAppId,
      },
      include: {
        phoneNumbers: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (accounts.length === 0) {
      throw new BadRequestException(
        'No active WhatsApp Business Account. Please connect one first.',
      );
    }

    if (phoneNumberId) {
      for (const account of accounts) {
        const phone = account.phoneNumbers.find(
          (item) => item.phoneNumberId === phoneNumberId,
        );
        if (phone) {
          return { account, phoneNumber: phone };
        }
      }
      throw new NotFoundException('Phone number not found or not active');
    }

    const account = accounts[0];
    const phoneNumber = account.phoneNumbers[0];
    if (!phoneNumber) {
      throw new BadRequestException('No active phone number available');
    }

    return { account, phoneNumber };
  }
}
