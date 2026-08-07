import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
  Res,
  Delete,
  Param,
  Query,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SecurityAction, SecurityStatus } from '@prisma/client';
import { resolveMediaProxyUrl } from '../../core/common/utils/media-path.util';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { ExchangeCodeDto, UpdateOAuthProfileDto } from './dto';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { GoogleAuthGuard } from '../../core/common/guards/auth/google-auth.guard';
import { LinkedInAuthGuard } from '../../core/common/guards/auth/linkedin-auth.guard';
import { FacebookAuthGuard } from '../../core/common/guards/auth/facebook-auth.guard';
import { GitHubAuthGuard } from '../../core/common/guards/auth/github-auth.guard';
import { OAuthProviderEnabledGuard } from '../../core/common/guards/auth/oauth-provider-enabled.guard';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import { Request, Response } from 'express';
import { RedisOAuthCodeService } from './redis-oauth-code.service';
import { OAuthStateService } from './oauth-state.service';
import { getClientIp } from '../../core/common/utils/client-ip.util';
import { Public } from '../../core/common/decorators/auth/public.decorator';
import { WebSocketTokenService } from './websocket-token.service';
import { SecurityLogService } from '../../infrastructure/security/log.service';
import { PendingTwoFactorService } from './pending-two-factor.service';
import { AccountLinkingService } from './account-linking.service';
import { Throttle } from '@nestjs/throttler';
import { randomUUID } from 'crypto';
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setCsrfTokenCookie,
  clearAuthCookies,
  clearRefreshTokenCookie,
  extractAccessToken,
  extractRefreshToken,
  validateCsrfToken,
  generateCsrfToken,
  TOKEN_EXPIRY,
} from './cookie.config';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { StoresService } from '../stores/stores.service';

