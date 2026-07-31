import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  IdentityVerificationService,
  IdentityPresignDto,
  IdentityUploadDataDto,
  SubmitIdentityDto,
} from './identity-verification.service';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { TwoFactorRequiredGuard } from '../../core/common/guards/auth/two-factor-required.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import { Request } from 'express';
import {
  IDENTITY_MAX_FILE_BYTES,
  IdentityDocumentSlot,
} from './identity.constants';

@ApiTags('Auth - Identity Verification')
@Controller('auth/identity')
export class IdentityVerificationController {
  constructor(private readonly identityService: IdentityVerificationService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get identity verification status' })
  async getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.identityService.getStatus(user.id);
  }

  @Post('upload/session')
  @UseGuards(JwtAuthGuard, TwoFactorRequiredGuard)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Start secure identity document upload session' })
  async createUploadSession(@CurrentUser() user: AuthenticatedUser) {
    return this.identityService.createUploadSession(user.id);
  }

  @Post('upload/presign')
  @UseGuards(JwtAuthGuard, TwoFactorRequiredGuard)
  @Throttle({ default: { limit: 25, ttl: 3600000 } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get presigned URL for identity document slot' })
  async presignUpload(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: IdentityPresignDto,
  ) {
    return this.identityService.requestPresignedUpload(user.id, dto);
  }

  @Post('upload/file')
  @UseGuards(JwtAuthGuard, TwoFactorRequiredGuard)
  @Throttle({ default: { limit: 25, ttl: 3600000 } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: IDENTITY_MAX_FILE_BYTES },
    }),
  )
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload identity document via API (avoids S3 CORS in browser)',
  })
  async uploadFile(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('sessionId') sessionId: string,
    @Body('slot') slot: IdentityDocumentSlot,
  ) {
    if (!file) {
      throw new BadRequestException('الملف مطلوب');
    }
    return this.identityService.uploadSlotFile(
      user.id,
      sessionId,
      slot,
      file,
    );
  }

  @Post('upload/data')
  @UseGuards(JwtAuthGuard, TwoFactorRequiredGuard)
  @Throttle({ default: { limit: 25, ttl: 3600000 } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Upload identity document as base64 JSON (BFF-friendly)',
  })
  async uploadData(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: IdentityUploadDataDto,
  ) {
    return this.identityService.uploadSlotData(user.id, dto);
  }

  @Post('submit')
  @UseGuards(JwtAuthGuard, TwoFactorRequiredGuard)
  @Throttle({ default: { limit: 3, ttl: 86400000 } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit identity verification documents' })
  @ApiResponse({ status: 201, description: 'Documents submitted for review' })
  async submitVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitIdentityDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.identityService.submitVerification(
      user.id,
      dto,
      ipAddress,
      userAgent,
    );
  }
}
