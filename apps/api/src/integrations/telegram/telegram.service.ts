import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface TelegramMessage {
  chat_id: string | number;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  reply_markup?: any;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly botName: string;
  private readonly webhookUrl: string;
  private readonly telegramApiUrl = 'https://api.telegram.org';
  private readonly httpClient: AxiosInstance | null = null;
  private readonly isEnabled: boolean;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get('TELEGRAM_BOT_TOKEN', '');
    this.botName = this.configService.get('TELEGRAM_BOT_NAME', 'RuknyBot');
    this.webhookUrl = this.configService.get('TELEGRAM_WEBHOOK_URL', '');

    // تفعيل الخدمة فقط إذا كان التوكن موجوداً
    this.isEnabled = !!this.botToken;

    if (this.isEnabled) {
      this.httpClient = axios.create({
        baseURL: `${this.telegramApiUrl}/bot${this.botToken}`,
        timeout: 10000,
      });
      this.logger.log('✅ Telegram service enabled');
    } else {
      this.logger.warn(
        '⚠️ Telegram service disabled - TELEGRAM_BOT_TOKEN not configured',
      );
    }
  }

  /**
   * 🔐 F2-05 — Verify a Telegram webhook request.
   *
   * Telegram does NOT HMAC the payload. When you register the webhook with a
   * `secret_token`, Telegram echoes that exact value back in the
   * `X-Telegram-Bot-Api-Secret-Token` header on every request. We compare the
   * header against `TELEGRAM_WEBHOOK_SECRET` in constant time.
   *
   * Fails CLOSED: if no secret is configured, or the header is missing/mismatched,
   * the request is rejected.
   *
   * @param headerToken value of the `X-Telegram-Bot-Api-Secret-Token` header
   */
  verifyWebhookSecret(headerToken: string | undefined): boolean {
    const expected = this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET');

    if (!expected) {
      this.logger.error(
        'TELEGRAM_WEBHOOK_SECRET is not set — rejecting Telegram webhook (fail closed).',
      );
      return false;
    }

    if (!headerToken) {
      this.logger.warn('Telegram webhook rejected: missing secret-token header');
      return false;
    }

    const provided = Buffer.from(headerToken, 'utf8');
    const expectedBuf = Buffer.from(expected, 'utf8');

    if (
      provided.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(provided, expectedBuf)
    ) {
      this.logger.warn('Telegram webhook rejected: secret-token mismatch');
      return false;
    }

    return true;
  }

  /**
   * 📱 إرسال رسالة إلى المستخدم
   */
  async sendMessage(message: TelegramMessage): Promise<any> {
    if (!this.isEnabled || !this.httpClient) {
      this.logger.debug('Telegram disabled, skipping sendMessage');
      return null;
    }

    try {
      const response = await this.httpClient.post('/sendMessage', message);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send message to ${message.chat_id}`, error);
      throw error;
    }
  }

  /**
   * 🎨 إرسال رسالة مع أزرار (inline buttons)
   */
  async sendMessageWithButtons(
    chatId: string | number,
    text: string,
    buttons: Array<Array<{ text: string; callback_data: string }>>,
    parseMode: 'HTML' | 'Markdown' = 'HTML',
  ): Promise<any> {
    return this.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  /**
   * 📸 إرسال صورة مع تعليق
   */
  async sendPhoto(
    chatId: string | number,
    photoUrl: string,
    caption: string,
  ): Promise<any> {
    if (!this.isEnabled || !this.httpClient) {
      this.logger.debug('Telegram disabled, skipping sendPhoto');
      return null;
    }

    try {
      const response = await this.httpClient.post('/sendPhoto', {
        chat_id: chatId,
        photo: photoUrl,
        caption,
        parse_mode: 'HTML',
      });
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to send photo to ${chatId}`, error);
      throw error;
    }
  }

  /**
   * 🔔 إرسال إشعار (بدون صوت)
   */
  async sendNotification(chatId: string | number, text: string): Promise<any> {
    return this.sendMessage({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    });
  }

  /**
   * ⚠️ إرسال تنبيه أمني
   */
  async sendSecurityAlert(
    chatId: string | number,
    title: string,
    details: {
      location?: string;
      device?: string;
      time?: string;
      ip?: string;
      reason?: string;
    },
  ): Promise<any> {
    const message = `
<b>⚠️ تنبيه أمني</b>
<b>${title}</b>

${details.location ? `📍 <b>الموقع:</b> ${details.location}` : ''}
${details.device ? `📱 <b>الجهاز:</b> ${details.device}` : ''}
${details.ip ? `🌐 <b>الـ IP:</b> ${details.ip}` : ''}
${details.time ? `🕐 <b>الوقت:</b> ${details.time}` : ''}
${details.reason ? `<b>السبب:</b> ${details.reason}` : ''}

<i>إذا لم تقم بهذا الإجراء، غيّر كلمة المرور فوراً</i>
    `.trim();

    return this.sendMessage({
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    });
  }

  /**
   * 🔗 إرسال رابط التحقق
   */
  async sendVerificationLink(
    chatId: string | number,
    sessionId: string,
  ): Promise<any> {
    const confirmationCode = sessionId.slice(-6).toUpperCase();

    const message = `
<b>🔐 ربط حساب Rukny</b>

أنت طلبت ربط حسابك مع Telegram.

<b>كود التحقق:</b> <code>${confirmationCode}</code>

<i>أو استخدم الزر أدناه للتأكيد</i>
    `.trim();

    return this.sendMessageWithButtons(chatId, message, [
      [
        { text: '✅ تأكيد', callback_data: `verify_${sessionId}` },
        { text: '❌ إلغاء', callback_data: `cancel_${sessionId}` },
      ],
    ]);
  }

  /**
   * 🌐 تعيين Webhook (يتم عند بدء التطبيق)
   */
  async setWebhook(): Promise<any> {
    try {
      const response = await this.httpClient.post('/setWebhook', {
        url: this.webhookUrl,
        allowed_updates: [
          'message',
          'callback_query',
          'my_chat_member',
          'chat_member',
        ],
      });

      this.logger.log('Webhook set successfully', response.data);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to set webhook', error);
      throw error;
    }
  }

  /**
   * 🗑️ حذف Webhook
   */
  async deleteWebhook(): Promise<any> {
    try {
      const response = await this.httpClient.post('/deleteWebhook');
      this.logger.log('Webhook deleted successfully');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to delete webhook', error);
      throw error;
    }
  }

  /**
   * ℹ️ الحصول على معلومات الـ Bot
   */
  async getMe(): Promise<any> {
    try {
      const response = await this.httpClient.get('/getMe');
      return response.data;
    } catch (error) {
      this.logger.error('Failed to get bot info', error);
      throw error;
    }
  }

  /**
   * ✏️ تعديل رسالة
   */
  async editMessage(
    chatId: string | number,
    messageId: number,
    text: string,
  ): Promise<any> {
    try {
      const response = await this.httpClient.post('/editMessageText', {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to edit message', error);
      throw error;
    }
  }

  /**
   * 📤 الرد على Callback Query
   */
  async answerCallbackQuery(
    callbackQueryId: string,
    text: string,
    showAlert: boolean = false,
  ): Promise<any> {
    try {
      const response = await this.httpClient.post('/answerCallbackQuery', {
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to answer callback query', error);
      throw error;
    }
  }
}
