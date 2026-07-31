import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { fromBuffer } from 'file-type';
import { RedisService } from '../../core/cache/redis.service';
import { S3Service } from '../../shared/services/s3.service';
import {
  IDENTITY_ALLOWED_MIMES,
  IDENTITY_UPLOAD_SLOTS,
  IDENTITY_MAX_FILE_BYTES,
  IDENTITY_PRESIGN_TTL_SECONDS,
  IDENTITY_SESSION_TTL_SECONDS,
  IDENTITY_UPLOAD_PREFIX,
  IdentityDocumentSlot,
  IdentityDocumentType,
  requiredIdentitySlots,
} from './identity.constants';

interface IdentityUploadSession {
  userId: string;
  sessionId: string;
  slots: Partial<Record<IdentityDocumentSlot, string>>;
  expiresAt: string;
}

@Injectable()
export class IdentityUploadService {
  private readonly logger = new Logger(IdentityUploadService.name);
  private readonly bucket: string;

  constructor(
    private readonly redis: RedisService,
    private readonly s3: S3Service,
    config: ConfigService,
  ) {
    this.bucket = config.get('S3_BUCKET') || process.env.S3_BUCKET || 'rukny-storage';
  }

  async createUploadSession(userId: string) {
    const sessionId = randomUUID();
    const expiresAt = new Date(
      Date.now() + IDENTITY_SESSION_TTL_SECONDS * 1000,
    ).toISOString();

    const payload: IdentityUploadSession = {
      userId,
      sessionId,
      slots: {},
      expiresAt,
    };

    await this.redis.set(
      this.sessionKey(userId, sessionId),
      payload,
      IDENTITY_SESSION_TTL_SECONDS,
    );

    return {
      sessionId,
      expiresAt,
      maxFileBytes: IDENTITY_MAX_FILE_BYTES,
      allowedMimeTypes: [...IDENTITY_ALLOWED_MIMES],
      presignExpiresIn: IDENTITY_PRESIGN_TTL_SECONDS,
    };
  }

  async requestPresignedUpload(
    userId: string,
    sessionId: string,
    slot: IdentityDocumentSlot,
    contentType: string,
    fileName: string,
    fileSize: number,
  ) {
    if (!IDENTITY_UPLOAD_SLOTS.includes(slot)) {
      throw new BadRequestException('نوع الملف غير صالح');
    }

    if (!IDENTITY_ALLOWED_MIMES.includes(contentType as (typeof IDENTITY_ALLOWED_MIMES)[number])) {
      throw new BadRequestException('نوع الصورة غير مسموح. استخدم JPEG أو PNG أو WebP');
    }

    if (!fileSize || fileSize > IDENTITY_MAX_FILE_BYTES) {
      throw new BadRequestException('حجم الملف يتجاوز الحد المسموح (5 MB)');
    }

    this.validateFileName(fileName);

    const session = await this.loadSession(userId, sessionId);
    const ext = this.extensionFromMime(contentType);
    const key = `${IDENTITY_UPLOAD_PREFIX}/${userId}/${sessionId}/${slot}.${ext}`;

    if (!key.startsWith(`${IDENTITY_UPLOAD_PREFIX}/${userId}/`)) {
      throw new ForbiddenException('مسار التخزين غير صالح');
    }

    const uploadUrl = await this.s3.getPresignedPutUrl(
      this.bucket,
      key,
      contentType,
      IDENTITY_PRESIGN_TTL_SECONDS,
    );

    session.slots[slot] = key;
    await this.saveSession(session);

    return {
      slot,
      key,
      uploadUrl,
      expiresIn: IDENTITY_PRESIGN_TTL_SECONDS,
      maxFileSize: IDENTITY_MAX_FILE_BYTES,
    };
  }

