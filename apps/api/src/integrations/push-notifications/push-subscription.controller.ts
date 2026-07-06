import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  UseGuards,
  Req,
  Logger,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { CurrentUser } from '../../core/common/decorators/auth/current-user.decorator';
import {
  PushSubscriptionService,
  PushSubscriptionInput,
} from './push-subscription.service';

@Controller('push-subscriptions')
export class PushSubscriptionController {
  private readonly logger = new Logger(PushSubscriptionController.name);

  constructor(private readonly pushService: PushSubscriptionService) {}

  /**
   * Public VAPID key for browser subscription (safe to expose).
   * GET /push-subscriptions/vapid-public-key
   */
  @Get('vapid-public-key')
  getVapidPublicKey() {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key || key.includes('YOUR_VAPID')) {
      return { publicKey: null };
    }
    return { publicKey: key };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async subscribe(
    @Body() subscription: PushSubscriptionInput,
    @CurrentUser('id') userId: string,
    @Req() req: { get: (name: string) => string | undefined },
  ) {
    const userAgent = req.get('user-agent');

    try {
      const result = await this.pushService.subscribeToPush(
        userId,
        subscription,
        userAgent,
      );

      return {
        success: true,
        message: 'تم الاشتراك في إشعارات المتصفح بنجاح',
        data: {
          id: result.id,
          createdAt: result.createdAt,
        },
      };
    } catch (error) {
      this.logger.error(`Subscribe error: ${error.message}`);
      throw error;
    }
  }

  @Post('unsubscribe')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async unsubscribe(@Body() body: { endpoint: string }) {
    try {
      await this.pushService.unsubscribeFromPush(body.endpoint);

      return {
        success: true,
        message: 'تم إلغاء الاشتراك من إشعارات المتصفح',
      };
    } catch (error) {
      this.logger.error(`Unsubscribe error: ${error.message}`);
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getSubscriptions(@CurrentUser('id') userId: string) {
    try {
      const subscriptions = await this.pushService.getUserSubscriptions(userId);

      return {
        success: true,
        data: subscriptions,
        total: subscriptions.length,
      };
    } catch (error) {
      this.logger.error(`Get subscriptions error: ${error.message}`);
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteSubscription(@Body() body: { endpoint: string }) {
    try {
      await this.pushService.unsubscribeFromPush(body.endpoint);

      return {
        success: true,
        message: 'تم حذف الاشتراك بنجاح',
      };
    } catch (error) {
      this.logger.error(`Delete subscription error: ${error.message}`);
      throw error;
    }
  }
}
