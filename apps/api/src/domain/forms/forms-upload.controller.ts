import {
  Controller,
  Post,
  Param,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
  Request,
  BadRequestException,
  ForbiddenException,
  Body,
  GoneException,
  Req,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { FormsUploadCleanupService } from './services/forms-upload-cleanup.service';
import { FormsPublicUploadService } from './services/forms-public-upload.service';
import { RedisService } from '../../core/cache/redis.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { S3Service } from '../../services/s3.service';
import { v4 as uuidv4 } from 'uuid';
import { FileValidationPipe } from '../../core/common/pipes/file-validation.pipe';
import { generateSecureFilename } from '../../core/common/utils/file-security.util';
import { FormTeamAccessService } from './form-team/form-team-access.service';

interface PresignFileInfo {
  name: string;
  type: string;
  size: number;
}

@ApiTags('Forms - File Upload')
@Controller('forms')
export class FormsUploadController {
  private readonly bucket = process.env.S3_BUCKET || 'rukny-storage';
  private readonly maxFileSizeMB = 5;
  private readonly maxFiles = 5;
  private readonly allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  constructor(
    private prisma: PrismaService,
    private s3Service: S3Service,
    private uploadCleanup: FormsUploadCleanupService,
    private redis: RedisService,
    private publicUpload: FormsPublicUploadService,
    private formTeamAccess: FormTeamAccessService,
  ) {}

  private getClientIp(req: ExpressRequest): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || '127.0.0.1';
  }

  @Post(':id/upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload files for form field' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const formId = Array.isArray(req.params.id)
            ? req.params.id[0]
            : req.params.id;
          const uploadPath = join(process.cwd(), 'uploads', 'forms', formId);

          // Create directory if it doesn't exist
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }

          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          // 🔒 Use secure UUID-based filename instead of client-supplied name
          const allowedExtensions = [
            '.jpg',
            '.jpeg',
            '.png',
            '.gif',
            '.webp',
            '.bmp',
            '.tiff',
            '.pdf',
            '.doc',
            '.docx',
            '.xls',
            '.xlsx',
            '.txt',
            '.csv',
          ];
          const ext = extname(file.originalname).toLowerCase();
          const safeExt = allowedExtensions.includes(ext) ? ext : '.bin';
          const filename = `${uuidv4()}${safeExt}`;
          cb(null, filename);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/bmp',
          'image/tiff',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv',
        ];

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `Unsupported file type: ${file.mimetype}. Allowed: images, PDF, documents, and text files.`,
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadFiles(
    @Request() req,
    @Param('id') formId: string,
    @UploadedFiles(
      new FileValidationPipe({
        allowedTypes: [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/bmp',
          'image/tiff',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv',
        ],
        maxSize: 10 * 1024 * 1024,
      }),
    )
    files: Array<Express.Multer.File>,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Verify form exists and is accessible
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throw new BadRequestException('Form not found');
    }

    await this.formTeamAccess.assertFormPermission(
      form,
      req.user.id,
      'edit_form',
      'Not authorized to upload to this form',
    );

    // Return file information
    const uploadedFiles = files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/forms/${formId}/${file.filename}`,
      url: `${process.env.API_URL || 'http://localhost:3001'}/uploads/forms/${formId}/${file.filename}`,
    }));

    return {
      success: true,
      files: uploadedFiles,
    };
  }

  /**
   * Get presigned URLs for direct S3 upload (form cover/banner images)
   */
  @Post('upload/presign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get presigned URLs for direct S3 upload of form images',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              size: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async getPresignedUrls(
    @Request() req,
    @Body() body: { files: PresignFileInfo[] },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const files = body.files || [];
    if (files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > this.maxFiles) {
      throw new BadRequestException(`Maximum ${this.maxFiles} files allowed`);
    }

    const results: { key: string; url: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!this.allowedTypes.includes(file.type)) {
        throw new BadRequestException(
          `Invalid file type: ${file.type}. Allowed: ${this.allowedTypes.join(', ')}`,
        );
      }

      // Validate file size
      if (file.size > this.maxFileSizeMB * 1024 * 1024) {
        throw new BadRequestException(
          `File too large. Maximum size: ${this.maxFileSizeMB}MB`,
        );
      }

      // Generate unique key
      const ext = file.name.includes('.') ? file.name.split('.').pop() : 'webp';
      const key = `users/${userId}/forms/temp/${uuidv4()}.${ext}`;

      // Get presigned PUT URL
      const url = await this.s3Service.getPresignedPutUrl(
        this.bucket,
        key,
        file.type,
        3600, // 1 hour expiry
      );

      results.push({ key, url });
    }

    return results;
  }

  /**
   * Get presigned URLs for a specific form
   */
  @Post(':id/upload/presign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get presigned URLs for direct S3 upload of form images',
  })
  async getPresignedUrlsForForm(
    @Request() req,
    @Param('id') formId: string,
    @Body() body: { files: PresignFileInfo[] },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      select: { id: true, userId: true },
    });

    if (!form) {
      throw new BadRequestException('Form not found');
    }

    await this.formTeamAccess.assertFormPermission(
      form,
      userId,
      'edit_form',
      'Not authorized to upload to this form',
    );

    const files = body.files || [];
    if (files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > this.maxFiles) {
      throw new BadRequestException(`Maximum ${this.maxFiles} files allowed`);
    }

    const results: { key: string; url: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!this.allowedTypes.includes(file.type)) {
        throw new BadRequestException(
          `Invalid file type: ${file.type}. Allowed: ${this.allowedTypes.join(', ')}`,
        );
      }

      // Validate file size
      if (file.size > this.maxFileSizeMB * 1024 * 1024) {
        throw new BadRequestException(
          `File too large. Maximum size: ${this.maxFileSizeMB}MB`,
        );
      }

      // Generate unique key for this form
      const ext = file.name.includes('.') ? file.name.split('.').pop() : 'webp';
      const key = `users/${userId}/forms/${formId}/banners/${uuidv4()}.${ext}`;

      // Get presigned PUT URL
      const url = await this.s3Service.getPresignedPutUrl(
        this.bucket,
        key,
        file.type,
        3600,
      );

      results.push({ key, url });
    }

    return results;
  }

  /**
   * Confirm uploaded files (optional - for tracking)
   */
  @Post('upload/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm uploaded files' })
  async confirmUpload(@Request() req, @Body() body: { keys: string[] }) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const keys = body.keys || [];
    if (keys.length === 0) {
      return { ok: true, confirmed: 0 };
    }

    // Verify keys belong to this user
    const validKeys = keys.filter((key) => key.startsWith(`users/${userId}/`));

    for (const key of validKeys) {
      await this.redis.set(`form:upload:confirmed:${userId}:${key}`, '1', 7 * 24 * 3600);
    }

    return { ok: true, confirmed: validKeys.length, keys: validKeys };
  }

  /**
   * Confirm uploaded files for a specific form
   */
  @Post(':id/upload/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm uploaded files for a form' })
  async confirmUploadForForm(
    @Request() req,
    @Param('id') formId: string,
    @Body() body: { keys: string[] },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User not authenticated');
    }

    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      select: { id: true, userId: true },
    });

    if (!form) {
      throw new BadRequestException('Form not found');
    }

    await this.formTeamAccess.assertFormPermission(
      form,
      userId,
      'edit_form',
      'Not authorized',
    );

    const keys = body.keys || [];
    return { ok: true, confirmed: keys.length };
  }

  @Post('public/:slug/upload/session')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Create a short-lived S3 upload session for a public form',
  })
  async createPublicUploadSession(
    @Param('slug') slug: string,
    @Req() req: ExpressRequest,
  ) {
    return this.publicUpload.createSession(slug, this.getClientIp(req));
  }

  @Post('public/:slug/upload/presign')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({
    summary: 'Get presigned PUT URLs for public form file uploads (S3)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['sessionToken', 'files'],
      properties: {
        sessionToken: { type: 'string' },
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              size: { type: 'number' },
            },
          },
        },
      },
    },
  })
  async presignPublicUpload(
    @Param('slug') slug: string,
    @Req() req: ExpressRequest,
    @Body()
    body: {
      sessionToken: string;
      files: PresignFileInfo[];
    },
  ) {
    return this.publicUpload.getPresignedUrls(
      slug,
      body.sessionToken,
      body.files || [],
      this.getClientIp(req),
    );
  }

  /** @deprecated Use POST public/:slug/upload/session + presign instead */
  @Post('public/:slug/upload')
  @ApiOperation({
    summary: '[Deprecated] Disk upload removed — use session + presign',
  })
  async uploadFilesPublic() {
    throw new GoneException(
      'Direct disk upload is disabled. Use POST /forms/public/:slug/upload/session and /upload/presign.',
    );
  }
}
