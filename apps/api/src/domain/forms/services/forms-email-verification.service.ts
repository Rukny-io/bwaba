import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { RedisService } from '../../../core/cache/redis.service';
import { EmailService } from '../../../integrations/email/email.service';
import { randomInt } from 'crypto';
import { hashOtp, compareOtp } from '../utils/form-email-otp.util';
import {
  FORMS_OTP_LOCK_SECONDS,
  FORMS_OTP_MAX_ATTEMPTS,
  FORMS_OTP_RESEND_COOLDOWN_SECONDS,
  FORMS_OTP_TTL_SECONDS,
  FORMS_OTP_VERIFIED_TTL_SECONDS,
} from '../forms.constants';

@Injectable()
export class FormsEmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly emailService: EmailService,
  ) {}

  private otpKey(formId: string, email: string) {
    return `form:email-verify:${formId}:${email.toLowerCase()}`;
  }

  private verifiedKey(formId: string, email: string) {
    return `form:email-verified:${formId}:${email.toLowerCase()}`;
  }

  private attemptKey(formId: string, email: string) {
    return `form:otp:attempts:${formId}:${email.toLowerCase()}`;
  }

  private lockKey(formId: string, email: string) {
    return `form:otp:lock:${formId}:${email.toLowerCase()}`;
  }

  private resendKey(formId: string, email: string) {
    return `form:otp:resend:${formId}:${email.toLowerCase()}`;
  }

  private async assertNotLocked(formId: string, email: string): Promise<void> {
    const locked = await this.redis.get(this.lockKey(formId, email));
    if (locked === '1') {
      throw new HttpException(
        {
          message: 'Too many failed attempts. Try again later.',
          code: 'OTP_LOCKED',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async sendCode(formId: string, fieldId: string, email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: { fields: true },
    });

    if (!form || form.status !== 'PUBLISHED') {
      throw new NotFoundException('Form not found');
    }

    const field = form.fields.find((f) => f.id === fieldId);
    if (!field || field.type !== 'EMAIL') {
      throw new BadRequestException('Invalid email field');
    }

    await this.assertNotLocked(formId, normalizedEmail);

    const resendBlocked = await this.redis.get(
      this.resendKey(formId, normalizedEmail),
    );
    if (resendBlocked === '1') {
      throw new HttpException(
        {
          message: 'Please wait before requesting another code',
          code: 'OTP_RESEND_COOLDOWN',
          retryAfterSeconds: FORMS_OTP_RESEND_COOLDOWN_SECONDS,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = String(randomInt(100000, 999999));
    const salt = `${formId}:${normalizedEmail}`;
    const hash = hashOtp(code, salt);
    await this.redis.set(
      this.otpKey(formId, normalizedEmail),
      hash,
      FORMS_OTP_TTL_SECONDS,
    );
    await this.redis.set(
      this.resendKey(formId, normalizedEmail),
      '1',
      FORMS_OTP_RESEND_COOLDOWN_SECONDS,
    );
    await this.redis.del(this.attemptKey(formId, normalizedEmail));

    await this.emailService.sendEmail({
      to: normalizedEmail,
      subject: `Verification code — ${form.title}`,
      html: `<p>Your verification code is: <strong>${code}</strong></p><p>Valid for 10 minutes.</p>`,
    });

    return { ok: true, expiresIn: FORMS_OTP_TTL_SECONDS };
  }

  async verifyCode(formId: string, email: string, code: string) {
    const normalizedEmail = email.trim().toLowerCase();
    await this.assertNotLocked(formId, normalizedEmail);

    const storedHash = await this.redis.get<string>(
      this.otpKey(formId, normalizedEmail),
    );
    const salt = `${formId}:${normalizedEmail}`;

    if (
      !storedHash ||
      typeof storedHash !== 'string' ||
      !compareOtp(code, storedHash, salt)
    ) {
      const attempts = await this.redis.incr(
        this.attemptKey(formId, normalizedEmail),
      );
      if (attempts === 1) {
        await this.redis.expire(
          this.attemptKey(formId, normalizedEmail),
          FORMS_OTP_TTL_SECONDS,
        );
      }
      if (attempts >= FORMS_OTP_MAX_ATTEMPTS) {
        await this.redis.set(
          this.lockKey(formId, normalizedEmail),
          '1',
          FORMS_OTP_LOCK_SECONDS,
        );
        await this.redis.del(this.otpKey(formId, normalizedEmail));
      }
      throw new BadRequestException({
        message: 'Invalid or expired verification code',
        code: 'OTP_INVALID',
      });
    }

    await this.redis.del(this.otpKey(formId, normalizedEmail));
    await this.redis.del(this.attemptKey(formId, normalizedEmail));
    await this.redis.set(
      this.verifiedKey(formId, normalizedEmail),
      '1',
      FORMS_OTP_VERIFIED_TTL_SECONDS,
    );

    return { ok: true, verified: true };
  }

  async isEmailVerified(formId: string, email: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    const v = await this.redis.get(this.verifiedKey(formId, normalizedEmail));
    return v === '1';
  }

  async clearVerified(formId: string, email: string): Promise<void> {
    await this.redis.del(this.verifiedKey(formId, email.trim().toLowerCase()));
  }
}
