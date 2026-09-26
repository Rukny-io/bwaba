import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { RedisModule } from '../../core/cache/redis.module';
import { AuthModule } from '../auth/auth.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { QasehPaymentModule } from '../../integrations/qaseh-payment/qaseh-payment.module';
import { CheckoutSessionGuard } from '../../core/common/guards/auth/checkout-session.guard';

// API Keys
import { ApiKeysController } from './api-keys/api-keys.controller';
import { ApiKeysService } from './api-keys/api-keys.service';
import { ApiKeyAuthGuard } from './api-keys/guards/api-key-auth.guard';
import { JwtOrApiKeyGuard } from './api-keys/guards/jwt-or-api-key.guard';

// Subscriptions
import { DevSubscriptionsController } from './subscriptions/dev-subscriptions.controller';
import { DevSubscriptionsService } from './subscriptions/dev-subscriptions.service';

// Wallet
import { WalletController } from './wallet/wallet.controller';
import { WalletService } from './wallet/wallet.service';

// Checkout
import { DeveloperCheckoutController } from './checkout/developer-checkout.controller';
import { DeveloperCheckoutService } from './checkout/developer-checkout.service';

// Webhooks
import { DevWebhooksController } from './webhooks/dev-webhooks.controller';
import { DevWebhooksService } from './webhooks/dev-webhooks.service';
import { WebhookDeliveryService } from './webhooks/webhook-delivery.service';
import { WebhookDeliveryProcessor } from './webhooks/webhook-delivery.processor';

// Contacts
import { ContactsController } from './contacts/contacts.controller';
import { ContactsService } from './contacts/contacts.service';

// Usage
import { UsageController } from './usage/usage.controller';
import { UsageService } from './usage/usage.service';

// Shared
import { DeveloperRateLimitService } from './shared/developer-rate-limit.service';

// Apps
import { AppsController } from './apps/apps.controller';
import { AppsService } from './apps/apps.service';
import { AppsUploadService } from './apps/apps-upload.service';
import { AppAnalyticsService } from './apps/app-analytics.service';

// Forms integration
import { DevFormsController } from './forms/dev-forms.controller';
import { DevFormsService } from './forms/dev-forms.service';
import { FormsModule } from '../forms/forms.module';

// Products
import { DevProductsController } from './products/dev-products.controller';
import { DevProductsService } from './products/dev-products.service';
import { EmailApiModule } from '../email-api/email-api.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    ConfigModule,
    forwardRef(() => AuthModule),
    WorkspaceModule,
    forwardRef(() => FormsModule),
    forwardRef(() => QasehPaymentModule),
    forwardRef(() => EmailApiModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueueAsync({
      name: 'webhook-delivery',
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 30000,
          },
          removeOnComplete: 200,
          removeOnFail: 1000,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AppsController,
    ApiKeysController,
    DevSubscriptionsController,
    WalletController,
    DeveloperCheckoutController,
    DevWebhooksController,
    ContactsController,
    UsageController,
    DevFormsController,
    DevProductsController,
  ],
  providers: [
    CheckoutSessionGuard,
    AppsService,
    AppsUploadService,
    AppAnalyticsService,
    DevFormsService,
    DevProductsService,
    ApiKeysService,
    ApiKeyAuthGuard,
    JwtOrApiKeyGuard,
    DevSubscriptionsService,
    WalletService,
    DeveloperCheckoutService,
    DevWebhooksService,
    WebhookDeliveryService,
    WebhookDeliveryProcessor,
    ContactsService,
    UsageService,
    DeveloperRateLimitService,
  ],
  exports: [
    AppsService,
    AppAnalyticsService,
    ApiKeysService,
    ApiKeyAuthGuard,
    JwtOrApiKeyGuard,
    DevSubscriptionsService,
    WalletService,
    DeveloperCheckoutService,
    WebhookDeliveryService,
    UsageService,
    DevFormsService,
    DevProductsService,
    DeveloperRateLimitService,
  ],
})
export class DeveloperModule {}
