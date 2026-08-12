import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AppsService } from './apps.service';
import { AppsUploadService } from './apps-upload.service';
import { AppAnalyticsService } from './app-analytics.service';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { SendAppOtpDto, VerifyAppOtpDto } from './dto/app-otp.dto';
import { AppImagePresignDto } from './dto/app-image-presign.dto';
import { AppImageUploadDataDto } from './dto/app-image-upload-data.dto';
import { WorkspaceGuard } from '../../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../../workspace/workspace-context.middleware';

@ApiTags('Developer - Apps')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceGuard)
@Controller({ path: 'developer/apps', version: '1' })
export class AppsController {
  constructor(
    private readonly appsService: AppsService,
    private readonly appsUploadService: AppsUploadService,
    private readonly appAnalyticsService: AppAnalyticsService,
  ) {}

  @Post('otp/send')
  @RequiresWorkspacePermission('developer:apps:write')
  @ApiOperation({ summary: 'إرسال رمز تحقق عبر واتساب' })
  sendOtp(@ActiveWorkspace() ws: WorkspaceContext, @Body() dto: SendAppOtpDto) {
    // OTP يُربط بالمستخدم الفعلي (actor) لأنه تحقق من هاتفه هو.
    return this.appsService.sendOtp(ws.actorId, dto);
  }

  @Post('otp/verify')
  @RequiresWorkspacePermission('developer:apps:write')
  @ApiOperation({ summary: 'التحقق من رمز OTP' })
  verifyOtp(@ActiveWorkspace() ws: WorkspaceContext, @Body() dto: VerifyAppOtpDto) {
    return this.appsService.verifyOtpEndpoint(ws.actorId, dto);
  }

  @Post()
  @RequiresWorkspacePermission('developer:apps:write')
  @ApiOperation({ summary: 'إنشاء تطبيق جديد' })
  create(@ActiveWorkspace() ws: WorkspaceContext, @Body() dto: CreateAppDto) {
    return this.appsService.create(ws.ownerId, ws.actorId, dto);
  }

  @Get()
  @RequiresWorkspacePermission('developer:apps:read')
  @ApiOperation({ summary: 'قائمة التطبيقات' })
  findAll(@ActiveWorkspace() ws: WorkspaceContext) {
    return this.appsService.findAll(ws.ownerId);
  }

  @Get(':appId/analytics')
  @RequiresWorkspacePermission('developer:apps:read')
  @ApiOperation({ summary: 'تحليلات التطبيق (API / واتساب / نماذج / محفظة)' })
  getAnalytics(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('appId') appId: string,
    @Query('days') days?: string,
  ) {
    const parsed = days ? parseInt(days, 10) : 30;
    return this.appAnalyticsService.getAppAnalytics(
      ws.ownerId,
      appId,
      Number.isFinite(parsed) ? parsed : 30,
    );
  }

  @Get(':appId')
  @RequiresWorkspacePermission('developer:apps:read')
  @ApiOperation({ summary: 'تفاصيل تطبيق' })
  findOne(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('appId') appId: string,
  ) {
    return this.appsService.findOne(ws.ownerId, appId);
  }

  @Patch(':appId')
  @RequiresWorkspacePermission('developer:apps:write')
  @ApiOperation({ summary: 'تحديث تطبيق' })
  update(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('appId') appId: string,
    @Body() dto: UpdateAppDto,
  ) {
    return this.appsService.update(ws.ownerId, appId, dto);
  }

  @Post(':appId/upload/presign')
  @RequiresWorkspacePermission('developer:apps:write')
  @ApiOperation({ summary: 'Presigned URL لرفع أيقونة أو صورة الملف الشخصي' })
  presignImages(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('appId') appId: string,
    @Body() dto: AppImagePresignDto,
  ) {
    return this.appsUploadService.presignImages(
      ws.ownerId,
      appId,
      dto.type,
      dto.files,
    );
  }

  @Post(':appId/upload/file')
  @RequiresWorkspacePermission('developer:apps:write')
  @ApiOperation({
    summary: 'رفع أيقونة أو صورة الملف الشخصي عبر API (بدون CORS)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadImage(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('appId') appId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: 'icon' | 'profile',
  ) {
    if (!type || (type !== 'icon' && type !== 'profile')) {
      throw new BadRequestException('Invalid upload type');
    }
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.appsUploadService.uploadImage(ws.ownerId, appId, type, file);
  }

  @Post(':appId/upload/data')
  @RequiresWorkspacePermission('developer:apps:write')
  @ApiOperation({
    summary: 'رفع أيقونة أو صورة الملف الشخصي كـ base64 JSON (موثوق عبر BFF)',
  })
  uploadImageData(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('appId') appId: string,
    @Body() dto: AppImageUploadDataDto,
  ) {
    return this.appsUploadService.uploadImageData(
      ws.ownerId,
      appId,
      dto.type,
      dto.image,
    );
  }

  @Post(':appId/submit-access-review')
  @RequiresWorkspacePermission('developer:apps:write')
  @ApiOperation({ summary: 'تقديم طلب مراجعة الوصول' })
  submitAccessReview(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('appId') appId: string,
  ) {
    return this.appsService.submitAccessReview(ws.ownerId, appId);
  }

  @Delete(':appId')
  @ApiOperation({ summary: 'حذف تطبيق (مالك الحساب فقط)' })
  remove(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('appId') appId: string,
  ) {
    // حذف تطبيق حساس ولا يمكن التراجع عنه: يقتصر على المالك.
    if (!ws.isOwner) {
      throw new ForbiddenException({
        message: 'حذف التطبيق يقتصر على مالك الحساب',
        code: 'OWNER_ONLY',
      });
    }
    return this.appsService.remove(ws.ownerId, appId);
  }
}
