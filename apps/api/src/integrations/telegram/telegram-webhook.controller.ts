import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBody } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { TelegramSessionService } from './telegram-session.service';
import { PrismaService } from '../../core/database/prisma/prisma.service';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat_instance: string;
    data?: string;
    message?: {
      message_id: number;
      chat: { id: number };
    };
  };
}

@ApiTags('telegram')
@Controller('telegram')
export class TelegramWebhookController {
  private readonly logger = new Logger(TelegramWebhookController.name);

  constructor(
    private telegramService: TelegramService,
    private telegramSessionService: TelegramSessionService,
    private prisma: PrismaService,
  ) {}

  /**
   * 🎣 استقبال Webhook من Telegram
   */
  @Post('webhook')
  @ApiBody({ type: Object })
  async handleWebhook(
    @Body() update: TelegramUpdate,
    @Headers('x-telegram-bot-api-secret-token') secretToken: string,
  ) {
    try {
      // 🔒 F2-05: Telegram echoes the configured secret_token in this header.
      // Constant-time compare against TELEGRAM_WEBHOOK_SECRET (fail closed).
      if (!this.telegramService.verifyWebhookSecret(secretToken)) {
        this.logger.warn(
          `Invalid webhook secret token for update ${update.update_id}`,
        );
        throw new ForbiddenException('Invalid signature');
      }

      // 📝 حفظ الـ log
      await this.prisma.telegramWebhookLog.create({
        data: {
          updateId: update.update_id.toString(),
          eventType: update.message ? 'message' : 'callback_query',
          payload: update as any,
          verified: true,
        },
      });

      // 🔄 معالجة الـ update
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }

      return { ok: true };
    } catch (error) {
      this.logger.error('Error handling webhook', error);

      // 📝 حفظ الخطأ
      if (update.update_id) {
        await this.prisma.telegramWebhookLog
          .upsert({
            where: { updateId: update.update_id.toString() },
            update: {
              status: 'failed',
              error: error.message,
            },
            create: {
              updateId: update.update_id.toString(),
              eventType: 'error',
              payload: { error: error.message } as any,
              verified: false,
              status: 'failed',
              error: error.message,
            },
          })
          .catch(() => {});
      }

      return { ok: true }; // Telegram يجب أن نرجع 200 OK دائماً
    }
  }

  /**
   * 💬 معالجة الرسائل
   */
  private async handleMessage(message: TelegramUpdate['message']) {
    const { text, from, chat } = message;

    this.logger.log(
      `Message from ${from.username || from.first_name}: ${text}`,
    );

    // التحقق من الأمر /start
    if (text?.startsWith('/start')) {
      await this.handleStartCommand(text, from, chat);
    }
  }

  /**
   * 🚀 معالجة أمر /start
   */
  private async handleStartCommand(
    text: string,
    from: TelegramUpdate['message']['from'],
    chat: TelegramUpdate['message']['chat'],
  ) {
    const sessionId = text.replace('/start ', '').trim();

    try {
      // 🔍 البحث عن الجلسة
      const session =
        await this.telegramSessionService.getValidSession(sessionId);

      // ✅ تأكيد الجلسة
      const { user } = await this.telegramSessionService.verifySession(
        sessionId,
        chat.id,
        from.first_name,
        from.last_name,
        from.username,
      );

      // 📤 إرسال رسالة تأكيد
      await this.telegramService.sendMessage({
        chat_id: chat.id,
        text: `<b>✅ تم ربط الحساب بنجاح!</b>\n\nالبريد: <code>${user.email}</code>\n\nستتلقى الآن الإشعارات على هذا الحساب.`,
        parse_mode: 'HTML',
      });

      this.logger.log(`Verified user ${user.id} with Telegram chat ${chat.id}`);
    } catch (error) {
      // ❌ رسالة خطأ
      await this.telegramService.sendMessage({
        chat_id: chat.id,
        text: `<b>❌ خطأ في الربط</b>\n\n${error.message}`,
        parse_mode: 'HTML',
      });

      this.logger.error(`Error verifying session ${sessionId}`, error);
    }
  }

  /**
   * 🔘 معالجة الأزرار (Callback Query)
   */
  private async handleCallbackQuery(
    callbackQuery: TelegramUpdate['callback_query'],
  ) {
    const { id: callbackId, data, from, message } = callbackQuery;

    try {
      if (data?.startsWith('verify_')) {
        const sessionId = data.replace('verify_', '');

        // ✅ تأكيد الجلسة
        const { user } = await this.telegramSessionService.verifySession(
          sessionId,
          message.chat.id,
          from.first_name,
          undefined,
          from.username,
        );

        // 📤 تحديث الرسالة
        await this.telegramService.editMessage(
          message.chat.id,
          message.message_id,
          `<b>✅ تم ربط الحساب بنجاح!</b>\n\nالبريد: <code>${user.email}</code>`,
        );

        // 📢 الرد على الـ callback
        await this.telegramService.answerCallbackQuery(
          callbackId,
          '✅ تم الربط بنجاح!',
        );
      } else if (data?.startsWith('cancel_')) {
        const sessionId = data.replace('cancel_', '');

        // 🚫 إلغاء الجلسة
        await this.telegramSessionService.cancelSession(sessionId);

        // 📤 تحديث الرسالة
        await this.telegramService.editMessage(
          message.chat.id,
          message.message_id,
          '<b>❌ تم إلغاء الربط</b>',
        );

        // 📢 الرد على الـ callback
        await this.telegramService.answerCallbackQuery(
          callbackId,
          'تم الإلغاء',
        );
      }
    } catch (error) {
      this.logger.error('Error handling callback query', error);

      await this.telegramService.answerCallbackQuery(
        callbackId,
        `❌ حدث خطأ: ${error.message}`,
        true,
      );
    }
  }
}