  /** Server-side upload — avoids browser→S3 CORS on presigned PUT */
  async uploadSlotFile(
    userId: string,
    sessionId: string,
    slot: IdentityDocumentSlot,
    fileBuffer: Buffer,
    contentType: string,
    fileName: string,
  ) {
    if (!IDENTITY_UPLOAD_SLOTS.includes(slot)) {
      throw new BadRequestException('نوع الملف غير صالح');
    }

    if (
      !IDENTITY_ALLOWED_MIMES.includes(
        contentType as (typeof IDENTITY_ALLOWED_MIMES)[number],
      )
    ) {
      throw new BadRequestException(
        'نوع الصورة غير مسموح. استخدم JPEG أو PNG أو WebP',
      );
    }

    if (!fileBuffer?.length || fileBuffer.length > IDENTITY_MAX_FILE_BYTES) {
      throw new BadRequestException('حجم الملف يتجاوز الحد المسموح (5 MB)');
    }

    this.validateFileName(fileName);

    const detected = await fromBuffer(fileBuffer);
    if (
      !detected?.mime ||
      !IDENTITY_ALLOWED_MIMES.includes(
        detected.mime as (typeof IDENTITY_ALLOWED_MIMES)[number],
      )
    ) {
      throw new BadRequestException('محتوى الملف غير صالح');
    }

    const session = await this.loadSession(userId, sessionId);
    const ext = this.extensionFromMime(detected.mime);
    const key = `${IDENTITY_UPLOAD_PREFIX}/${userId}/${sessionId}/${slot}.${ext}`;

    if (!key.startsWith(`${IDENTITY_UPLOAD_PREFIX}/${userId}/`)) {
      throw new ForbiddenException('مسار التخزين غير صالح');
    }

    const stripped = await sharp(fileBuffer)
      .rotate()
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();

    await this.s3.uploadBuffer(this.bucket, key, stripped, 'image/jpeg');

    session.slots[slot] = key;
    await this.saveSession(session);

    return {
      slot,
      key,
      uploaded: true,
    };
  }

  async finalizeSessionUploads(
    userId: string,
    sessionId: string,
    documentType: IdentityDocumentType,
  ): Promise<Record<IdentityDocumentSlot, string>> {
    const session = await this.loadSession(userId, sessionId);
    const required = requiredIdentitySlots(documentType);

    for (const slot of required) {
      const key = session.slots[slot];
      if (!key) {
        throw new BadRequestException(`الملف المطلوب غير مرفوع: ${slot}`);
      }
      this.assertKeyOwnership(userId, sessionId, key);

      const exists = await this.s3.objectExists(this.bucket, key);
      if (!exists) {
        throw new BadRequestException(
          'أحد الملفات غير موجود. يرجى إعادة الرفع.',
        );
      }

      await this.stripExifAndReupload(key);
      await this.validateImageMagicBytes(key);
    }

    const result = {} as Record<IdentityDocumentSlot, string>;
    for (const slot of required) {
      result[slot] = session.slots[slot]!;
    }

    await this.redis.del(this.sessionKey(userId, sessionId));
    return result;
  }

  async deleteIdentityKeys(keys: (string | null | undefined)[]): Promise<void> {
    const valid = keys.filter(
      (k): k is string =>
        Boolean(k?.trim()) && k!.startsWith(`${IDENTITY_UPLOAD_PREFIX}/`),
    );
    if (valid.length === 0) return;
    await this.s3.deleteObjects(this.bucket, valid);
  }

  collectVerificationKeys(record: {
    documentFrontUrl: string;
    documentBackUrl?: string | null;
    residenceFrontKey?: string | null;
    residenceBackKey?: string | null;
    selfieUrl?: string | null;
  }): string[] {
    return [
      record.documentFrontUrl,
      record.documentBackUrl,
      record.residenceFrontKey,
      record.residenceBackKey,
      record.selfieUrl,
    ].filter((k): k is string => Boolean(k?.trim()));
  }

  async getAdminPresignedViewUrl(
    key: string,
    userId: string,
    expiresIn = 120,
  ): Promise<string> {
    this.assertKeyBelongsToUser(key, userId);
    return this.s3.getPresignedGetUrl(this.bucket, key, expiresIn);
  }

