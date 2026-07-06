import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { RedisService } from '../../../core/cache/redis.service';
import { WhatsappService } from '../../../integrations/whatsapp/whatsapp.service';
import {
  WhatsAppBusinessError,
  WhatsAppBusinessService,
} from '../../../integrations/whatsapp-business/whatsapp-business.service';
import { randomInt } from 'crypto';
import { hashOtp, compareOtp } from '../utils/form-email-otp.util';
import {
  FORMS_OTP_LOCK_SECONDS,
  FORMS_OTP_MAX_ATTEMPTS,
  FORMS_OTP_RESEND_COOLDOWN_SECONDS,
  FORMS_OTP_TTL_SECONDS,
  FORMS_OTP_VERIFIED_TTL_SECONDS,
} from '../forms.constants';
import { normalizePhoneNumber } from '../utils/form-phone-verification-check.util';

@Injectable()
export class FormsPhoneVerificationService {
  private readonly logger = new Logger(FormsPhoneVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly whatsappBusiness: WhatsAppBusinessService,
    private readonly whatsapp: WhatsappService,
  ) {}

  private otpKey(formId: string, phone: string) {
    return `form:phone-verify:${formId}:${phone}`;
  }

  private verifiedKey(formId: string, phone: string) {
    return `form:phone-verified:${formId}:${phone}`;
  }

  private attemptKey(formId: string, phone: string) {
    return `form:phone-otp:attempts:${formId}:${phone}`;
  }

  private lockKey(formId: string, phone: string) {
    return `form:phone-otp:lock:${formId}:${phone}`;
  }

  private resendKey(formId: string, phone: string) {
    return `form:phone-otp:resend:${formId}:${phone}`;
  }

  private async assertNotLocked(formId: string, phone: string): Promise<void> {
    const locked = await this.redis.get(this.lockKey(formId, phone));
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

  async sendCode(formId: string, fieldId: string, phone: string) {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone || normalizedPhone.length < 8) {
      throw new BadRequestException('Invalid phone number');
    }

    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: { fields: true },
    });

    if (!form || form.status !== 'PUBLISHED') {
      throw new NotFoundException('Form not found');
    }

    const field = form.fields.find((f) => f.id === fieldId);
    if (!field || field.type !== 'PHONE') {
      throw new BadRequestException('Invalid phone field');
    }

    await this.assertNotLocked(formId, normalizedPhone);

    const resendBlocked = await this.redis.get(
      this.resendKey(formId, normalizedPhone),
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
    const salt = `${formId}:${normalizedPhone}`;
    const hash = hashOtp(code, salt);
    await this.redis.set(
      this.otpKey(formId, normalizedPhone),
      hash,
      FORMS_OTP_TTL_SECONDS,
    );
    await this.redis.set(
      this.resendKey(formId, normalizedPhone),
      '1',
      FORMS_OTP_RESEND_COOLDOWN_SECONDS,
    );
    await this.redis.del(this.attemptKey(formId, normalizedPhone));

    const sendError = await this.sendWhatsAppOtp(normalizedPhone, code);
    if (sendError) {
      await this.redis.del(this.otpKey(formId, normalizedPhone));
      await this.redis.del(this.resendKey(formId, normalizedPhone));
      throw new BadRequestException({
        message: sendError,
        code: 'WHATSAPP_SEND_FAILED',
      });
    }

    return { ok: true, expiresIn: FORMS_OTP_TTL_SECONDS };
  }

  /**
   * Prefer Meta WhatsApp Business OTP (same as checkout/profiles), then TechnoPlus Personal API.
   * Returns an error message when all providers fail, otherwise null.
   */
  private async sendWhatsAppOtp(
    phone: string,
    code: string,
  ): Promise<string | null> {
    if (this.whatsappBusiness.isEnabled()) {
      try {
        await this.whatsappBusiness.sendOtp(phone, code);
        return null;
      } catch (error) {
        const userMessage =
          error instanceof WhatsAppBusinessError
            ? error.userMessage
            : undefined;
        this.logger.warn(
          `WhatsApp Business OTP failed for forms, trying Personal API: ${(error as Error).message}`,
        );
        if (!this.whatsapp.isEnabled()) {
          return (
            userMessage ||
            'فشل إرسال رمز التحقق عبر واتساب. حاول مرة أخرى لاحقاً.'
          );
        }
      }
    }

    if (!this.whatsapp.isEnabled()) {
      return 'خدمة واتساب غير متاحة حالياً.';
    }

    const result = await this.whatsapp.sendOtpMessage(phone, code);
    if (!result.success) {
      return (
        result.error ||
        'فشل إرسال رمز التحقق عبر واتساب. حاول مرة أخرى لاحقاً.'
      );
    }

    return null;
  }

  async verifyCode(formId: string, phone: string, code: string) {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) {
      throw new BadRequestException('Invalid phone number');
    }

    await this.assertNotLocked(formId, normalizedPhone);

    const storedHash = await this.redis.get<string>(
      this.otpKey(formId, normalizedPhone),
    );
    const salt = `${formId}:${normalizedPhone}`;

    if (
      !storedHash ||
      typeof storedHash !== 'string' ||
      !compareOtp(code, storedHash, salt)
    ) {
      const attempts = await this.redis.incr(
        this.attemptKey(formId, normalizedPhone),
      );
      if (attempts === 1) {
        await this.redis.expire(
          this.attemptKey(formId, normalizedPhone),
          FORMS_OTP_TTL_SECONDS,
        );
      }
      if (attempts >= FORMS_OTP_MAX_ATTEMPTS) {
        await this.redis.set(
          this.lockKey(formId, normalizedPhone),
          '1',
          FORMS_OTP_LOCK_SECONDS,
        );
        await this.redis.del(this.otpKey(formId, normalizedPhone));
      }
      throw new BadRequestException({
        message: 'Invalid or expired verification code',
        code: 'OTP_INVALID',
      });
    }

    await this.redis.del(this.otpKey(formId, normalizedPhone));
    await this.redis.del(this.attemptKey(formId, normalizedPhone));
    await this.redis.set(
      this.verifiedKey(formId, normalizedPhone),
      '1',
      FORMS_OTP_VERIFIED_TTL_SECONDS,
    );

    return { ok: true, verified: true };
  }

  async isPhoneVerified(formId: string, phone: string): Promise<boolean> {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) return false;
    const v = await this.redis.get(this.verifiedKey(formId, normalizedPhone));
    return v === '1';
  }

  async clearVerified(formId: string, phone: string): Promise<void> {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) return;
    await this.redis.del(this.verifiedKey(formId, normalizedPhone));
  }
}
