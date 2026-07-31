import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { fromBuffer } from 'file-type';
import sharp from 'sharp';
import { S3Service } from '../../../shared/services/s3.service';
import { PrismaService } from '../../../core/database/prisma/prisma.service';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 2;

@Injectable()
export class AppsUploadService {
  private readonly bucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly configService: ConfigService,
  ) {
    this.bucket = this.configService.get<string>('S3_BUCKET', 'rukny-storage');
  }

  private async assertAppOwnership(userId: string, appId: string) {
    const app = await this.prisma.developerApp.findFirst({
      where: { appId, userId, status: { not: 'DELETED' } },
      select: { id: true, appId: true },
    });
    if (!app) throw new NotFoundException('App not found');
    return app;
  }

  async presignImages(
    userId: string,
    appId: string,
    type: 'icon' | 'profile',
    files: { name: string; type: string; size: number }[],
  ) {
    await this.assertAppOwnership(userId, appId);

    if (!files.length) {
      throw new BadRequestException('No files provided');
    }
    if (files.length > 1) {
      throw new BadRequestException('Only one file allowed per request');
    }

    const file = files[0];

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new BadRequestException(
        `File too large. Maximum size: ${MAX_FILE_SIZE_MB}MB`,
      );
    }

    const ext = file.name.includes('.')
      ? file.name.split('.').pop()?.toLowerCase()
      : 'webp';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')
      ? ext === 'jpeg'
        ? 'jpg'
        : ext
      : 'webp';

    const key = `users/${userId}/developer-apps/${appId}/${type}/${uuidv4()}.${safeExt}`;
    const url = await this.s3Service.getPresignedPutUrl(
      this.bucket,
      key,
      file.type,
      3600,
    );

    return [{ key, url }];
  }

  private parseImageDataUrl(image: string): Buffer {
    const trimmed = image.trim();
    const match = trimmed.match(/^data:([^;]+);base64,([\s\S]+)$/i);
    if (!match) {
      throw new BadRequestException(
        'Invalid image. Use JPEG, PNG, or WebP',
      );
    }

    const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
    if (!buffer.length) {
      throw new BadRequestException('No file provided');
    }
    if (buffer.length > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new BadRequestException(
        `File too large. Maximum size: ${MAX_FILE_SIZE_MB}MB`,
      );
    }

    return buffer;
  }

  private async uploadImageBuffer(
    userId: string,
    appId: string,
    type: 'icon' | 'profile',
    buffer: Buffer,
  ) {
    await this.assertAppOwnership(userId, appId);

    if (!buffer.length) {
      throw new BadRequestException('No file provided');
    }

    if (buffer.length > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new BadRequestException(
        `File too large. Maximum size: ${MAX_FILE_SIZE_MB}MB`,
      );
    }

    const detected = await fromBuffer(buffer);
    if (!detected?.mime || !ALLOWED_TYPES.includes(detected.mime)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
      );
    }

    const ext =
      detected.mime === 'image/jpeg'
        ? 'jpg'
        : detected.mime === 'image/png'
          ? 'png'
          : 'webp';

    const key = `users/${userId}/developer-apps/${appId}/${type}/${uuidv4()}.${ext}`;
    const body = await sharp(buffer).rotate().toBuffer();

    await this.s3Service.uploadBuffer(this.bucket, key, body, detected.mime);

    return { key };
  }

  /** JSON/base64 upload — reliable through Next.js BFF rewrites (no multipart) */
  async uploadImageData(
    userId: string,
    appId: string,
    type: 'icon' | 'profile',
    image: string,
  ) {
    const buffer = this.parseImageDataUrl(image);
    return this.uploadImageBuffer(userId, appId, type, buffer);
  }

  /** Server-side upload — avoids browser→S3 CORS on presigned PUT */
  async uploadImage(
    userId: string,
    appId: string,
    type: 'icon' | 'profile',
    file: Express.Multer.File,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('No file provided');
    }

    return this.uploadImageBuffer(userId, appId, type, file.buffer);
  }

  assertKeyBelongsToApp(
    userId: string,
    appId: string,
    key: string,
    type: 'icon' | 'profile',
  ) {
    const prefix = `users/${userId}/developer-apps/${appId}/${type}/`;
    if (!key.startsWith(prefix)) {
      throw new BadRequestException('Invalid storage key for this app');
    }
  }
}
