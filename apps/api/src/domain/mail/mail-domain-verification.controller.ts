import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { MailDomainVerificationService } from './mail-domain-verification.service';
import { BIMI_MAX_SVG_BYTES, MailBimiService } from './mail-bimi.service';

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
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: BIMI_MAX_SVG_BYTES } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload and validate an SVG Tiny PS BIMI logo (max 256KB)',
  })
  uploadBimiLogo(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No BIMI SVG uploaded.');
    return this.bimi.uploadCustomerLogo(user.id, appId, file);
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
