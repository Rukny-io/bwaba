import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto, UpdateProfileDto } from './dto';
import { StorageService } from '../storage/storage.service';
import { WhatsAppBusinessService } from '../../integrations/whatsapp-business/whatsapp-business.service';
import { RedisService } from '../../core/cache/redis.service';
import * as crypto from 'crypto';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(
    private profilesService: ProfilesService,
    private storageService: StorageService,
    private whatsappBusiness: WhatsAppBusinessService,
    private redisService: RedisService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create user profile' })
  @ApiResponse({ status: 201, description: 'Profile created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({
    status: 409,
    description: 'Username already taken or profile already exists',
  })
  create(@Request() req, @Body() createProfileDto: CreateProfileDto) {
    return this.profilesService.create(req.user.id, createProfileDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  getMyProfile(@Request() req) {
    return this.profilesService.findByUserId(req.user.id);
  }

  @Get('check/:username')
  @ApiOperation({ summary: 'Check if username is available' })
  @ApiParam({ name: 'username', description: 'Username to check availability' })
  @ApiResponse({ status: 200, description: 'Username availability checked' })
  checkUsername(@Param('username') username: string) {
    return this.profilesService.checkUsernameAvailability(username);
  }

  @Get(':username')
  @ApiOperation({ summary: 'Get profile by username (public)' })
  @ApiParam({ name: 'username', description: 'Username of the profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  findOne(@Param('username') username: string, @Request() req) {
    const requesterId = req.user?.id;
    return this.profilesService.findByUsername(username, requesterId);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  @ApiResponse({ status: 409, description: 'Username already taken' })
  update(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profilesService.update(req.user.id, updateProfileDto);
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile avatar to S3' })
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async uploadAvatar(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Use StorageService to upload to S3 with organized paths
    const key = await this.storageService.uploadAvatar(req.user.id, file);
    const profile = await this.profilesService.uploadAvatar(req.user.id, key);

    // Return profile with presigned URL
    const avatarUrl = await this.storageService.getPresignedUrl(key);
    return { ...profile, avatarUrl };
  }

  @Post('cover')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload cover image to S3' })
  @ApiResponse({
    status: 200,
    description: 'Cover image uploaded successfully',
  })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async uploadCover(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Use StorageService to upload to S3 with organized paths
    const key = await this.storageService.uploadCover(req.user.id, file);
    const profile = await this.profilesService.uploadCover(req.user.id, key);

    // Return profile with presigned URL
    const coverUrl = await this.storageService.getPresignedUrl(key);
    return { ...profile, coverUrl };
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user profile' })
  @ApiResponse({ status: 200, description: 'Profile deleted successfully' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  remove(@Request() req) {
    return this.profilesService.remove(req.user.id);
  }

  @Post('logos/upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload logo for logo cloud slider' })
  @ApiResponse({ status: 201, description: 'Logo uploaded successfully' })
  async uploadLogo(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.storageService.uploadLogo(req.user.id, file);
  }

  @Delete('logos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a logo from logo cloud' })
  async deleteLogo(@Request() req, @Body() body: { key: string }) {
    if (!body.key) {
      throw new BadRequestException('Logo key is required');
    }
    await this.storageService.deleteLogo(req.user.id, body.key);
    return { success: true };
  }

  // ─── Phone Verification via WhatsApp ────────────────────────────────────

  @Post('phone/send-otp')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'إرسال رمز OTP للتحقق من رقم الهاتف عبر واتساب' })
  @ApiResponse({ status: 200, description: 'تم إرسال رمز OTP' })
  async sendPhoneOtp(@Request() req, @Body() body: { phone: string }) {
    const phone = body.phone?.trim();
    if (!phone) throw new BadRequestException('رقم الهاتف مطلوب.');

    const userId = req.user.id;
    const redisKey = `phone_otp:${userId}`;

    // Rate limit: 1 OTP per 60s per user
    const existing = await this.redisService.get<{
      otp: string;
      phone: string;
      attempts: number;
    }>(redisKey);
    if (existing && existing.phone === phone) {
      // Allow resend only after 60s — enforced by TTL; if still exists, block
      throw new BadRequestException('انتظر دقيقة قبل إعادة إرسال الرمز.');
    }

    const otp = String(crypto.randomInt(100000, 999999));

    if (!this.whatsappBusiness.isEnabled()) {
      throw new BadRequestException('خدمة واتساب غير متاحة حالياً.');
    }

    await this.whatsappBusiness.sendOtp(phone, otp);
    await this.redisService.set(redisKey, { otp, phone, attempts: 0 }, 300); // 5 min TTL

    return { success: true, message: 'تم إرسال رمز التحقق إلى واتساب.' };
  }

  @Post('phone/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'التحقق من رمز OTP الهاتف' })
  @ApiResponse({ status: 200, description: 'تم التحقق بنجاح' })
  async verifyPhoneOtp(
    @Request() req,
    @Body() body: { phone: string; otp: string },
  ) {
    const phone = body.phone?.trim();
    const otp = body.otp?.trim();
    if (!phone || !otp)
      throw new BadRequestException('رقم الهاتف والرمز مطلوبان.');

    const userId = req.user.id;
    const redisKey = `phone_otp:${userId}`;

    const stored = await this.redisService.get<{
      otp: string;
      phone: string;
      attempts: number;
    }>(redisKey);
    if (!stored)
      throw new BadRequestException('الرمز منتهي الصلاحية. اطلب رمزاً جديداً.');
    if (stored.phone !== phone)
      throw new BadRequestException('رقم الهاتف غير مطابق.');

    stored.attempts = (stored.attempts || 0) + 1;
    if (stored.attempts > 5) {
      await this.redisService.del(redisKey);
      throw new BadRequestException('تجاوزت الحد المسموح. اطلب رمزاً جديداً.');
    }

    if (stored.otp !== otp) {
      // Update attempts count
      await this.redisService.set(redisKey, stored, 300);
      throw new BadRequestException('الرمز غير صحيح.');
    }

    await this.redisService.del(redisKey);
    return { success: true, verified: true };
  }
}
