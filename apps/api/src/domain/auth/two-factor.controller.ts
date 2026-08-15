import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
  Param,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { TwoFactorService } from './two-factor.service';
import { TokenService } from './token.service';
import { PendingTwoFactorService } from './pending-two-factor.service';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { SecurityLogService } from '../../infrastructure/security/log.service';
import { SecurityDetectorService } from '../../infrastructure/security/detector.service';
import { BruteForceService } from '../../infrastructure/security/brute-force.service';
import { RedisService } from '../../core/cache/redis.service';
import { WhatsappService } from '../../integrations/whatsapp/whatsapp.service';
import { WhatsAppBusinessService } from '../../integrations/whatsapp-business/whatsapp-business.service';
import { normalizePhoneNumber } from '../forms/utils/form-phone-verification-check.util';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { CurrentUser } from '../../core/common/decorators/auth/current-user.decorator';
import { Public } from '../../core/common/decorators/auth/public.decorator';
import { Throttle } from '@nestjs/throttler';
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setCsrfTokenCookie,
  generateCsrfToken,
  setDeviceIdCookie,
} from './cookie.config';
import { UAParser } from 'ua-parser-js';
import {
  Verify2FADto,
  Verify2FALoginDto,
  StartVerifyIdentityDto,
  StartVerifyIdentityResponseDto,
  Disable2FADto,
  RegenerateBackupCodesDto,
  Setup2FAResponseDto,
  TwoFactorStatusDto,
  EnableTwoFactorResponseDto,
} from './dto/two-factor.dto';

const isProduction = process.env.NODE_ENV === 'production';
const VERIFY_IDENTITY_WINDOW_SECONDS = 10 * 60; // 10 دقائق
const VERIFY_IDENTITY_MAX_ATTEMPTS = 6;
const GENERIC_VERIFY_IDENTITY_MESSAGE =
  'تعذر استخدام هذه الطريقة الآن. استخدم البريد الإلكتروني أو حاول لاحقاً.';

@ApiTags('Two-Factor Authentication')
@Controller('auth/2fa')
export class TwoFactorController {
  private readonly logger = new Logger(TwoFactorController.name);

  constructor(
    private twoFactorService: TwoFactorService,
    private tokenService: TokenService,
    private pendingTwoFactorService: PendingTwoFactorService,
    private prisma: PrismaService,
    private securityLogService: SecurityLogService,
    private securityDetectorService: SecurityDetectorService,
    private bruteForceService: BruteForceService,
    private redis: RedisService,
    private whatsappService: WhatsappService,
    private whatsappBusinessService: WhatsAppBusinessService,
  ) {}

