import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface WhatsAppBusinessResult {
  messageId: string;
  status: 'accepted' | 'failed';
}

export interface WhatsAppBusinessOtpResult {
  messageId: string;
  status: 'accepted' | 'failed';
}

export class WhatsAppBusinessError extends Error {
  constructor(
    message: string,
    readonly metaCode?: number,
    readonly userMessage?: string,
  ) {
    super(message);
    this.name = 'WhatsAppBusinessError';
  }
}

/**
 * 📱 خدمة WhatsApp Business API (Meta Cloud API)
 *
 * إرسال رسائل Authentication OTP عبر WhatsApp Business Platform
 * - يستخدم Meta Graph API (قابل للتعديل عبر WHATSAPP_GRAPH_API_VERSION)
 * - يدعم Authentication Templates
 * - يدعم One-Time Password buttons
 */
@Injectable()
export class WhatsAppBusinessService implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppBusinessService.name);
  private readonly client: AxiosInstance;
  private readonly phoneNumberId: string;
  private readonly businessAccountId: string;
  private readonly authTemplateName: string;
  private readonly authTemplateLanguage: string;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    const accessToken = this.configService.get<string>(
      'WHATSAPP_BUSINESS_TOKEN',
      '',
    );
    this.phoneNumberId = this.configService.get<string>(
      'WHATSAPP_PHONE_NUMBER_ID',
      '',
    );
    this.businessAccountId = this.configService.get<string>(
      'WHATSAPP_BUSINESS_ACCOUNT_ID',
      '',
    );
    this.authTemplateName = this.configService.get<string>(
      'WHATSAPP_AUTH_TEMPLATE_NAME',
      'auth_otp',
    );
    this.authTemplateLanguage = this.configService.get<string>(
      'WHATSAPP_AUTH_TEMPLATE_LANGUAGE',
      'ar',
    );

    this.enabled = !!(accessToken && this.phoneNumberId);

    if (!this.enabled) {
      this.logger.warn(
        '⚠️ WhatsApp Business service disabled - Missing WHATSAPP_BUSINESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID',
      );
    } else {
      this.logger.log('✅ WhatsApp Business service enabled');
    }

    const apiVersion =
      this.configService.get<string>('WHATSAPP_GRAPH_API_VERSION') ||
      this.configService.get<string>('WHATSAPP_API_VERSION') ||
      'v25.0';

    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${apiVersion}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) return;
    const status = await this.checkStatus();
    if (!status.connected) {
      this.logger.error(
        '❌ WhatsApp Business token/phone ID invalid — OTP sends will fail (Meta auth error). Regenerate WHATSAPP_BUSINESS_TOKEN with whatsapp_business_messaging on the WABA that owns WHATSAPP_PHONE_NUMBER_ID.',
      );
    } else {
      this.logger.log(
        `✅ WhatsApp Business connected: ${status.phoneNumber || this.phoneNumberId} (template=${this.authTemplateName}/${this.authTemplateLanguage})`,
      );
    }
  }

  private mapMetaError(
    code: number | undefined,
    rawMessage: string,
    type?: string,
  ): string {
    const msg = (rawMessage || '').toLowerCase();
    const isAuth =
      type === 'OAuthException' ||
      msg.includes('authorization') ||
      msg.includes('access token') ||
      msg.includes('permission') ||
      code === 190;

    if (isAuth || code === 190) {
      return 'توكن WhatsApp غير مصرّح لهذا الرقم أو منتهٍ. أنشئ System User Token بصلاحيات whatsapp_business_messaging و whatsapp_business_management على نفس الـ WABA المرتبط بـ WHATSAPP_PHONE_NUMBER_ID، ثم حدّث WHATSAPP_BUSINESS_TOKEN.';
    }

    switch (code) {
      case 100:
        return 'معامل غير صالح من Meta (غالباً phone number id أو اسم/لغة القالب). تحقق من WHATSAPP_PHONE_NUMBER_ID و WHATSAPP_AUTH_TEMPLATE_NAME و WHATSAPP_AUTH_TEMPLATE_LANGUAGE.';
      case 132000:
      case 132001:
      case 132005:
      case 132007:
      case 132012:
      case 132015:
      case 132016:
        return 'القالب غير موجود أو غير معتمد أو لغة القالب خاطئة. تحقق من WHATSAPP_AUTH_TEMPLATE_NAME و WHATSAPP_AUTH_TEMPLATE_LANGUAGE في WhatsApp Manager.';
      case 131026:
        return 'تعذّر التسليم إلى هذا الرقم. تأكد من صحة الرقم مع رمز الدولة.';
      default: {
        const cleaned = (rawMessage || '').trim();
        if (
          !cleaned ||
          /^unknown error$/i.test(cleaned) ||
          /^request failed with status code \d+$/i.test(cleaned)
        ) {
          return 'فشل الاتصال بـ Meta WhatsApp. تحقق من التوكن والقالب واتصال الشبكة، أو فعّل WHATSAPP_OTP_DEV_BYPASS للتطوير المحلي.';
        }
        return cleaned;
      }
    }
  }

  /**
   * 📤 إرسال رمز OTP عبر Authentication Template
   */
  async sendOtp(
    phoneNumber: string,
    otp: string,
  ): Promise<WhatsAppBusinessOtpResult> {
    if (!this.enabled) {
      throw new Error('WhatsApp Business service is not configured');
    }

    const formatted = this.formatPhoneNumber(phoneNumber);

    try {
      this.logger.log(
        `📤 Sending WhatsApp Business OTP to ${this.maskPhone(formatted)}`,
      );

      const response = await this.client.post(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formatted,
          type: 'template',
          template: {
            name: this.authTemplateName,
            language: { code: this.authTemplateLanguage },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: otp,
                  },
                ],
              },
              {
                type: 'button',
                sub_type: 'url',
                index: '0',
                parameters: [
                  {
                    type: 'text',
                    text: otp,
                  },
                ],
              },
            ],
          },
        },
      );

      const messageId =
        response.data?.messages?.[0]?.id || response.data?.message_id || '';

      this.logger.log(`✅ WhatsApp Business OTP sent: ${messageId}`);

      return { messageId, status: 'accepted' };
    } catch (error) {
      const axiosError = error as {
        message?: string;
        code?: string;
        response?: { status?: number; data?: unknown };
      };
      const errorData = (
        axiosError.response?.data as { error?: Record<string, unknown> } | undefined
      )?.error;
      const errorMessage =
        (typeof errorData?.message === 'string' && errorData.message) ||
        (typeof (axiosError.response?.data as { message?: string } | undefined)
          ?.message === 'string' &&
          (axiosError.response?.data as { message?: string }).message) ||
        axiosError.message ||
        'Unknown error';
      const errorCode =
        (typeof errorData?.code === 'number' && errorData.code) ||
        axiosError.response?.status;
      const errorType =
        typeof errorData?.type === 'string' ? errorData.type : undefined;
      const errorSubcode = errorData?.error_subcode;
      const errorUserMsg =
        (typeof errorData?.error_user_msg === 'string' &&
          errorData.error_user_msg) ||
        (typeof errorData?.error_user_title === 'string' &&
          errorData.error_user_title) ||
        undefined;

      this.logger.error(
        `❌ WhatsApp Business OTP failed: ${errorMessage} (http: ${axiosError.response?.status ?? 'n/a'}, axios: ${axiosError.code || 'n/a'}, code: ${errorCode ?? 'n/a'}, type: ${errorType || 'n/a'}, subcode: ${errorSubcode || 'n/a'}${errorUserMsg ? `, user: ${errorUserMsg}` : ''})`,
      );
      if (axiosError.response?.data) {
        this.logger.error(
          `❌ WhatsApp Business OTP response body: ${JSON.stringify(axiosError.response.data).slice(0, 800)}`,
        );
      }

      const userMessage = this.mapMetaError(
        typeof errorCode === 'number' ? errorCode : undefined,
        errorMessage,
        errorType,
      );

      throw new WhatsAppBusinessError(
        `فشل إرسال رمز التحقق عبر واتساب: ${errorMessage}`,
        typeof errorCode === 'number' ? errorCode : undefined,
        userMessage,
      );
    }
  }

  /**
   * 📤 إرسال رسالة نصية مباشرة (بدون Template)
   * ⚠️ يعمل فقط مع الأرقام التي راسلتك خلال 24 ساعة
   */
  async sendTextMessage(
    phoneNumber: string,
    text: string,
  ): Promise<WhatsAppBusinessResult> {
    if (!this.enabled) {
      throw new Error('WhatsApp Business service is not configured');
    }

    const formatted = this.formatPhoneNumber(phoneNumber);

    try {
      const response = await this.client.post(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formatted,
          type: 'text',
          text: { body: text },
        },
      );

      const messageId = response.data?.messages?.[0]?.id || '';

      return { messageId, status: 'accepted' };
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Unknown error';

      this.logger.error(
        `❌ WhatsApp Business text message failed: ${errorMessage}`,
      );

      throw new Error(`فشل إرسال الرسالة: ${errorMessage}`);
    }
  }

  /**
   * 🔍 فحص حالة الخدمة
   */
  async checkStatus(): Promise<{
    enabled: boolean;
    connected: boolean;
    phoneNumber?: string;
  }> {
    if (!this.enabled) {
      return { enabled: false, connected: false };
    }

    try {
      const response = await this.client.get(
        `/${this.phoneNumberId}?fields=verified_name,display_phone_number,quality_rating`,
      );

      return {
        enabled: true,
        connected: true,
        phoneNumber: response.data?.display_phone_number,
      };
    } catch {
      return { enabled: true, connected: false };
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove spaces, dashes, and + prefix (Meta API expects without +)
    let formatted = phone.replace(/[\s\-()]/g, '');
    if (formatted.startsWith('+')) {
      formatted = formatted.substring(1);
    }
    return formatted;
  }

  private maskPhone(phone: string): string {
    if (phone.length < 8) return '***';
    return phone.slice(0, 5) + '***' + phone.slice(-3);
  }
}
