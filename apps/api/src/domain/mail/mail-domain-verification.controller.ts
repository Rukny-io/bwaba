import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { UploadMailBimiLogoDto } from './dto/mail-domain-verification.dto';
import { MailDomainVerificationService } from './mail-domain-verification.service';
import { BIMI_MAX_UPLOAD_BYTES, MailBimiService } from './mail-bimi.service';

@ApiTags('Mail - Domain verification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'mail/apps/:appId/domain-verification', version: '1' })
export class MailDomainVerificationController {
  constructor(
    private readonly verification: MailDomainVerificationService,
    private readonly bimi: MailBimiService,
  ) {}

  @Get('bimi')
  bimiStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.bimi.setupStatus(user.id, appId);
  }

  @Post('bimi/logo')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary:
      'Upload a square PNG/JPEG/WebP/SVG logo as base64 JSON and convert it to BIMI Tiny PS',
  })
  uploadBimiLogo(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: UploadMailBimiLogoDto,
  ) {
    const raw = dto.contentBase64.includes(',')
      ? dto.contentBase64.slice(dto.contentBase64.indexOf(',') + 1)
      : dto.contentBase64;
    let buffer: Buffer;
    try {
      buffer = Buffer.from(raw.replace(/\s+/g, ''), 'base64');
    } catch {
      throw new BadRequestException('Invalid logo encoding.');
    }
    if (!buffer.length) {
      throw new BadRequestException('No logo file was received. Try again.');
    }
    if (buffer.length > BIMI_MAX_UPLOAD_BYTES) {
      throw new BadRequestException('Logo must be no larger than 2MB.');
    }

    return this.bimi.uploadCustomerLogo(user.id, appId, {
      buffer,
      size: buffer.length,
      mimetype: dto.mimeType || 'application/octet-stream',
      originalname: dto.fileName || 'logo.png',
    });
  }

  @Post()
  request(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.verification.request(user.id, appId);
  }

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.verification.listForOwner(user.id, appId);
  }

  @Get(':requestId')
  detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('requestId') requestId: string,
  ) {
    return this.verification.getForOwner(user.id, appId, requestId);
  }
}
