import {
  Controller,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../core/common/decorators/auth/public.decorator';
import { FileValidationPipe } from '../../../core/common/pipes/file-validation.pipe';
import { ApiKeyAuthGuard } from '../../developer/api-keys/guards/api-key-auth.guard';
import { RequireScopes } from '../../developer/api-keys/decorators/require-scopes.decorator';
import { MediaService } from './media.service';

const ALLOWED_MEDIA_TYPES = [
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
];

@Public()
@ApiTags('WhatsApp API - Media')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(ApiKeyAuthGuard)
@Controller({ path: 'whatsapp/media', version: '1' })
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @RequireScopes('media:upload')
  @ApiOperation({ summary: 'رفع وسائط WhatsApp' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 100 * 1024 * 1024 } }),
  )
  uploadMedia(
    @Req() req: { userId: string; apiKeyId: string },
    @UploadedFile(
      new FileValidationPipe({
        allowedTypes: ALLOWED_MEDIA_TYPES,
        maxSize: 100 * 1024 * 1024,
      }),
    )
    file: Express.Multer.File,
    @Query('phone_number_id') phoneNumberId?: string,
  ) {
    return this.mediaService.uploadMedia(
      req.userId,
      req.apiKeyId,
      file,
      phoneNumberId,
    );
  }
}
