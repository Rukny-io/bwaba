import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { QuickSignType, SecurityAction, SecurityStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { UAParser } from 'ua-parser-js';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { RedisService } from '../../core/cache/redis.service';
import { SecurityLogService } from '../../infrastructure/security/log.service';
import { SecurityDetectorService } from '../../infrastructure/security/detector.service';
import { BruteForceService } from '../../infrastructure/security/brute-force.service';
import { ResendService } from '../../integrations/email/resend.service';
import { EmailService } from '../../integrations/email/email.service';
import { AccountLockoutService } from './account-lockout.service';
import { TokenService } from './token.service';
import { TwoFactorService } from './two-factor.service';
import { PendingTwoFactorService } from './pending-two-factor.service';
import { IpVerificationService } from './ip-verification.service';
import {
  BCRYPT_ROUNDS,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_RESET_EXPIRY_MINUTES,
} from './password.constants';
import { getTrustedDeviceId } from './cookie.config';
import type { Request } from 'express';

const GENERIC_AUTH_ERROR = 'Invalid email or password';
const GENERIC_FORGOT_MESSAGE =
  'If an account exists for this email, you will receive a password reset link shortly.';

export interface PasswordAuthSuccess {
  success: true;
  user: {
    id: string;
    email: string;
    role: string;
    name?: string;
    username?: string;
    avatar?: string;
    profileCompleted: boolean;
    emailVerified: boolean;
  };
  needsProfileCompletion: boolean;
  needsEmailVerification: boolean;
  tokens: { accessToken: string; refreshToken: string };
}

export interface PasswordAuthRequires2FA {
  success: false;
  requires2FA: true;
  pendingSessionId: string;
  email: string;
  message: string;
}

export type PasswordAuthResult = PasswordAuthSuccess | PasswordAuthRequires2FA;

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);
  private readonly CACHE_PREFIX = 'password-reset:';
  private readonly RESET_LOCK_PREFIX = 'password-reset:lock:';
  private dummyHashPromise: Promise<string> | null = null;
  private readonly quickSignSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
    private readonly accountLockoutService: AccountLockoutService,
    private readonly tokenService: TokenService,
    private readonly twoFactorService: TwoFactorService,
    private readonly pendingTwoFactorService: PendingTwoFactorService,
    private readonly securityLogService: SecurityLogService,
    private readonly securityDetectorService: SecurityDetectorService,
    private readonly bruteForceService: BruteForceService,
    private readonly resendService: ResendService,
    private readonly emailService: EmailService,
    private readonly ipVerificationService: IpVerificationService,
  ) {
    this.quickSignSecret =
      this.configService.get<string>('QUICKSIGN_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      '';
    if (!this.quickSignSecret) {
      throw new Error('QUICKSIGN_SECRET or JWT_SECRET must be set');
    }
  }

  private async getDummyHash(): Promise<string> {
    if (!this.dummyHashPromise) {
      this.dummyHashPromise = bcrypt.hash(
        '__rukny_timing_dummy__',
        BCRYPT_ROUNDS,
      );
    }
    return this.dummyHashPromise;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  validatePasswordPolicy(password: string): void {
    if (
      password.length < PASSWORD_MIN_LENGTH ||
      password.length > PASSWORD_MAX_LENGTH
    ) {
      throw new BadRequestException(
        `Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`,
      );
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one letter and one number',
      );
    }
  }

  async hashPassword(password: string): Promise<string> {
    this.validatePasswordPolicy(password);
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  async verifyPassword(
    password: string,
    passwordHash: string | null | undefined,
  ): Promise<boolean> {
    const hash = passwordHash || (await this.getDummyHash());
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }

  private parseUa(userAgent?: string) {
    const parser = new UAParser(userAgent || '');
    const result = parser.getResult();
    return {
      deviceType: result.device.type || 'desktop',
      browser: result.browser.name || 'Unknown',
      os: result.os.name || 'Unknown',
    };
  }

  private async loadUserForAuth(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        passwordHash: true,
        profileCompleted: true,
        emailVerified: true,
        isDeactivated: true,
        twoFactorEnabled: true,
        googleId: true,
        githubId: true,
        linkedinId: true,
        facebookId: true,
        profile: {
          select: { name: true, username: true, avatar: true },
        },
      },
    });
  }

  private formatUser(user: {
    id: string;
    email: string;
    role: string;
    profileCompleted: boolean;
    emailVerified?: boolean;
    profile?: {
      name?: string | null;
      username?: string | null;
      avatar?: string | null;
    } | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.profile?.name || undefined,
      username: user.profile?.username || undefined,
      avatar: user.profile?.avatar || undefined,
      profileCompleted: user.profileCompleted,
      emailVerified: Boolean(user.emailVerified),
    };
  }

  private hasOtherSignInMethod(user: {
    googleId?: string | null;
    githubId?: string | null;
    linkedinId?: string | null;
    facebookId?: string | null;
  }): boolean {
    return Boolean(
      user.googleId || user.githubId || user.linkedinId || user.facebookId,
    );
  }

  /**
   * Email + password login. Issues tokens or a 2FA pending session.
   */
  async login(
    emailRaw: string,
    password: string,
    meta: { ipAddress?: string; userAgent?: string; req?: Request },
  ): Promise<PasswordAuthResult> {
    const email = this.normalizeEmail(emailRaw);
    const { ipAddress, userAgent, req } = meta;
    const ua = this.parseUa(userAgent);

    const lockout = await this.accountLockoutService.checkBeforeAttempt(
      email,
      ipAddress,
    );
    if (!lockout.allowed) {
      throw new ForbiddenException({
        message: lockout.message || 'Account temporarily locked',
        lockoutMinutes: lockout.lockoutMinutes,
      });
    }

    const user = await this.loadUserForAuth(email);
    const passwordOk = await this.verifyPassword(
      password,
      user?.passwordHash,
    );

    if (!user || user.isDeactivated || !user.passwordHash || !passwordOk) {
      await this.accountLockoutService.recordFailedAttempt(
        email,
        ipAddress,
        'invalid_password',
      );
      if (user?.id) {
        await this.securityLogService.createLog({
          userId: user.id,
          action: SecurityAction.LOGIN_FAILED,
          status: SecurityStatus.FAILED,
          description: 'Password login failed',
          ipAddress,
          deviceType: ua.deviceType,
          browser: ua.browser,
          os: ua.os,
          userAgent,
        });
      }
      throw new UnauthorizedException(GENERIC_AUTH_ERROR);
    }

    if (await this.twoFactorService.requiresTwoFactor(user.id)) {
      if (req) {
        const trustedDeviceId = getTrustedDeviceId(req);
        if (trustedDeviceId) {
          const trusted =
            await this.securityDetectorService.findTrustedDeviceById(
              trustedDeviceId,
              user.id,
            );
          if (trusted) {
            return this.completeLogin(user, { ipAddress, userAgent, ua });
          }
        }
      }

      const pendingSessionId = await this.pendingTwoFactorService.create(
        user.id,
        user.email,
      );
      return {
        success: false,
        requires2FA: true,
        pendingSessionId,
        email: user.email,
        message: 'Two-factor authentication required',
      };
    }

    return this.completeLogin(user, { ipAddress, userAgent, ua });
  }

  private async completeLogin(
    user: Awaited<ReturnType<typeof this.loadUserForAuth>> & object,
    meta: {
      ipAddress?: string;
      userAgent?: string;
      ua: { deviceType: string; browser: string; os: string };
    },
  ): Promise<PasswordAuthSuccess> {
    if (!user) {
      throw new UnauthorizedException(GENERIC_AUTH_ERROR);
    }

    const { tokens } = await this.tokenService.generateTokenPair(
      user.id,
      user.email,
      {
        userId: user.id,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    );

    await this.accountLockoutService.recordSuccessfulAttempt(
      user.email,
      meta.ipAddress,
    );

    if (meta.ipAddress) {
      await this.ipVerificationService
        .updateLastKnownIP(user.id, meta.ipAddress)
        .catch(() => undefined);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await this.securityLogService.createLog({
      userId: user.id,
      action: SecurityAction.LOGIN_SUCCESS,
      status: SecurityStatus.SUCCESS,
      description: 'Password login success',
      ipAddress: meta.ipAddress,
      deviceType: meta.ua.deviceType,
      browser: meta.ua.browser,
      os: meta.ua.os,
      userAgent: meta.userAgent,
    });

    return {
      success: true,
      user: this.formatUser(user),
      needsProfileCompletion: !user.profileCompleted,
      needsEmailVerification: !user.emailVerified,
      tokens,
    };
  }

  /**
   * Register a new account with email + password.
   */
  async register(
    emailRaw: string,
    password: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<PasswordAuthSuccess> {
    const email = this.normalizeEmail(emailRaw);
    this.validatePasswordPolicy(password);

    const existing = await this.prisma.user.findFirst({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        message: 'An account with this email already exists',
        code: 'EMAIL_EXISTS',
      });
    }

    const passwordHash = await this.hashPassword(password);
    const baseUsername = email
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_')
      .slice(0, 20);
    const username = `${baseUsername}_${crypto.randomBytes(3).toString('hex')}`;

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        passwordUpdatedAt: new Date(),
        emailVerified: false,
        profileCompleted: false,
        profile: {
          create: {
            username,
            name: email.split('@')[0],
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        profileCompleted: true,
        emailVerified: true,
        profile: { select: { name: true, username: true, avatar: true } },
      },
    });

    const ua = this.parseUa(meta.userAgent);
    const { tokens } = await this.tokenService.generateTokenPair(
      user.id,
      user.email,
      {
        userId: user.id,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
    );

    await this.securityLogService.createLog({
      userId: user.id,
      action: SecurityAction.LOGIN_SUCCESS,
      status: SecurityStatus.SUCCESS,
      description: 'Account registered with password',
      ipAddress: meta.ipAddress,
      deviceType: ua.deviceType,
      browser: ua.browser,
      os: ua.os,
      userAgent: meta.userAgent,
    });

    // Soft-send verification — registration still succeeds if email fails
    await this.sendEmailVerificationCode(user.id).catch((err) =>
      this.logger.warn(
        `Failed to send signup verification email: ${(err as Error).message}`,
      ),
    );

    return {
      success: true,
      user: this.formatUser(user),
      needsProfileCompletion: true,
      needsEmailVerification: true,
      tokens,
    };
  }

  /**
   * Send a 6-digit email verification code to the authenticated user.
   */
  async sendEmailVerificationCode(userId: string): Promise<{
    success: true;
    message: string;
    email: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        profile: { select: { name: true } },
      },
    });

    if (!user) throw new UnauthorizedException();
    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.verification_codes.deleteMany({
      where: {
        userId,
        type: 'EMAIL_VERIFICATION',
        verified: false,
      },
    });

    await this.prisma.verification_codes.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        code,
        type: 'EMAIL_VERIFICATION',
        expiresAt,
      },
    });

    const name = user.profile?.name || 'there';
    try {
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Verify your email — Rukny',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
            <h2 style="color: #1a1a1a; margin-bottom: 16px;">Verify your email</h2>
            <p style="color: #666; font-size: 14px;">Hi ${name},</p>
            <p style="color: #666; font-size: 14px;">Use this code to verify your Rukny account:</p>
            <div style="background: #f4f4f5; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <code style="font-size: 28px; letter-spacing: 6px; font-weight: bold; color: #1a1a1a;">${code}</code>
            </div>
            <p style="color: #999; font-size: 12px;">This code expires in 30 minutes.</p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send email verification to ${user.email}`,
        error,
      );
      throw new BadRequestException('Could not send verification email');
    }

    return {
      success: true,
      message: 'Verification code sent',
      email: user.email,
    };
  }

  /**
   * Verify email with the 6-digit code.
   */
  async verifyEmailCode(
    userId: string,
    codeRaw: string,
  ): Promise<{
    success: true;
    message: string;
    emailVerified: true;
    needsProfileCompletion: boolean;
  }> {
    const code = codeRaw.trim();
    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException('Invalid verification code');
    }

    const verification = await this.prisma.verification_codes.findFirst({
      where: {
        userId,
        type: 'EMAIL_VERIFICATION',
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    if (verification.attempts >= 5) {
      throw new BadRequestException('Too many attempts. Request a new code.');
    }

    if (verification.code !== code) {
      await this.prisma.verification_codes.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Incorrect verification code');
    }

    await this.prisma.$transaction([
      this.prisma.verification_codes.update({
        where: { id: verification.id },
        data: { verified: true, verifiedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
      }),
    ]);

    await this.redis.del(`user:profile:${userId}`).catch(() => undefined);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profileCompleted: true },
    });

    return {
      success: true,
      message: 'Email verified successfully',
      emailVerified: true,
      needsProfileCompletion: !user?.profileCompleted,
    };
  }

  async getEmailVerificationStatus(userId: string): Promise<{
    email: string;
    emailVerified: boolean;
    profileCompleted: boolean;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        emailVerified: true,
        profileCompleted: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  /**
   * Request a password reset email. Always returns a generic message.
   */
  async forgotPassword(
    emailRaw: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ success: true; message: string }> {
    const email = this.normalizeEmail(emailRaw);

    const bf = await this.bruteForceService.recordResetAttempt(
      email,
      meta.ipAddress || 'unknown',
    );
    if (bf.blocked) {
      // Still return generic success to avoid enumeration
      return { success: true, message: GENERIC_FORGOT_MESSAGE };
    }

    const user = await this.prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
        isDeactivated: true,
        profile: { select: { name: true } },
      },
    });

    if (user && !user.isDeactivated) {
      try {
        const token = await this.createPasswordResetToken(
          user.email,
          user.id,
          meta,
        );
        await this.resendService.sendPasswordResetEmail(
          user.email,
          user.profile?.name || 'there',
          token,
        );
      } catch (err) {
        this.logger.warn(
          `Failed to send password reset for ${email}: ${(err as Error).message}`,
        );
      }
    }

    return { success: true, message: GENERIC_FORGOT_MESSAGE };
  }

  private async createPasswordResetToken(
    email: string,
    userId: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<string> {
    // Invalidate previous unused reset tokens for this email
    await this.prisma.quicksign_links.updateMany({
      where: {
        email,
        type: QuickSignType.PASSWORD_RESET,
        used: false,
      },
      data: { used: true, usedAt: new Date() },
    });

    const uuid = uuidv4();
    const payload = {
      email,
      type: QuickSignType.PASSWORD_RESET,
      uuid,
      userId,
    };

    const jwtToken = this.jwtService.sign(payload, {
      expiresIn: PASSWORD_RESET_EXPIRY_MINUTES * 60,
      secret: this.quickSignSecret,
      algorithm: 'HS256',
    });

    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() + PASSWORD_RESET_EXPIRY_MINUTES,
    );
    const tokenHash = this.hashToken(jwtToken);

    await this.redis.set(
      `${this.CACHE_PREFIX}${tokenHash}`,
      { email, userId, type: QuickSignType.PASSWORD_RESET, used: false },
      PASSWORD_RESET_EXPIRY_MINUTES * 60,
    );

    await this.prisma.quicksign_links.create({
      data: {
        id: uuidv4(),
        email,
        token: tokenHash,
        type: QuickSignType.PASSWORD_RESET,
        expiresAt,
        userId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    return jwtToken;
  }

  /**
   * Reset password using email token. Revokes all sessions.
   */
  async resetPassword(
    token: string,
    newPassword: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ success: true; message: string }> {
    this.validatePasswordPolicy(newPassword);

    const tokenHash = this.hashToken(token);
    const lockKey = `${this.RESET_LOCK_PREFIX}${tokenHash}`;
    const locked = await this.redis.setNX(lockKey, '1', 10);
    if (!locked) {
      throw new BadRequestException('Reset already in progress. Please wait.');
    }

    try {
      let payload: { email?: string; type?: string; userId?: string };
      try {
        payload = this.jwtService.verify(token, {
          secret: this.quickSignSecret,
          algorithms: ['HS256'],
        });
      } catch {
        throw new BadRequestException('Invalid or expired reset link');
      }

      if (payload.type !== QuickSignType.PASSWORD_RESET || !payload.email) {
        throw new BadRequestException('Invalid or expired reset link');
      }

      const link = await this.prisma.quicksign_links.findFirst({
        where: {
          token: tokenHash,
          type: QuickSignType.PASSWORD_RESET,
        },
      });

      if (!link || link.used || new Date() > link.expiresAt) {
        throw new BadRequestException('Invalid or expired reset link');
      }

      const user = await this.prisma.user.findFirst({
        where: { email: payload.email },
        select: {
          id: true,
          email: true,
          isDeactivated: true,
          profile: { select: { name: true } },
          security_preferences: { select: { emailOnPasswordChange: true } },
        },
      });

      if (!user || user.isDeactivated) {
        throw new BadRequestException('Invalid or expired reset link');
      }

      const passwordHash = await this.hashPassword(newPassword);

      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            passwordUpdatedAt: new Date(),
          },
        }),
        this.prisma.quicksign_links.update({
          where: { id: link.id },
          data: { used: true, usedAt: new Date() },
        }),
      ]);

      await this.redis.del(`${this.CACHE_PREFIX}${tokenHash}`);

      const revoked = await this.tokenService.revokeAllUserSessions(
        user.id,
        'Password reset',
      );

      const ua = this.parseUa(meta.userAgent);
      await this.securityLogService.createLog({
        userId: user.id,
        action: SecurityAction.PASSWORD_CHANGE,
        status: SecurityStatus.SUCCESS,
        description: `Password reset via email (${revoked} sessions revoked)`,
        ipAddress: meta.ipAddress,
        deviceType: ua.deviceType,
        browser: ua.browser,
        os: ua.os,
        userAgent: meta.userAgent,
      });

      const shouldNotify =
        user.security_preferences?.emailOnPasswordChange !== false;
      if (shouldNotify) {
        await this.emailService
          .sendPasswordChangeAlert(user.email, user.profile?.name || 'User', {
            ipAddress: meta.ipAddress,
            browser: ua.browser,
            timestamp: new Date(),
          })
          .catch((err) =>
            this.logger.warn(`Password change email failed: ${err.message}`),
          );
      }

      return {
        success: true,
        message: 'Password updated. Please sign in with your new password.',
      };
    } finally {
      await this.redis.del(lockKey);
    }
  }

  async getPasswordStatus(userId: string): Promise<{
    hasPassword: boolean;
    passwordUpdatedAt: Date | null;
    canRemove: boolean;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        passwordHash: true,
        passwordUpdatedAt: true,
        googleId: true,
        githubId: true,
        linkedinId: true,
        facebookId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const hasPassword = Boolean(user.passwordHash);
    return {
      hasPassword,
      passwordUpdatedAt: user.passwordUpdatedAt,
      canRemove: hasPassword && this.hasOtherSignInMethod(user),
    };
  }

  /**
   * Set a password for the first time (authenticated user without password).
   */
  async setPassword(
    userId: string,
    password: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ success: true; message: string }> {
    this.validatePasswordPolicy(password);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        profile: { select: { name: true } },
        security_preferences: { select: { emailOnPasswordChange: true } },
      },
    });

    if (!user) throw new UnauthorizedException();
    if (user.passwordHash) {
      throw new ConflictException(
        'Password already set. Use change password instead.',
      );
    }

    const passwordHash = await this.hashPassword(password);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, passwordUpdatedAt: new Date() },
    });

    await this.logPasswordChange(user, meta, 'Password set');
    return { success: true, message: 'Password set successfully' };
  }

  /**
   * Change password (requires current password). Revokes other sessions.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    meta: { ipAddress?: string; userAgent?: string; currentSessionId?: string },
  ): Promise<{ success: true; message: string }> {
    this.validatePasswordPolicy(newPassword);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        profile: { select: { name: true } },
        security_preferences: { select: { emailOnPasswordChange: true } },
      },
    });

    if (!user?.passwordHash) {
      throw new BadRequestException('No password set on this account');
    }

    const ok = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const passwordHash = await this.hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, passwordUpdatedAt: new Date() },
    });

    // Revoke all sessions except current
    const sessions = await this.prisma.session.findMany({
      where: { userId, isRevoked: false },
      select: { id: true },
    });
    for (const session of sessions) {
      if (meta.currentSessionId && session.id === meta.currentSessionId) {
        continue;
      }
      await this.tokenService.revokeSession(session.id, 'Password changed');
    }

    await this.logPasswordChange(user, meta, 'Password changed');
    return { success: true, message: 'Password changed successfully' };
  }

  /**
   * Remove password if another sign-in method remains.
   */
  async removePassword(
    userId: string,
    currentPassword: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<{ success: true; message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        googleId: true,
        githubId: true,
        linkedinId: true,
        facebookId: true,
        profile: { select: { name: true } },
        security_preferences: { select: { emailOnPasswordChange: true } },
      },
    });

    if (!user?.passwordHash) {
      throw new BadRequestException('No password set on this account');
    }

    if (!this.hasOtherSignInMethod(user)) {
      throw new ForbiddenException(
        'Cannot remove password without another sign-in method',
      );
    }

    const ok = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: null, passwordUpdatedAt: new Date() },
    });

    await this.logPasswordChange(user, meta, 'Password removed');
    return { success: true, message: 'Password removed successfully' };
  }

  private async logPasswordChange(
    user: {
      id: string;
      email: string;
      profile?: { name?: string | null } | null;
      security_preferences?: { emailOnPasswordChange?: boolean } | null;
    },
    meta: { ipAddress?: string; userAgent?: string },
    description: string,
  ) {
    const ua = this.parseUa(meta.userAgent);
    await this.securityLogService.createLog({
      userId: user.id,
      action: SecurityAction.PASSWORD_CHANGE,
      status: SecurityStatus.SUCCESS,
      description,
      ipAddress: meta.ipAddress,
      deviceType: ua.deviceType,
      browser: ua.browser,
      os: ua.os,
      userAgent: meta.userAgent,
    });

    if (user.security_preferences?.emailOnPasswordChange !== false) {
      await this.emailService
        .sendPasswordChangeAlert(user.email, user.profile?.name || 'User', {
          ipAddress: meta.ipAddress,
          browser: ua.browser,
          timestamp: new Date(),
        })
        .catch((err) =>
          this.logger.warn(`Password change email failed: ${err.message}`),
        );
    }
  }
}