  slotToRecordField(
    slot: IdentityDocumentSlot,
  ):
    | 'documentFrontUrl'
    | 'documentBackUrl'
    | 'residenceFrontKey'
    | 'residenceBackKey'
    | 'selfieUrl' {
    switch (slot) {
      case 'primary_front':
        return 'documentFrontUrl';
      case 'primary_back':
        return 'documentBackUrl';
      case 'residence_front':
        return 'residenceFrontKey';
      case 'residence_back':
        return 'residenceBackKey';
      case 'selfie':
        return 'selfieUrl';
      default:
        throw new BadRequestException('Invalid slot');
    }
  }

  private async stripExifAndReupload(key: string): Promise<void> {
    try {
      const buffer = await this.s3.getObject(this.bucket, key);
      if (!buffer) return;

      const stripped = await sharp(buffer)
        .rotate()
        .jpeg({ quality: 92, mozjpeg: true })
        .toBuffer();

      await this.s3.uploadBuffer(this.bucket, key, stripped, 'image/jpeg');
    } catch (err) {
      this.logger.warn(`EXIF strip failed for ${key}: ${err}`);
    }
  }

  private async validateImageMagicBytes(key: string): Promise<void> {
    const buffer = await this.s3.getObject(this.bucket, key);
    if (!buffer) {
      throw new BadRequestException('تعذّر التحقق من الملف المرفوع');
    }

    const detected = await fromBuffer(buffer);
    if (
      !detected?.mime ||
      !IDENTITY_ALLOWED_MIMES.includes(
        detected.mime as (typeof IDENTITY_ALLOWED_MIMES)[number],
      )
    ) {
      await this.s3.deleteObject(this.bucket, key);
      throw new BadRequestException('محتوى الملف غير صالح');
    }
  }

  private assertKeyOwnership(
    userId: string,
    sessionId: string,
    key: string,
  ): void {
    const expectedPrefix = `${IDENTITY_UPLOAD_PREFIX}/${userId}/${sessionId}/`;
    if (!key.startsWith(expectedPrefix) || key.includes('..')) {
      throw new ForbiddenException('مفتاح الملف غير صالح');
    }
  }

  private assertKeyBelongsToUser(key: string, userId: string): void {
    const expectedPrefix = `${IDENTITY_UPLOAD_PREFIX}/${userId}/`;
    if (!key.startsWith(expectedPrefix) || key.includes('..')) {
      throw new ForbiddenException('مفتاح الملف غير صالح');
    }
  }

  private validateFileName(fileName: string): void {
    if (!fileName || fileName.length > 200) {
      throw new BadRequestException('اسم الملف غير صالح');
    }
    if (/[\\<>:"|?*\x00-\x1f]/.test(fileName)) {
      throw new BadRequestException('اسم الملف غير صالح');
    }
  }

  private extensionFromMime(mime: string): string {
    switch (mime) {
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      default:
        return 'jpg';
    }
  }

  private sessionKey(userId: string, sessionId: string): string {
    return `identity:upload:${userId}:${sessionId}`;
  }

  private async loadSession(
    userId: string,
    sessionId: string,
  ): Promise<IdentityUploadSession> {
    const raw = await this.redis.get<IdentityUploadSession | string>(
      this.sessionKey(userId, sessionId),
    );
    if (!raw) {
      throw new BadRequestException(
        'انتهت جلسة الرفع. يرجى البدء من جديد.',
      );
    }

    const session =
      typeof raw === 'string'
        ? (JSON.parse(raw) as IdentityUploadSession)
        : raw;
    if (session.userId !== userId || session.sessionId !== sessionId) {
      throw new ForbiddenException('جلسة الرفع غير صالحة');
    }

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await this.redis.del(this.sessionKey(userId, sessionId));
      throw new BadRequestException('انتهت جلسة الرفع');
    }

    return session;
  }

  private async saveSession(session: IdentityUploadSession): Promise<void> {
    const ttl = Math.max(
      1,
      Math.floor(
        (new Date(session.expiresAt).getTime() - Date.now()) / 1000,
      ),
    );
    await this.redis.set(
      this.sessionKey(session.userId, session.sessionId),
      session,
      ttl,
    );
  }
}