// Throttle policies:
// - Production: strict
// - Development: more lenient to avoid blocking mobile/local testing when the client retries
const AUTH_REFRESH_THROTTLE =
  process.env.NODE_ENV === 'production'
    ? { default: { limit: 10, ttl: 60000 } } // 10 requests per minute (reduced from 30 for security)
    : { default: { limit: 300, ttl: 60000 } }; // 300 requests per minute (dev only)

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private oauthCodeService: RedisOAuthCodeService, // Use Redis implementation
    private webSocketTokenService: WebSocketTokenService,
    private securityLogService: SecurityLogService,
    private pendingTwoFactorService: PendingTwoFactorService,
    private accountLinkingService: AccountLinkingService,
    private prisma: PrismaService,
    private storageService: StorageService,
    private storesService: StoresService,
    private oauthStateService: OAuthStateService,
  ) {}

  /**
   * 🔒 F-02: Verify + consume the OAuth `state` anti-CSRF nonce and return the
   * associated redirect metadata. Rejects callbacks whose state is missing,
   * unknown, expired, or already used (login CSRF / replay protection).
   *
   * Legacy base64-JSON states are only honored when OAUTH_STATE_LEGACY=true
   * (transitional rollout switch), and never for account-linking flows.
   */
  private async resolveOAuthState(req: any): Promise<{
    origin?: string | null;
    linkToken?: string | null;
    nextUrl?: string | null;
  }> {
    const stateStr = req.query?.state as string | undefined;
    if (!stateStr) {
      throw new UnauthorizedException('Missing OAuth state parameter');
    }

    const payload = await this.oauthStateService.consume(stateStr);
    if (payload) {
      return { origin: payload.o, linkToken: payload.l, nextUrl: payload.n };
    }

    // Transitional fallback for in-flight legacy states (disabled by default).
    if (
      process.env.OAUTH_STATE_LEGACY === 'true' &&
      !stateStr.startsWith('http')
    ) {
      try {
        const decoded = JSON.parse(
          Buffer.from(stateStr, 'base64').toString('utf-8'),
        );
        // Legacy states never carried a verified nonce → reject account linking.
        if (decoded.l) {
          throw new UnauthorizedException(
            'Invalid OAuth state for account linking',
          );
        }
        return { origin: decoded.o, linkToken: null, nextUrl: decoded.n };
      } catch {
        // fall through to rejection
      }
    }

    throw new UnauthorizedException('Invalid or expired OAuth state');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 requests per minute
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Current user retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getMe(@CurrentUser() user: any) {
    user.avatar = resolveMediaProxyUrl(user.avatar) ?? null;
    if (user.bannerUrls?.length) {
      user.bannerUrls = user.bannerUrls
        .map((url: string) => resolveMediaProxyUrl(url))
        .filter(Boolean);
    }
    return user;
  }

  /**
   * 🔐 Update OAuth User Profile
   * POST /auth/update-profile
   *
   * Used by OAuth users (Google/LinkedIn) to complete their profile
   * with name and username after signup
   */
  @Post('update-profile')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update OAuth user profile (name and username)' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 409, description: 'Username already taken' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateOAuthProfile(
    @Body() dto: UpdateOAuthProfileDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    // Check if username is available
    const existingProfile = await this.prisma.profile.findUnique({
      where: { username: dto.username },
    });

    if (existingProfile && existingProfile.userId !== user.id) {
      throw new ConflictException('اسم المستخدم محجوز بالفعل');
    }

    let updated;
    try {
      updated = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          profileCompleted: true,
          phoneNumber: dto.phone || null,
          lastLoginAt: new Date(),
          profile: {
            upsert: {
              create: {
                id: randomUUID(),
                username: dto.username,
                name: dto.name,
              },
              update: {
                username: dto.username,
                name: dto.name,
              },
            },
          },
        },
        include: {
          profile: true,
        },
      });
    } catch (error: any) {
      if (
        error.code === 'P2002' &&
        error.meta?.target?.includes('phoneNumber')
      ) {
        throw new ConflictException('رقم الهاتف مستخدم بالفعل بحساب آخر');
      }
      throw error;
    }

    // 🏪 Fix #10: إنشاء المتجر عبر StoresService (business logic في مكانه الصحيح)
    let store: { slug: string; id: string } | null = null;
    try {
      store = await this.storesService.createForOAuthProfile({
        userId: user.id,
        email: updated.email,
        username: dto.username,
        name: dto.name,
        storeCategory: dto.storeCategory,
        storeDescription: dto.storeDescription,
        employeesCount: dto.employeesCount,
        storeCountry: dto.storeCountry,
        storeCity: dto.storeCity,
        storeAddress: dto.storeAddress,
        storeLatitude: dto.storeLatitude,
        storeLongitude: dto.storeLongitude,
      });
    } catch (storeErr) {
      console.error('[updateOAuthProfile] Failed to create store:', storeErr);
      // لا تُفشل العملية بسبب فشل إنشاء المتجر
    }

    // Log the update
    await this.securityLogService.createLog({
      userId: user.id,
      action: SecurityAction.PROFILE_UPDATE,
      status: SecurityStatus.SUCCESS,
      description: 'تم تحديث الملف الشخصي وإنشاء المتجر (OAuth user)',
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    });

    return {
      success: true,
      user: {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        name: updated.profile?.name,
        username: updated.profile?.username,
        avatar: updated.profile?.avatar,
        profileCompleted: updated.profileCompleted,
      },
      store: store ? { slug: store.slug } : null,
      message: 'تم تحديث الملف الشخصي بنجاح',
    };
  }

  /**
   * 🔒 سجل النشاط للمستخدم (استغلال SecurityLog الموجود)
   */
  @Get('activity')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user activity log (security log)' })
  @ApiResponse({ status: 200, description: 'Activity log retrieved' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getActivity(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
  ) {
    return this.securityLogService.getUserLogs({
      userId: user.id,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      action: action as SecurityAction,
    });
  }

  @Get('ws-token')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get WebSocket authentication token' })
  @ApiResponse({ status: 200, description: 'WebSocket token generated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWebSocketToken(@CurrentUser() user: AuthenticatedUser) {
    const token = this.webSocketTokenService.generateToken(user.id);
    return { token, expiresIn: 300 }; // 5 minutes
  }

  /**
   * 🔒 GET handler for refresh endpoint - returns error (must use POST)
   * This prevents 404 errors from browser prefetch/speculative requests
   */
  @Get('refresh')
  @Public() // 🔒 F-07: uses refresh-token cookie, not an access token
  @HttpCode(HttpStatus.METHOD_NOT_ALLOWED)
  @ApiOperation({ summary: 'Refresh endpoint - must use POST' })
  @ApiResponse({ status: 405, description: 'Method not allowed - use POST' })
  refreshTokensGet() {
    return {
      success: false,
      error: 'Method Not Allowed',
      message: 'Use POST /auth/refresh to refresh tokens',
    };
  }

  /**
   * 🔒 تجديد التوكنز باستخدام Refresh Token
   *
   * Refresh Token في httpOnly Cookie → Access Token في Response Body
   *
   * الحماية:
   * - SameSite=Lax (يسمح بـ OAuth redirect)
   * - Origin/Referer validation (حماية CSRF إضافية)
   * - Rate limiting
   */
  @Post('refresh')
  @Public() // 🔒 F-07: uses refresh-token cookie, not an access token
  @HttpCode(HttpStatus.OK)
  @Throttle(AUTH_REFRESH_THROTTLE)
  @ApiOperation({
    summary: 'Refresh access token using refresh token from cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'New access token returned in body',
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiResponse({ status: 403, description: 'CSRF validation failed' })
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Origin/Referer only — refresh uses httpOnly cookies + SameSite=Lax.
    // Double-submit CSRF header is not available on first refresh after login.
    const csrfCheck = validateCsrfToken(req, true);
    if (!csrfCheck.valid) {
      throw new ForbiddenException(
        `CSRF validation failed: ${csrfCheck.reason}`,
      );
    }

    const refreshToken = extractRefreshToken(req);

    if (!refreshToken) {
      // 🔒 مسح الكوكي في حالة عدم وجود token
      clearRefreshTokenCookie(res);
      throw new UnauthorizedException(
        'Refresh token not found. Please login again.',
      );
    }

    const userAgent = req.headers['user-agent'];
    const ipAddress = getClientIp(req);

    try {
      // 🔒 تجديد التوكنز مع التدوير (Rotation)
      const tokens = await this.tokenService.refreshTokens(
        refreshToken,
        ipAddress,
        userAgent,
      );

      // 🔒 Access Token في httpOnly Cookie
      setAccessTokenCookie(res, tokens.accessToken);

      // 🔒 Refresh Token الجديد في httpOnly Cookie
      setRefreshTokenCookie(res, tokens.refreshToken);

      // 🔒 توليد CSRF Token جديد
      const csrfToken = generateCsrfToken();
      setCsrfTokenCookie(res, csrfToken);

      // 🔒 Response - لا نُرسل التوكنات في الـ body (فقط في cookies)
      return {
        success: true,
        message: 'Tokens refreshed successfully',
        csrf_token: csrfToken, // 🔒 CSRF token للـ frontend
        expires_in: TOKEN_EXPIRY.accessToken,
      };
    } catch (error) {
      // Only clear refresh cookie on definitive auth failure — not CSRF/lock races.
      if (error instanceof UnauthorizedException) {
        clearRefreshTokenCookie(res);
      }
      throw error;
    }
  }

  /**
   * 🔒 الحصول على الجلسات النشطة للمستخدم
   */
  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user active sessions' })
  @ApiResponse({ status: 200, description: 'Active sessions retrieved' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getActiveSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.tokenService.getUserActiveSessions(user.id);
  }

  /**
   * 🔒 تسجيل الخروج من جميع الأجهزة
   */
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute (sensitive action)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'Logged out from all devices' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const count = await this.tokenService.revokeAllUserSessions(
      user.id,
      'User requested logout from all devices',
    );

    // 🔒 تسجيل النشاط الأمني
    const userAgent = req.headers['user-agent'];
    const ipAddress = getClientIp(req);
    await this.securityLogService.createLog({
      userId: user.id,
      action: SecurityAction.SESSION_DELETED_ALL,
      status: SecurityStatus.SUCCESS,
      description: `تسجيل الخروج من جميع الأجهزة (${count} جلسات)`,
      ipAddress,
      userAgent,
    });

    // 🔒 مسح جميع Auth Cookies
    clearAuthCookies(res);

    return {
      success: true,
      message: `تم تسجيل الخروج من ${count} جهاز`,
      devicesLoggedOut: count,
    };
  }

  /**
   * 🔒 إبطال جلسة معينة
   */
  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
  ) {
    // 🔒 Verify the session belongs to the authenticated user (prevent IDOR)
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });

    if (!session || session.userId !== user.id) {
      throw new ForbiddenException('لا يمكنك إنهاء هذه الجلسة');
    }

    await this.tokenService.revokeSession(sessionId, 'User revoked session');
    return {
      success: true,
      message: 'تم إنهاء الجلسة بنجاح',
    };
  }

  /**
   * 🔒 تسجيل الخروج - يعمل حتى مع توكن منتهي أو جلسة مُبطلة
   * لا نستخدم JwtAuthGuard حتى يصل الطلب دائماً ونُمسح الكوكيز ونُبطل الجلسة إن وُجدت
   */
  @Post('logout')
  @Public() // 🔒 F-07: must work with an expired/absent access token
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user (works with expired token)' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = extractAccessToken(req);

    // 1. إبطال الجلسة في DB أولاً (حتى مع توكن منتهي)
    const result = await this.authService.logout(token);

    // 2. مسح جميع Auth Cookies دائماً (حتى لو لم توجد جلسة)
    clearAuthCookies(res);

    return result;
  }

  @Get('google')
  @Public() // 🔒 F-07: OAuth initiation (authenticated via GoogleAuthGuard, not JWT)
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirect to Google OAuth' })
  async googleAuth(@Req() req: Request) {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @Public() // 🔒 F-07: OAuth callback (authenticated via GoogleAuthGuard, not JWT)
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 200, description: 'Google OAuth successful' })
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = getClientIp(req);

    const { origin, linkToken, nextUrl } = await this.resolveOAuthState(req);

    if (linkToken) {
      await this.accountLinkingService.completeLinking(
        linkToken,
        {
          providerId: req.user.googleId,
          email: req.user.email,
          name: req.user.name,
          avatar: req.user.avatar,
        },
        ipAddress,
        userAgent,
      );
      const base = this.resolveRedirectBase(origin);
      return res.redirect(`${base}/settings/security?linked=google`);
    }

    const result = await this.authService.googleLogin(
      req.user,
      userAgent,
      ipAddress,
    );

    // 🔒 لا نضع Cookie هنا — سيُضبط في /oauth/exchange بعد إنشاء الجلسة عبر TokenService
    // السبب: redirect من port 3001 إلى 3000 يُعتبر cross-origin
    const code = await this.oauthCodeService.generate(
      {
        userId: result.user.id,
        email: result.user.email,
        user: result.user,
        needsProfileCompletion: result.needsProfileCompletion,
        userAgent,
        ipAddress,
        requiresLinking: result.requiresLinking,
        requiresChallenge: result.requiresChallenge,
        challengeReasons: result.challengeReasons,
      },
      ipAddress,
    );

    const base = this.resolveRedirectBase(origin);
    res.redirect(this.buildOAuthHandoffRedirect(base, code, nextUrl));
  }

  @Post('oauth/exchange')
  @Public() // 🔒 F-07: exchanges one-time code for a session; no access token yet
  @HttpCode(HttpStatus.OK)
  @Throttle(
    process.env.NODE_ENV === 'production'
      ? { default: { limit: 10, ttl: 60000 } } // 🔒 10/min in production
      : { default: { limit: 50, ttl: 60000 } },
  ) // 50/min in development
  @ApiOperation({ summary: 'Exchange one-time OAuth code for session cookies' })
  @ApiResponse({
    status: 200,
    description: 'Session created, tokens stored in httpOnly cookies',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  async exchangeOAuthCode(
    @Body() body: ExchangeCodeDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // 🔒 CSRF Origin validation
    const csrfCheck = validateCsrfToken(req, true);
    if (!csrfCheck.valid) {
      throw new ForbiddenException(
        `CSRF validation failed: ${csrfCheck.reason}`,
      );
    }

    const exchanged = await this.oauthCodeService.exchange(
      body.code,
      getClientIp(req),
    );
    const {
      userId,
      email,
      user,
      needsProfileCompletion,
      userAgent,
      ipAddress,
      requiresLinking,
      requiresChallenge,
      challengeReasons,
    } = exchanged;

    // 🔒 Fix 3: إذا كان يتطلب ربط حساب — لا نُنشئ جلسة حتى يؤكد المستخدم
    if (requiresLinking) {
      return {
        success: false,
        requiresLinking: true,
        message:
          'يوجد حساب مسجل بهذا البريد الإلكتروني. سجل الدخول بالطريقة المعتادة ثم اربط الحساب من الإعدادات.',
      };
    }

    // 🔒 إذا اكتشف نظام كشف الشذوذ نشاطاً مشبوهاً — يتطلب تحقق إضافي
    if (requiresChallenge) {
      // إنشاء جلسة 2FA معلقة للتحقق
      const pendingSessionId = await this.pendingTwoFactorService.create(
        userId,
        email,
      );

      return {
        success: false,
        requiresChallenge: true,
        requires2FA: true,
        pendingSessionId,
        challengeReasons: challengeReasons || [],
        message: 'تم اكتشاف نشاط غير اعتيادي. يرجى التحقق من هويتك.',
      };
    }

    // 🔒 Fix 1+2: إنشاء الجلسة هنا عبر TokenService (يطبق enforceMaxActiveSessions)
    const { tokens } = await this.tokenService.generateTokenPair(
      userId,
      email,
      {
        userId,
        userAgent: userAgent || req.headers['user-agent'],
        ipAddress: ipAddress || req.ip || req.socket.remoteAddress,
      },
    );

    // 🔒 Access Token في httpOnly Cookie
    setAccessTokenCookie(res, tokens.accessToken);
    // 🔒 Refresh Token في httpOnly Cookie
    setRefreshTokenCookie(res, tokens.refreshToken);

    // 🔒 توليد CSRF Token
    const csrfToken = generateCsrfToken();
    setCsrfTokenCookie(res, csrfToken);

    return {
      success: true,
      csrf_token: csrfToken,
      expires_in: TOKEN_EXPIRY.accessToken,
      user,
      needsProfileCompletion,
      message: 'Tokens stored in httpOnly cookies',
    };
  }

  /**
   * Issue a one-time OAuth code for the current session (cross-app redirect).
   * POST /auth/oauth/issue-code
   */
  @Post('oauth/issue-code')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Issue one-time OAuth code for authenticated user' })
  @ApiResponse({ status: 200, description: 'Code issued' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async issueOAuthCode(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });

    if (!fullUser) {
      throw new UnauthorizedException('User not found');
    }

    const code = await this.oauthCodeService.generate(
      {
        userId: fullUser.id,
        email: fullUser.email,
        user: {
          id: fullUser.id,
          email: fullUser.email,
          role: fullUser.role,
          name: fullUser.profile?.name,
          username: fullUser.profile?.username,
          avatar: fullUser.profile?.avatar,
          profileCompleted: fullUser.profileCompleted,
        },
        needsProfileCompletion: !fullUser.profileCompleted,
        userAgent: req.headers['user-agent'],
        ipAddress: getClientIp(req),
      },
      getClientIp(req),
    );

    return { success: true, code };
  }

  @Get('linkedin')
  @Public() // 🔒 F-07: OAuth initiation (authenticated via LinkedInAuthGuard, not JWT)
  @UseGuards(LinkedInAuthGuard)
  @ApiOperation({ summary: 'LinkedIn OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirect to LinkedIn OAuth' })
  async linkedinAuth(@Req() req: Request) {
    // Guard redirects to LinkedIn
  }

  @Get('linkedin/callback')
  @Public() // 🔒 F-07: OAuth callback (authenticated via LinkedInAuthGuard, not JWT)
  @UseGuards(LinkedInAuthGuard)
  @ApiOperation({ summary: 'LinkedIn OAuth callback' })
  @ApiResponse({ status: 200, description: 'LinkedIn OAuth successful' })
  async linkedinAuthCallback(@Req() req: any, @Res() res: Response) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = getClientIp(req);

    const { origin, linkToken, nextUrl } = await this.resolveOAuthState(req);

    if (linkToken) {
      await this.accountLinkingService.completeLinking(
        linkToken,
        {
          providerId: req.user.linkedinId,
          email: req.user.email,
          name: req.user.name,
          avatar: req.user.avatar,
        },
        ipAddress,
        userAgent,
      );
      const base = this.resolveRedirectBase(origin);
      return res.redirect(`${base}/settings/security?linked=linkedin`);
    }

    const result = await this.authService.linkedinLogin(
      req.user,
      userAgent,
      ipAddress,
    );

    // 🔒 لا نضع Cookie هنا — سيُضبط في /oauth/exchange بعد إنشاء الجلسة عبر TokenService
    const code = await this.oauthCodeService.generate(
      {
        userId: result.user.id,
        email: result.user.email,
        user: result.user,
        needsProfileCompletion: result.needsProfileCompletion,
        userAgent,
        ipAddress,
        requiresLinking: result.requiresLinking,
        requiresChallenge: result.requiresChallenge,
        challengeReasons: result.challengeReasons,
      },
      ipAddress,
    );

    const base = this.resolveRedirectBase(origin);
    res.redirect(this.buildOAuthHandoffRedirect(base, code, nextUrl));
  }

  @Get('facebook')
  @Public() // 🔒 F-07: OAuth initiation (authenticated via FacebookAuthGuard, not JWT)
  @UseGuards(OAuthProviderEnabledGuard('facebook'), FacebookAuthGuard)
  @ApiOperation({ summary: 'Facebook OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirect to Facebook OAuth' })
  async facebookAuth() {
    // Guard redirects to Facebook
  }

  @Get('facebook/callback')
  @Public() // 🔒 F-07: OAuth callback (authenticated via FacebookAuthGuard, not JWT)
  @UseGuards(OAuthProviderEnabledGuard('facebook'), FacebookAuthGuard)
  @ApiOperation({ summary: 'Facebook OAuth callback' })
  @ApiResponse({ status: 200, description: 'Facebook OAuth successful' })
  async facebookAuthCallback(@Req() req: any, @Res() res: Response) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = getClientIp(req);

    const { origin, linkToken, nextUrl } = await this.resolveOAuthState(req);

    if (linkToken) {
      await this.accountLinkingService.completeLinking(
        linkToken,
        {
          providerId: req.user.facebookId,
          email: req.user.email,
          name: req.user.name,
          avatar: req.user.avatar,
        },
        ipAddress,
        userAgent,
      );
      const base = this.resolveRedirectBase(origin);
      return res.redirect(`${base}/settings/security?linked=facebook`);
    }

    const result = await this.authService.facebookLogin(
      req.user,
      userAgent,
      ipAddress,
    );

    const code = await this.oauthCodeService.generate(
      {
        userId: result.user.id,
        email: result.user.email,
        user: result.user,
        needsProfileCompletion: result.needsProfileCompletion,
        userAgent,
        ipAddress,
        requiresLinking: result.requiresLinking,
        requiresChallenge: result.requiresChallenge,
        challengeReasons: result.challengeReasons,
      },
      ipAddress,
    );

    const base = this.resolveRedirectBase(origin);
    res.redirect(this.buildOAuthHandoffRedirect(base, code, nextUrl));
  }

  @Get('github')
  @Public() // 🔒 F-07: OAuth initiation (authenticated via GitHubAuthGuard, not JWT)
  @UseGuards(OAuthProviderEnabledGuard('github'), GitHubAuthGuard)
  @ApiOperation({ summary: 'GitHub OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirect to GitHub OAuth' })
  async githubAuth() {
    // Guard redirects to GitHub
  }

  @Get('github/callback')
  @Public() // 🔒 F-07: OAuth callback (authenticated via GitHubAuthGuard, not JWT)
  @UseGuards(OAuthProviderEnabledGuard('github'), GitHubAuthGuard)
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiResponse({ status: 200, description: 'GitHub OAuth successful' })
  async githubAuthCallback(@Req() req: any, @Res() res: Response) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = getClientIp(req);

    const { origin, linkToken, nextUrl } = await this.resolveOAuthState(req);

    if (linkToken) {
      await this.accountLinkingService.completeLinking(
        linkToken,
        {
          providerId: req.user.githubId,
          email: req.user.email,
          name: req.user.name,
          avatar: req.user.avatar,
        },
        ipAddress,
        userAgent,
      );
      const base = this.resolveRedirectBase(origin);
      return res.redirect(`${base}/settings/security?linked=github`);
    }

    const result = await this.authService.githubLogin(
      req.user,
      userAgent,
      ipAddress,
    );

    const code = await this.oauthCodeService.generate(
      {
        userId: result.user.id,
        email: result.user.email,
        user: result.user,
        needsProfileCompletion: result.needsProfileCompletion,
        userAgent,
        ipAddress,
        requiresLinking: result.requiresLinking,
        requiresChallenge: result.requiresChallenge,
        challengeReasons: result.challengeReasons,
      },
      ipAddress,
    );

    const base = this.resolveRedirectBase(origin);
    res.redirect(this.buildOAuthHandoffRedirect(base, code, nextUrl));
  }

  /**
   * Deliver the one-time handoff code via query string (primary) and hash
   * (compat). Query is required for reliable Next.js App Router clients — the
   * fragment is invisible to the server and is easy to lose across remounts.
   */
  private buildOAuthHandoffRedirect(
    base: string,
    code: string,
    nextUrl?: string | null,
  ): string {
    const dest = new URL(`${base.replace(/\/+$/, '')}/callback`);
    dest.searchParams.set('code', code);
    if (nextUrl) {
      dest.searchParams.set('next', nextUrl);
    }
    return dest.toString();
  }

  /**
   * Resolve redirect base URL from OAuth state parameter.
   * Validates against allowed origins to prevent open redirect.
   */
  private resolveRedirectBase(stateOrigin?: string): string {
    const fallback =
      process.env.NODE_ENV === 'development' && process.env.FRONTEND_URL_DEV
        ? process.env.FRONTEND_URL_DEV
        : process.env.AUTH_FRONTEND_URL ||
          process.env.FRONTEND_URL ||
          'http://localhost:3000';

    if (!stateOrigin || typeof stateOrigin !== 'string') return fallback;

    // Validate against allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3003',
      'http://localhost:3004',
      'https://localhost:3000',
      'https://localhost:3003',
      'https://localhost:3004',
      'http://localhost:3005',
      'https://localhost:3005',
      'http://localhost:3007',
      'https://localhost:3007',
      'https://rukny.io',
      'https://www.rukny.io',
      'https://app.rukny.io',
      'https://accounts.rukny.io',
      'https://business.rukny.io',
      'https://developers.rukny.io',
      process.env.FRONTEND_URL,
      process.env.AUTH_FRONTEND_URL,
      process.env.DEVELOPERS_FRONTEND_URL,
      process.env.BUSINESS_FRONTEND_URL,
    ].filter(Boolean);

    // Normalize: remove trailing slash
    const normalized = stateOrigin.replace(/\/+$/, '');

    if (allowedOrigins.some((o) => o.replace(/\/+$/, '') === normalized)) {
      return normalized;
    }

    // In development, allow any localhost origin
    if (process.env.NODE_ENV === 'development') {
      try {
        const url = new URL(normalized);
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          return normalized;
        }
      } catch {
        /* invalid URL */
      }
    }

    return fallback;
  }
}
