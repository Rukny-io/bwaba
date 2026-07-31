import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { RedisModule } from '../../core/cache/redis.module';
import { AuthModule } from '../auth/auth.module';
import { WorkspaceModule } from '../workspace/workspace.module';

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

// Apps
import { AppsController } from './apps/apps.controller';
import { AppsService } from './apps/apps.service';
import { AppsUploadService } from './apps/apps-upload.service';

// Forms integration
import { DevFormsController } from './forms/dev-forms.controller';
import { DevFormsService } from './forms/dev-forms.service';
import { FormsModule } from '../forms/forms.module';

// Products
import { DevProductsController } from './products/dev-products.controller';
import { DevProductsService } from './products/dev-products.service';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AuthModule,
    WorkspaceModule,
    forwardRef(() => FormsModule),
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
    DevWebhooksController,
    ContactsController,
    UsageController,
    DevFormsController,
    DevProductsController,
  ],
  providers: [
    AppsService,
    AppsUploadService,
    DevFormsService,
    DevProductsService,
    ApiKeysService,
    ApiKeyAuthGuard,
    JwtOrApiKeyGuard,
    DevSubscriptionsService,
    WalletService,
    DevWebhooksService,
    WebhookDeliveryService,
    WebhookDeliveryProcessor,
    ContactsService,
    UsageService,
  ],
  exports: [
    AppsService,
    ApiKeysService,
    ApiKeyAuthGuard,
    JwtOrApiKeyGuard,
    DevSubscriptionsService,
    WalletService,
    WebhookDeliveryService,
    UsageService,
    DevFormsService,
    DevProductsService,
  ],
})
export class DeveloperModule {}
