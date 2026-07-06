import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../../core/common/decorators/auth/current-user.decorator';
import { AppsService } from './apps.service';
import { AppsUploadService } from './apps-upload.service';
import { CreateAppDto } from './dto/create-app.dto';
import { UpdateAppDto } from './dto/update-app.dto';
import { SendAppOtpDto, VerifyAppOtpDto } from './dto/app-otp.dto';
import { AppImagePresignDto } from './dto/app-image-presign.dto';
import { AppImageUploadDataDto } from './dto/app-image-upload-data.dto';

@ApiTags('Developer - Apps')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'developer/apps', version: '1' })
export class AppsController {
  constructor(
    private readonly appsService: AppsService,
    private readonly appsUploadService: AppsUploadService,
  ) {}

  @Post('otp/send')
  @ApiOperation({ summary: 'إرسال رمز تحقق عبر واتساب' })
  sendOtp(@CurrentUser('id') userId: string, @Body() dto: SendAppOtpDto) {
    return this.appsService.sendOtp(userId, dto);
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'التحقق من رمز OTP' })
  verifyOtp(@CurrentUser('id') userId: string, @Body() dto: VerifyAppOtpDto) {
    return this.appsService.verifyOtpEndpoint(userId, dto);
  }

  @Post()
  @ApiOperation({ summary: 'إنشاء تطبيق جديد' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateAppDto) {
    return this.appsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'قائمة التطبيقات' })
  findAll(@CurrentUser('id') userId: string) {
    return this.appsService.findAll(userId);
  }

  @Get(':appId')
  @ApiOperation({ summary: 'تفاصيل تطبيق' })
  findOne(@CurrentUser('id') userId: string, @Param('appId') appId: string) {
    return this.appsService.findOne(userId, appId);
  }

  @Patch(':appId')
  @ApiOperation({ summary: 'تحديث تطبيق' })
  update(
    @CurrentUser('id') userId: string,
    @Param('appId') appId: string,
    @Body() dto: UpdateAppDto,
  ) {
    return this.appsService.update(userId, appId, dto);
  }

  @Post(':appId/upload/presign')
  @ApiOperation({ summary: 'Presigned URL لرفع أيقونة أو صورة الملف الشخصي' })
  presignImages(
    @CurrentUser('id') userId: string,
    @Param('appId') appId: string,
    @Body() dto: AppImagePresignDto,
  ) {
    return this.appsUploadService.presignImages(
      userId,
      appId,
      dto.type,
      dto.files,
    );
  }

  @Post(':appId/upload/file')
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
    @CurrentUser('id') userId: string,
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
    return this.appsUploadService.uploadImage(userId, appId, type, file);
  }

  @Post(':appId/upload/data')
  @ApiOperation({
    summary: 'رفع أيقونة أو صورة الملف الشخصي كـ base64 JSON (موثوق عبر BFF)',
  })
  uploadImageData(
    @CurrentUser('id') userId: string,
    @Param('appId') appId: string,
    @Body() dto: AppImageUploadDataDto,
  ) {
    return this.appsUploadService.uploadImageData(
      userId,
      appId,
      dto.type,
      dto.image,
    );
  }

  @Post(':appId/submit-access-review')
  @ApiOperation({ summary: 'تقديم طلب مراجعة الوصول' })
  submitAccessReview(
    @CurrentUser('id') userId: string,
    @Param('appId') appId: string,
  ) {
    return this.appsService.submitAccessReview(userId, appId);
  }

  @Delete(':appId')
  @ApiOperation({ summary: 'حذف تطبيق' })
  remove(@CurrentUser('id') userId: string, @Param('appId') appId: string) {
    return this.appsService.remove(userId, appId);
  }
}
