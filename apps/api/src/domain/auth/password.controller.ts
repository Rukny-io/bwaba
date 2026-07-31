import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { PasswordService } from './password.service';
import {
  PasswordLoginDto,
  PasswordRegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  SetPasswordDto,
  ChangePasswordDto,
  RemovePasswordDto,
  VerifyEmailCodeDto,
} from './dto/password.dto';
import { Public } from '../../core/common/decorators/auth/public.decorator';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import { getClientIp } from '../../core/common/utils/client-ip.util';
import {
  validateCsrfToken,
  generateCsrfToken,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setCsrfTokenCookie,
  TOKEN_EXPIRY,
} from './cookie.config';

@ApiTags('Auth - Password')
@Controller('auth')
export class PasswordController {
  constructor(private readonly passwordService: PasswordService) {}

  private assertCsrf(req: Request) {
    const csrfCheck = validateCsrfToken(req, true);
    if (!csrfCheck.valid) {
      throw new ForbiddenException(
        `CSRF validation failed: ${csrfCheck.reason}`,
      );
    }
  }

  private issueSessionCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ): string {
    setAccessTokenCookie(res, tokens.accessToken);
    setRefreshTokenCookie(res, tokens.refreshToken);
    const csrfToken = generateCsrfToken();
    setCsrfTokenCookie(res, csrfToken);
    return csrfToken;
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle(
    process.env.NODE_ENV === 'production'
      ? { default: { limit: 5, ttl: 300000 } }
      : { default: { limit: 30, ttl: 60000 } },
  )
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 200, description: 'Session created or 2FA required' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() body: PasswordLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.assertCsrf(req);

    const result = await this.passwordService.login(body.email, body.password, {
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
      req,
    });

    // strictNullChecks is off — discriminate via `in` checks
    if ('tokens' in result) {
      const csrfToken = this.issueSessionCookies(res, result.tokens);
      return {
        success: true,
        csrf_token: csrfToken,
        expires_in: TOKEN_EXPIRY.accessToken,
        user: result.user,
        needsProfileCompletion: result.needsProfileCompletion,
        needsEmailVerification: result.needsEmailVerification,
      };
    }

    return {
      success: false,
      requires2FA: true,
      pendingSessionId: result.pendingSessionId,
      email: result.email,
      message: result.message,
    };
  }

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @Throttle(
    process.env.NODE_ENV === 'production'
      ? { default: { limit: 3, ttl: 3600000 } }
      : { default: { limit: 20, ttl: 60000 } },
  )
  @ApiOperation({ summary: 'Create an account with email and password' })
  async register(
    @Body() body: PasswordRegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.assertCsrf(req);

    const result = await this.passwordService.register(
      body.email,
      body.password,
      {
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'],
      },
    );

    const csrfToken = this.issueSessionCookies(res, result.tokens);
    return {
      success: true,
      csrf_token: csrfToken,
      expires_in: TOKEN_EXPIRY.accessToken,
      user: result.user,
      needsProfileCompletion: result.needsProfileCompletion,
      needsEmailVerification: result.needsEmailVerification,
    };
  }

  @Get('email/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get email verification status' })
  async emailStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.passwordService.getEmailVerificationStatus(user.id);
  }

  @Post('email/send-verification')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Throttle(
    process.env.NODE_ENV === 'production'
      ? { default: { limit: 3, ttl: 600000 } }
      : { default: { limit: 20, ttl: 60000 } },
  )
  @ApiOperation({ summary: 'Send email verification code' })
  async sendEmailVerification(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
  ) {
    this.assertCsrf(req);
    return this.passwordService.sendEmailVerificationCode(user.id);
  }

  @Post('email/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Throttle(
    process.env.NODE_ENV === 'production'
      ? { default: { limit: 10, ttl: 600000 } }
      : { default: { limit: 30, ttl: 60000 } },
  )
  @ApiOperation({ summary: 'Verify email with 6-digit code' })
  async verifyEmail(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: VerifyEmailCodeDto,
    @Req() req: Request,
  ) {
    this.assertCsrf(req);
    return this.passwordService.verifyEmailCode(user.id, body.code);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle(
    process.env.NODE_ENV === 'production'
      ? { default: { limit: 3, ttl: 3600000 } }
      : { default: { limit: 20, ttl: 60000 } },
  )
  @ApiOperation({ summary: 'Request a password reset email' })
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
    @Req() req: Request,
  ) {
    this.assertCsrf(req);
    return this.passwordService.forgotPassword(body.email, {
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle(
    process.env.NODE_ENV === 'production'
      ? { default: { limit: 5, ttl: 3600000 } }
      : { default: { limit: 20, ttl: 60000 } },
  )
  @ApiOperation({ summary: 'Reset password with email token' })
  async resetPassword(
    @Body() body: ResetPasswordDto,
    @Req() req: Request,
  ) {
    this.assertCsrf(req);
    return this.passwordService.resetPassword(body.token, body.password, {
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });
  }

  @Get('password/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Get password status for current user' })
  async passwordStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.passwordService.getPasswordStatus(user.id);
  }

  @Post('password/set')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @ApiOperation({ summary: 'Set password for the first time' })
  async setPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: SetPasswordDto,
    @Req() req: Request,
  ) {
    this.assertCsrf(req);
    return this.passwordService.setPassword(user.id, body.password, {
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
    });
  }

  @Post('password/change')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @ApiOperation({ summary: 'Change current password' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ChangePasswordDto,
    @Req() req: Request,
  ) {
    this.assertCsrf(req);
    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException('Current and new password are required');
    }
    return this.passwordService.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword,
      {
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'],
        currentSessionId: user.sessionId,
      },
    );
  }

  @Delete('password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @ApiOperation({ summary: 'Remove password (requires another sign-in method)' })
  async removePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: RemovePasswordDto,
    @Req() req: Request,
  ) {
    this.assertCsrf(req);
    return this.passwordService.removePassword(
      user.id,
      body.currentPassword,
      {
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'],
      },
    );
  }
}
