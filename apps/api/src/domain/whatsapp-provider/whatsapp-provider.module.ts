import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { RedisModule } from '../../core/cache/redis.module';
import { DeveloperModule } from '../developer/developer.module';

// Shared
import { MetaApiService } from './shared/meta-api.service';
import { TokenEncryptionService } from './shared/token-encryption.service';
import { QuotaService } from './shared/quota.service';
import { YCloudApiService } from './shared/ycloud-api.service';

// Accounts
import { WabaService } from './accounts/waba.service';
import { WabaController } from './accounts/waba.controller';

// Messaging
import { MessagingService } from './messaging/messaging.service';
import { MessagingController } from './messaging/messaging.controller';

// Templates
import { TemplatesService } from './templates/templates.service';
import { TemplatesController } from './templates/templates.controller';

// Phone Numbers
import { PhoneNumbersService } from './phone-numbers/phone-numbers.service';
import { PhoneNumbersController } from './phone-numbers/phone-numbers.controller';

// Meta Webhooks
import { MetaWebhookService } from './webhooks/meta-webhook.service';
import { MetaWebhookController } from './webhooks/meta-webhook.controller';

// Messaging security
import { MessagingSecurityService } from './messaging/messaging-security.service';
import { WhatsAppMessageIdempotencyService } from './messaging/whatsapp-message-idempotency.service';
import { WhatsappApiTryController } from './messaging/whatsapp-api-try.controller';
import { WhatsappApiTryService } from './messaging/whatsapp-api-try.service';
import { MediaController } from './media/media.controller';
import { MediaService } from './media/media.service';
import { ContactsApiController } from './contacts/contacts-api.controller';

@Module({
  imports: [PrismaModule, RedisModule, ConfigModule, DeveloperModule],
  controllers: [
    WabaController,
    MessagingController,
    TemplatesController,
    PhoneNumbersController,
    MetaWebhookController,
    WhatsappApiTryController,
    MediaController,
    ContactsApiController,
  ],
  providers: [
    MetaApiService,
    TokenEncryptionService,
    QuotaService,
    YCloudApiService,
    WabaService,
    MessagingService,
    MessagingSecurityService,
    WhatsAppMessageIdempotencyService,
    WhatsappApiTryService,
    TemplatesService,
    PhoneNumbersService,
    MetaWebhookService,
    MediaService,
  ],
  exports: [
    MetaApiService,
    TokenEncryptionService,
    QuotaService,
    MessagingService,
  ],
})
export class WhatsAppProviderModule {}
