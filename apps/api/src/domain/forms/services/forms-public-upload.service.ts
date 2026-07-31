import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { RedisService } from '../../../core/cache/redis.service';
import { S3Service } from '../../../services/s3.service';
import {
  FORMS_PUBLIC_UPLOAD_ALLOWED_MIMES,
  FORMS_PUBLIC_UPLOAD_DAILY_FORM_BYTES,
  FORMS_PUBLIC_UPLOAD_DAILY_IP_BYTES,
  FORMS_PUBLIC_UPLOAD_MAX_FILE_BYTES,
  FORMS_PUBLIC_UPLOAD_MAX_FILES_PER_SESSION,
  FORMS_PUBLIC_UPLOAD_SESSION_TTL_SECONDS,
} from '../forms.constants';

export interface PublicUploadFileMeta {
  name: string;
  type: string;
  size: number;
}

interface UploadSessionPayload {
  formId: string;
  slug: string;
  fileCount: number;
  expiresAt: string;
}

@Injectable()
export class FormsPublicUploadService {
  private readonly bucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly s3: S3Service,
    config: ConfigService,
  ) {
    this.bucket = config.get('S3_BUCKET') || process.env.S3_BUCKET || 'rukny-storage';
  }

  async createSession(slug: string, clientIp: string) {
    const form = await this.getPublishedForm(slug);
    const sessionToken = randomUUID();
    const expiresAt = new Date(
      Date.now() + FORMS_PUBLIC_UPLOAD_SESSION_TTL_SECONDS * 1000,
    );

    const payload: UploadSessionPayload = {
      formId: form.id,
      slug: form.slug,
      fileCount: 0,
      expiresAt: expiresAt.toISOString(),
    };

    await this.redis.set(
      this.sessionKey(sessionToken),
      JSON.stringify(payload),
      FORMS_PUBLIC_UPLOAD_SESSION_TTL_SECONDS,
    );

    return {
      sessionToken,
      expiresAt: expiresAt.toISOString(),
      maxFiles: FORMS_PUBLIC_UPLOAD_MAX_FILES_PER_SESSION,
      maxFileBytes: FORMS_PUBLIC_UPLOAD_MAX_FILE_BYTES,
    };
  }

  async getPresignedUrls(
    slug: string,
    sessionToken: string,
    files: PublicUploadFileMeta[],
    clientIp: string,
  ) {
    if (!sessionToken?.trim()) {
      throw new BadRequestException('sessionToken is required');
    }

    const form = await this.getPublishedForm(slug);
    const session = await this.loadSession(sessionToken);

    if (session.formId !== form.id || session.slug !== form.slug) {
      throw new ForbiddenException('Invalid upload session for this form');
    }

    if (!files?.length) {
      throw new BadRequestException('No files provided');
    }

    const remaining =
      FORMS_PUBLIC_UPLOAD_MAX_FILES_PER_SESSION - session.fileCount;
    if (files.length > remaining) {
      throw new BadRequestException(
        `Maximum ${FORMS_PUBLIC_UPLOAD_MAX_FILES_PER_SESSION} files per session`,
      );
    }

    let totalBytes = 0;
    for (const file of files) {
      this.assertAllowedFile(file);
      totalBytes += file.size;
    }

    await this.assertQuota(form.id, clientIp, totalBytes);

    const results: Array<{
      key: string;
      url: string;
      readUrl: string;
      originalName: string;
      contentType: string;
    }> = [];

    for (const file of files) {
      const ext = this.safeExtension(file.name, file.type);
      const key = `forms/public/${form.id}/sessions/${sessionToken}/${randomUUID()}.${ext}`;
      const url = await this.s3.getPresignedPutUrl(
        this.bucket,
        key,
        file.type,
        FORMS_PUBLIC_UPLOAD_SESSION_TTL_SECONDS,
      );
      const readUrl = await this.s3.getPresignedGetUrl(
        this.bucket,
        key,
        FORMS_PUBLIC_UPLOAD_SESSION_TTL_SECONDS,
      );
      results.push({
        key,
        url,
        readUrl,
        originalName: file.name,
        contentType: file.type,
      });
    }

    session.fileCount += files.length;
    const ttl = Math.max(
      60,
      Math.floor(
        (new Date(session.expiresAt).getTime() - Date.now()) / 1000,
      ),
    );
    await this.redis.set(
      this.sessionKey(sessionToken),
      JSON.stringify(session),
      ttl,
    );

    return { files: results };
  }

  /**
   * Validates public-upload S3 keys on form submit and attaches short-lived read URLs.
   */
  async normalizeSubmissionFiles(
    formId: string,
    fields: { id: string; type: string }[],
    data: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const out = { ...data };

    for (const field of fields) {
      if (field.type !== 'FILE') continue;

      const raw = out[field.id];
      if (raw == null || typeof raw !== 'object') continue;

      const file = raw as Record<string, unknown>;
      const key = typeof file.key === 'string' ? file.key : '';
      const sessionToken =
        typeof file.sessionToken === 'string' ? file.sessionToken : '';

      if (!key || !sessionToken) {
        throw new BadRequestException(
          `Invalid file upload for field ${field.id}`,
        );
      }

      const expectedPrefix = `forms/public/${formId}/sessions/${sessionToken}/`;
      if (!key.startsWith(expectedPrefix) || key.includes('..')) {
        throw new BadRequestException('Invalid file key');
      }

      await this.loadSession(sessionToken);

      const exists = await this.s3.objectExists(this.bucket, key);
      if (!exists) {
        throw new BadRequestException(
          'Uploaded file not found. Please upload again.',
        );
      }

      const readUrl = await this.s3.getPresignedGetUrl(
        this.bucket,
        key,
        86400,
      );

      out[field.id] = {
        key,
        name: file.name ?? key.split('/').pop(),
        type: file.type,
        size: file.size,
        url: readUrl,
      };
    }

    return out;
  }

  /**
   * Persist a canvas signature (data URL) to S3 and return a short-lived read URL.
   */
  async persistSignature(
    formId: string,
    submissionId: string,
    fieldId: string,
    dataUrl: string,
  ): Promise<{
    key: string;
    name: string;
    type: string;
    url: string;
  }> {
    const normalized = this.normalizeSignatureDataUrl(dataUrl);
    const match = normalized.match(/^data:(image\/[\w+.-]+);base64,(.+)$/is);
    if (!match) {
      throw new BadRequestException('Invalid signature image data');
    }

    const contentType = match[1];
    const base64 = match[2].replace(/\s/g, '');
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length === 0 || buffer.length > 2 * 1024 * 1024) {
      throw new BadRequestException('Signature image is empty or too large');
    }

    const safeFieldId = fieldId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'signature';
    const key = `forms/submissions/${formId}/${submissionId}/signatures/${safeFieldId}.png`;

    await this.s3.uploadBuffer(this.bucket, key, buffer, contentType);

    const url = await this.s3.getPresignedGetUrl(this.bucket, key, 86400 * 7);

    return {
      key,
      name: 'signature.png',
      type: contentType,
      url,
    };
  }

  private normalizeSignatureDataUrl(value: string): string {
    let s = value.trim();
    s = s.replace(/^(data:image\/[\w+.-]+)base64,/i, '$1;base64,');
    if (!s.startsWith('data:') && s.includes(';base64,')) {
      s = `data:${s}`;
    }
    return s;
  }

  private async getPublishedForm(slug: string) {
    const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeSlug) {
      throw new BadRequestException('Invalid form slug');
    }

    const form = await this.prisma.form.findUnique({
      where: { slug: safeSlug },
      select: { id: true, slug: true, status: true },
    });

    if (!form) throw new NotFoundException('Form not found');
    if (form.status !== 'PUBLISHED') {
      throw new BadRequestException('Form is not accepting submissions');
    }

    return form;
  }

  private async loadSession(sessionToken: string): Promise<UploadSessionPayload> {
    const raw = await this.redis.get<string>(this.sessionKey(sessionToken));
    if (!raw) {
      throw new BadRequestException('Upload session expired or invalid');
    }

    try {
      const parsed =
        typeof raw === 'string' ? (JSON.parse(raw) as UploadSessionPayload) : raw;
      if (new Date(parsed.expiresAt).getTime() < Date.now()) {
        throw new BadRequestException('Upload session expired');
      }
      return parsed;
    } catch {
      throw new BadRequestException('Upload session expired or invalid');
    }
  }

  private assertAllowedFile(file: PublicUploadFileMeta) {
    const allowed = FORMS_PUBLIC_UPLOAD_ALLOWED_MIMES as readonly string[];
    if (!allowed.includes(file.type)) {
      throw new BadRequestException(`Unsupported file type: ${file.type}`);
    }
    if (file.size > FORMS_PUBLIC_UPLOAD_MAX_FILE_BYTES) {
      throw new BadRequestException(
        `File too large. Maximum size: ${FORMS_PUBLIC_UPLOAD_MAX_FILE_BYTES} bytes`,
      );
    }
    if (!file.name?.trim()) {
      throw new BadRequestException('File name is required');
    }
  }

  private async assertQuota(formId: string, clientIp: string, bytes: number) {
    const day = new Date().toISOString().slice(0, 10);
    const ipHash = createHash('sha256').update(clientIp || 'unknown').digest('hex');

    const ipKey = `form:upload:pub:quota:ip:${ipHash}:${day}`;
    const formKey = `form:upload:pub:quota:form:${formId}:${day}`;

    const ipUsed = await this.incrQuota(ipKey, bytes);
    if (ipUsed > FORMS_PUBLIC_UPLOAD_DAILY_IP_BYTES) {
      throw new BadRequestException('Daily upload quota exceeded for this network');
    }

    const formUsed = await this.incrQuota(formKey, bytes);
    if (formUsed > FORMS_PUBLIC_UPLOAD_DAILY_FORM_BYTES) {
      throw new BadRequestException('Daily upload quota exceeded for this form');
    }
  }

  private async incrQuota(key: string, bytes: number): Promise<number> {
    const current = await this.redis.hincrby(key, 'bytes', bytes);
    if (current === bytes) {
      await this.redis.expire(key, 86400);
    }
    return current;
  }

  private safeExtension(name: string, mime: string): string {
    const fromName = name.includes('.') ? name.split('.').pop() : '';
    if (fromName && /^[a-z0-9]+$/i.test(fromName)) {
      return fromName.toLowerCase();
    }
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'application/pdf': 'pdf',
      'text/plain': 'txt',
    };
    return map[mime] || 'bin';
  }

  private sessionKey(token: string): string {
    return `form:upload:pub:session:${token}`;
  }
}
