import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import {
  BIMI_MAX_CERT_BYTES,
  BIMI_MAX_UPLOAD_BYTES,
  MailBimiService,
} from './mail-bimi.service';

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
    summary: 'Upload a raster or SVG logo and convert it to BIMI Tiny PS',
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
      throw new BadRequestException(
        'Logo must be no larger than 2MB before conversion.',
      );
    }

    return this.bimi.uploadCustomerLogo(user.id, appId, {
      buffer,
      size: buffer.length,
      mimetype: dto.mimeType || 'application/octet-stream',
      originalname: dto.fileName || 'logo.svg',
    });
  }

  @Delete('bimi/logo')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Delete the current customer BIMI logo' })
  deleteBimiLogo(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.bimi.deleteCustomerLogo(user.id, appId);
  }

  @Post('bimi/authority')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Upload a CMC/VMC PEM certificate for BIMI authority (a=)',
  })
  uploadBimiAuthority(
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
      throw new BadRequestException('Invalid certificate encoding.');
    }
    if (!buffer.length) {
      throw new BadRequestException(
        'No certificate file was received. Try again.',
      );
    }
    if (buffer.length > BIMI_MAX_CERT_BYTES) {
      throw new BadRequestException(
        'CMC/VMC certificate must be no larger than 1MB.',
      );
    }

    return this.bimi.uploadCustomerAuthority(user.id, appId, {
      buffer,
      size: buffer.length,
      mimetype: dto.mimeType || 'application/pem-certificate-chain',
      originalname: dto.fileName || 'authority.pem',
    });
  }

  @Delete('bimi/authority')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Delete the current customer BIMI certificate' })
  deleteBimiAuthority(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.bimi.deleteCustomerAuthority(user.id, appId);
  }

  @Post()
  request(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.verification.request(user.id, appId);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Param('appId') appId: string) {
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