  /**
   * 🧭 بدء تدفق "اختر طريقة التحقق" بدون الاعتماد على رابط البريد
   *
   * الهدف: إذا كان المستخدم لا يستطيع الوصول للبريد، يمكنه متابعة
   * Authenticator / Recovery code مباشرةً إذا كان 2FA مفعلاً.
   */
  @Post('start-verify-identity')
  @Public() // 🔒 F-07: pre-login 2FA method discovery (no JWT yet)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'بدء تدفق التحقق البديل (Authenticator / Recovery / Email)',
  })
  @ApiResponse({
    status: 200,
    description: 'حالة الطرق المتاحة ومعرف جلسة 2FA عند توفرها',
    type: StartVerifyIdentityResponseDto,
  })
  async startVerifyIdentity(
    @Body() dto: StartVerifyIdentityDto,
    @Req() req: Request,
  ): Promise<StartVerifyIdentityResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

    // 🔒 F-12: الاستجابة موحّدة الشكل بالكامل بصرف النظر عن حالة الحساب
    // (موجود/غير موجود، 2FA مفعّل/غير مفعّل، مشترك/غير مشترك). لا نكشف أي فرق
    // بنيوي يسمح بتعداد الحسابات أو معرفة تفعيل 2FA.
    const uniformMethods = {
      email: true,
      authenticator: true,
      recovery: true,
      whatsapp: true,
    };

    const tooManyAttempts = await this.isVerifyIdentityRateLimited(
      email,
      ipAddress,
    );
    if (tooManyAttempts) {
      // نفس الشكل، مع رسالة عامة — لا نكشف أن هذا بسبب rate limit لحساب معيّن
      return {
        success: true,
        availableMethods: uniformMethods,
        pendingSessionId: crypto.randomUUID(),
        message: GENERIC_VERIFY_IDENTITY_MESSAGE,
      };
    }

    const user = await this.prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        twoFactorEnabled: true,
      },
    });

    const eligible = Boolean(user && user.twoFactorEnabled);

    // 🔒 نسجّل المحاولة دائماً بنفس الشكل (نجاح=eligible) دون كشف السبب للعميل
    await this.prisma.loginAttempt.create({
      data: {
        id: crypto.randomUUID(),
        email,
        ipAddress,
        success: eligible,
        reason: 'VERIFY_IDENTITY_START',
        metadata: { eligible },
      },
    });

    // 🔒 F-12: نُنشئ pendingSessionId حقيقياً فقط للمؤهلين، وإلا معرّف opaque
    // عشوائي لا يُخزَّن (سيفشل عند محاولة التحقق كأي رمز خاطئ). الشكل والحقول
    // متطابقة في الحالتين لمنع أوراكل التعداد.
    let pendingSessionId: string;
    if (eligible && user) {
      pendingSessionId = await this.pendingTwoFactorService.create(
        user.id,
        user.email,
      );
      await this.securityLogService.createLog({
        userId: user.id,
        action: 'TWO_FACTOR_SETUP_STARTED',
        status: 'SUCCESS',
        description: 'بدء تدفق تحقق بديل عبر صفحة verify-identity',
        ipAddress,
        userAgent: req.headers['user-agent'],
      });
    } else {
      pendingSessionId = crypto.randomUUID();
    }

    return {
      success: true,
      availableMethods: uniformMethods,
      pendingSessionId,
    };
  }

  /**
   * 🔒 Fix #5: Rate limiting عبر Redis بدلاً من DB COUNT
   * يستخدم INCR/EXPIRE لعداد سريع لكل بريد و IP بشكل منفصل
   */
  private async isVerifyIdentityRateLimited(
    email: string,
    ipAddress: string,
  ): Promise<boolean> {
    const emailKey = `vi_rl:email:${email}`;
    const ipKey = `vi_rl:ip:${ipAddress}`;

    // نزيد العدادين بشكل متوازٍ ونضبط الـ TTL عند أول استخدام
    const [emailCount, ipCount] = await Promise.all([
      this.incrementRateLimitCounter(emailKey),
      this.incrementRateLimitCounter(ipKey),
    ]);

    // 🔒 F-13: fail-closed — إذا تعذّر الوصول لـ Redis نعتبر الطلب محظوراً
    // (endpoint حساس لتعداد الحسابات). العدّاد يُرجع -1 عند فشل Redis.
    if (emailCount < 0 || ipCount < 0) {
      this.logger.error(
        '[2FA] verify-identity rate-limit counter unavailable (Redis) — failing closed',
      );
      return true;
    }

    return (
      emailCount > VERIFY_IDENTITY_MAX_ATTEMPTS ||
      ipCount > VERIFY_IDENTITY_MAX_ATTEMPTS * 2
    );
  }

  /**
   * 🔒 F-13: يُرجع العدّاد الحالي، أو -1 عند فشل Redis (إشارة fail-closed).
   */
  private async incrementRateLimitCounter(key: string): Promise<number> {
    try {
      if (!this.redis.getConnectionStatus().connected) {
        return -1;
      }
      // setNX لإنشاء المفتاح مع TTL إذا لم يكن موجوداً
      const created = await this.redis.setNX(
        key,
        '1',
        VERIFY_IDENTITY_WINDOW_SECONDS,
      );
      if (created) {
        return 1;
      }
      // موجود بالفعل — زيادة ذرّية مع الحفاظ على TTL
      const count = await this.redis.incr(key);
      if (count <= 0) {
        // incr فشل/غير متصل
        return -1;
      }
      return count;
    } catch (err) {
      this.logger.error(
        `[2FA] rate-limit counter error for ${key}: ${(err as Error).message}`,
      );
      // 🔒 fail-closed
      return -1;
    }
  }

  /**
   * 📊 حالة المصادقة الثنائية
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'الحصول على حالة المصادقة الثنائية' })
  @ApiResponse({
    status: 200,
    description: 'حالة 2FA',
    type: TwoFactorStatusDto,
  })
  async getStatus(@CurrentUser() user: any): Promise<TwoFactorStatusDto> {
    return this.twoFactorService.getStatus(user.id);
  }

  /**
   * 🔧 إعداد المصادقة الثنائية (الخطوة 1)
   *
   * ينشئ مفتاحاً سرياً و QR Code
   * يجب على المستخدم مسح الـ QR وإدخال الرمز للتفعيل
   */
  @Post('setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    default: {
      limit: process.env.NODE_ENV === 'production' ? 5 : 25,
      ttl: process.env.NODE_ENV === 'production' ? 3_600_000 : 600_000,
    },
  }) // prod: 5/hour — dev: 25 per 10 min
  @ApiOperation({ summary: 'إعداد المصادقة الثنائية - الخطوة 1' })
  @ApiResponse({
    status: 200,
    description: 'QR Code والمفتاح السري',
    type: Setup2FAResponseDto,
  })
  @ApiResponse({ status: 400, description: '2FA مفعل بالفعل' })
  @ApiResponse({ status: 429, description: 'تجاوزت الحد المسموح من المحاولات' })
  async setup(
    @CurrentUser() user: any,
    @Req() req: Request,
  ): Promise<Setup2FAResponseDto> {
    const result = await this.twoFactorService.generateSetup(user.id);

    // تسجيل في Security Log
    await this.securityLogService.createLog({
      userId: user.id,
      action: 'TWO_FA_ENABLED',
      status: 'SUCCESS',
      description: 'بدأ إعداد المصادقة الثنائية',
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    return result;
  }

  /**
   * ✅ تفعيل المصادقة الثنائية (الخطوة 2)
   *
   * يتحقق من الرمز ويفعل 2FA
   */
  @Post('enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 محاولات في الدقيقة
  @ApiOperation({ summary: 'تفعيل المصادقة الثنائية - الخطوة 2' })
  @ApiResponse({
    status: 200,
    description: 'تم التفعيل بنجاح',
    type: EnableTwoFactorResponseDto,
  })
  @ApiResponse({ status: 401, description: 'رمز غير صحيح' })
  async enable(
    @CurrentUser() user: any,
    @Body() dto: Verify2FADto,
    @Req() req: Request,
  ): Promise<EnableTwoFactorResponseDto> {
    const result = await this.twoFactorService.verifyAndEnable(
      user.id,
      dto.token,
    );

    // تسجيل في Security Log
    await this.securityLogService.createLog({
      userId: user.id,
      action: 'TWO_FA_ENABLED',
      status: 'SUCCESS',
      description: 'تم تفعيل المصادقة الثنائية',
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    return {
      success: true,
      backupCodes: result.backupCodes,
      message:
        'تم تفعيل المصادقة الثنائية بنجاح. احتفظ بالرموز الاحتياطية في مكان آمن!',
    };
  }

  /**
   * ❌ إلغاء تفعيل المصادقة الثنائية
   */
  @Delete('disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 مرات في الساعة
  @ApiOperation({ summary: 'إلغاء تفعيل المصادقة الثنائية' })
  @ApiResponse({ status: 200, description: 'تم إلغاء التفعيل' })
  @ApiResponse({ status: 401, description: 'رمز غير صحيح' })
  async disable(
    @CurrentUser() user: any,
    @Body() dto: Disable2FADto,
    @Req() req: Request,
  ) {
    await this.twoFactorService.disable(user.id, dto.token);

    // تسجيل في Security Log
    await this.securityLogService.createLog({
      userId: user.id,
      action: 'TWO_FA_DISABLED',
      status: 'WARNING',
      description: 'تم إلغاء تفعيل المصادقة الثنائية',
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    return {
      success: true,
      message: 'تم إلغاء تفعيل المصادقة الثنائية',
    };
  }

  /**
   * 🔄 إعادة توليد الرموز الاحتياطية
   */
  @Post('backup-codes/regenerate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 مرات في الساعة
  @ApiOperation({ summary: 'إعادة توليد الرموز الاحتياطية' })
  @ApiResponse({ status: 200, description: 'الرموز الاحتياطية الجديدة' })
  async regenerateBackupCodes(
    @CurrentUser() user: any,
    @Body() dto: RegenerateBackupCodesDto,
    @Req() req: Request,
  ) {
    const result = await this.twoFactorService.regenerateBackupCodes(
      user.id,
      dto.token,
    );

    // تسجيل في Security Log
    await this.securityLogService.createLog({
      userId: user.id,
      action: 'TWO_FA_VERIFIED',
      status: 'SUCCESS',
      description: 'تم إعادة توليد الرموز الاحتياطية',
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    return {
      success: true,
      backupCodes: result.backupCodes,
      message: 'تم توليد رموز احتياطية جديدة. الرموز القديمة لم تعد صالحة!',
    };
  }

  /**
   * � التحقق من رمز OTP للمستخدم المُسجَّل (لحماية عمليات حساسة مثل كشف API Key)
   */
  @Post('verify-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'التحقق من رمز OTP للمستخدم المسجل' })
  @ApiResponse({ status: 200, description: 'نتيجة التحقق' })
  async verifyToken(
    @CurrentUser() user: any,
    @Body() dto: Verify2FADto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;

    // 🔒 F-05: هذا endpoint يحمي عمليات حساسة (كشف API Key...) — نمرّره عبر
    // brute-force protection حتى لا يُستغل لتخمين رموز OTP/الرموز الاحتياطية.
    const bruteCheck = await this.bruteForceService.recordOtpAttempt(
      user.id,
      ipAddress,
    );
    if (bruteCheck.blocked) {
      return {
        valid: false,
        blocked: true,
        message: 'تم حظر المحاولات مؤقتاً. يرجى المحاولة لاحقاً.',
      };
    }

    try {
      const result = await this.twoFactorService.verifyToken(
        user.id,
        dto.token,
      );
      if (result.valid) {
        await this.bruteForceService.resetOtpAttempts(user.id);
      }
      return { valid: result.valid };
    } catch {
      return { valid: false, message: 'رمز التحقق غير صحيح' };
    }
  }

  /**
   * 🟢 إرسال رمز OTP عبر الواتساب
   */
  @Post('whatsapp/send-otp')
  @Public() // 🔒 F-07: pending 2FA session, no access token yet
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'إرسال رمز التحقق عبر الواتساب' })
  async sendWhatsappOtp(@Body('pendingSessionId') pendingSessionId: string) {
    if (!pendingSessionId) {
      return { success: false, message: 'معرف الجلسة مطلوب' };
    }

    const pendingSession =
      await this.getPendingTwoFactorSession(pendingSessionId);
    if (!pendingSession) {
      return { success: false, message: 'انتهت صلاحية الجلسة' };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: pendingSession.userId },
      select: { phone: true, phoneNumber: true, role: true },
    });

    const rawPhone = user?.phone || user?.phoneNumber;
    const phone = rawPhone ? normalizePhoneNumber(rawPhone) : null;
    if (!phone) {
      return { success: false, message: 'لا يوجد رقم هاتف مسجل لهذا الحساب' };
    }

    const isSubscribed =
      user &&
      ['PREMIUM', 'STORE_OWNER', 'DEVELOPER', 'ADMIN'].includes(user.role);
    if (!isSubscribed) {
      return { success: false, message: 'هذه الخدمة متاحة للمشتركين فقط' };
    }

    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const redisKey = `whatsapp_otp:${pendingSessionId}`;
    await this.redis.set(redisKey, otpCode, 300);

    try {
      if (this.whatsappBusinessService.isEnabled()) {
        await this.whatsappBusinessService.sendOtp(phone, otpCode);
      } else {
        const result = await this.whatsappService.sendOtpMessage(phone, otpCode);
        if (!result.success) {
          throw new Error(result.error || 'WhatsApp send failed');
        }
      }
      return { success: true, message: 'تم إرسال الرمز بنجاح' };
    } catch (e) {
      this.logger.error(
        `WhatsApp 2FA OTP failed for user ${pendingSession.userId}: ${(e as Error).message}`,
      );
      return { success: false, message: 'فشل إرسال الرمز عبر الواتساب' };
    }
  }

  /**
   * �🔓 التحقق من 2FA عند تسجيل الدخول
   *
   * يُستخدم بعد التحقق الأولي (QuickSign/OAuth) إذا كان 2FA مفعلاً
   */
  @Post('verify-login')
  @Public() // 🔒 F-07: completes login after password/OAuth when 2FA is required
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 🔒 10 محاولات في الدقيقة (منع brute force)
  @ApiOperation({ summary: 'التحقق من 2FA عند تسجيل الدخول' })
  @ApiResponse({ status: 200, description: 'تم التحقق بنجاح وإصدار التوكنز' })
  @ApiResponse({ status: 401, description: 'رمز غير صحيح أو جلسة منتهية' })
  async verifyLogin(
    @Body() dto: Verify2FALoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;

    // استرجاع بيانات الجلسة المعلقة من الـ Cache أو DB
    // (يتم إنشاؤها في QuickSign/OAuth عندما يكون 2FA مطلوباً)
    const pendingSession = await this.getPendingTwoFactorSession(
      dto.pendingSessionId,
    );

    if (!pendingSession) {
      // 🔒 مسح أي جلسة منتهية من قاعدة البيانات
      await this.deletePendingTwoFactorSession(dto.pendingSessionId);

      return {
        success: false,
        error: 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى',
        expired: true,
      };
    }

    // 🔒 حماية من هجمات القوة الغاشمة على OTP
    const otpBruteCheck = await this.bruteForceService.recordOtpAttempt(
      pendingSession.userId,
      ipAddress,
    );
    if (otpBruteCheck.blocked) {
      await this.securityLogService.createLog({
        userId: pendingSession.userId,
        action: 'LOGIN_FAILED',
        status: 'FAILED',
        description: `تم حظر محاولات 2FA مؤقتاً — محاولات فاشلة كثيرة`,
        ipAddress,
        userAgent: req.headers['user-agent'],
      });

      return {
        success: false,
        error: 'تم حظر المحاولات مؤقتاً. يرجى المحاولة لاحقاً.',
        blocked: true,
      };
    }

    // التحقق مما إذا كان الرمز المُدخل هو رمز واتساب
    const redisKey = `whatsapp_otp:${dto.pendingSessionId}`;
    const savedOtp = await this.redis.get<string>(redisKey);
    let isWhatsappOtpValid = false;

    if (savedOtp && savedOtp === dto.token.trim()) {
      isWhatsappOtpValid = true;
      await this.redis.del(redisKey);
    }

    // التحقق من الرمز
    let verification: { valid: boolean; usedBackupCode?: boolean } = {
      valid: false,
    };

    if (isWhatsappOtpValid) {
      verification.valid = true;
    } else {
      try {
        verification = await this.twoFactorService.verifyToken(
          pendingSession.userId,
          dto.token,
        );
      } catch (e) {
        // سيتم التعامل مع الفشل بالأسفل
      }
    }

    if (!verification.valid) {
      // تسجيل المحاولة الفاشلة
      await this.securityLogService.createLog({
        userId: pendingSession.userId,
        action: 'LOGIN_FAILED',
        status: 'FAILED',
        description: 'محاولة فاشلة للتحقق من 2FA',
        ipAddress,
        userAgent: req.headers['user-agent'],
      });

      return {
        success: false,
        error: 'رمز التحقق غير صحيح',
        attemptsLeft: otpBruteCheck.attemptsLeft,
      };
    }

    // ✅ نجاح — إعادة تعيين عداد المحاولات
    await this.bruteForceService.resetOtpAttempts(pendingSession.userId);

    // حذف الجلسة المعلقة
    await this.deletePendingTwoFactorSession(dto.pendingSessionId);

    // إنشاء التوكنز
    const user = await this.prisma.user.findUnique({
      where: { id: pendingSession.userId },
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: {
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    const { tokens } = await this.tokenService.generateTokenPair(
      user.id,
      user.email,
      { userId: user.id, userAgent, ipAddress },
    );

    // 🔒 إعداد Access Token في httpOnly Cookie
    setAccessTokenCookie(res, tokens.accessToken);

    // 🔒 إعداد Refresh Token Cookie
    setRefreshTokenCookie(res, tokens.refreshToken);

    // 🔒 توليد CSRF Token
    const csrfToken = generateCsrfToken();
    setCsrfTokenCookie(res, csrfToken);

    // Parse device info for logging
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    // تذكر هذا الجهاز: إنشاء جهاز موثوق وتفعيل الكوكي
    if (dto.rememberDevice) {
      const deviceId = await this.securityDetectorService.rememberDeviceFor2FA(
        user.id,
        {
          browser: result.browser.name,
          os: result.os.name,
          deviceType: result.device.type || 'desktop',
          ipAddress,
          userAgent,
        },
      );
      setDeviceIdCookie(res, deviceId);
    }

    // تسجيل النجاح
    await this.securityLogService.createLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      status: 'SUCCESS',
      description: verification.usedBackupCode
        ? 'تسجيل دخول ناجح بعد 2FA (رمز احتياطي)'
        : 'تسجيل دخول ناجح بعد 2FA',
      ipAddress,
      deviceType: result.device.type || 'desktop',
      browser: result.browser.name || 'Unknown',
      os: result.os.name || 'Unknown',
      userAgent,
    });

    return {
      success: true,
      usedBackupCode: verification.usedBackupCode || false,
      csrf_token: csrfToken,
      expires_in: 30 * 60, // 30 minutes - matches access token
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.profile?.name,
        username: user.profile?.username,
        avatar: user.profile?.avatar,
      },
      message: verification.usedBackupCode
        ? 'تم تسجيل الدخول بنجاح. تم استخدام رمز احتياطي.'
        : 'تم تسجيل الدخول بنجاح',
    };
  }

  /**
   * 🔍 التحقق من صلاحية جلسة 2FA المعلقة (Endpoint عام)
   * يُستخدم من الـ frontend كفحص تمهيدي فقط.
   * 🔒 لا يكشف ما إذا كانت الجلسة موجودة أو صالحة لمنع التعداد.
   */
  @Get('check-session/:sessionId')
  @Public() // 🔒 F-07: pre-login session probe
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 🔒 10 محاولات في الدقيقة (منع تعداد الجلسات)
  @ApiOperation({ summary: 'فحص تمهيدي لجلسة 2FA بدون كشف حالتها' })
  @ApiResponse({ status: 200, description: 'استجابة موحدة دائمًا' })
  async checkSession(@Param('sessionId') sessionId: string) {
    // 🔒 نقوم بالفحص داخلياً فقط بدون إرجاع نتيجة صريحة لحالة الجلسة
    await this.getPendingTwoFactorSession(sessionId);

    // 🔒 الاستجابة موحدة لمنع تعداد معرفات الجلسات
    return {
      valid: true,
      message: 'يمكنك المتابعة لإدخال رمز التحقق',
    };
  }

  /**
   * 🔍 استرجاع جلسة 2FA المعلقة
   */
  private async getPendingTwoFactorSession(sessionId: string): Promise<{
    userId: string;
    email: string;
  } | null> {
    if (!sessionId) return null;

    const pending = await this.prisma.pendingTwoFactorSession.findUnique({
      where: { id: sessionId },
    });

    if (!pending) {
      if (!isProduction) console.log('[2FA] Session not found:', sessionId);
      return null;
    }

    // 🔒 التحقق من انتهاء الصلاحية بدقة (مع buffer صغير لتجنب مشاكل timezone)
    const now = new Date();
    const expiresAt = new Date(pending.expiresAt);
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    if (timeUntilExpiry <= 0) {
      if (!isProduction) {
        console.log('[2FA] Session expired:', {
          sessionId,
          expiresAt: expiresAt.toISOString(),
          now: now.toISOString(),
          timeUntilExpiry: `${Math.round(timeUntilExpiry / 1000)}s`,
        });
      }
      return null;
    }

    if (!isProduction) {
      console.log('[2FA] Session valid:', {
        sessionId,
        expiresAt: expiresAt.toISOString(),
        timeUntilExpiry: `${Math.round(timeUntilExpiry / 1000)}s`,
      });
    }

    return {
      userId: pending.userId,
      email: pending.email,
    };
  }

  /**
   * 🗑️ حذف جلسة 2FA المعلقة
   */
  private async deletePendingTwoFactorSession(
    sessionId: string,
  ): Promise<void> {
    if (!sessionId) return;

    await this.prisma.pendingTwoFactorSession.deleteMany({
      where: { id: sessionId },
    });
  }
}
