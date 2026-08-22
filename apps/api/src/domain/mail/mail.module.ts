import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { RedisModule } from '../../core/cache/redis.module';
import { WhatsAppBusinessModule } from '../../integrations/whatsapp-business/whatsapp-business.module';
import { StorageModule } from '../storage/storage.module';
import { MailSubscriptionsController } from './mail-subscriptions.controller';
import { MailSubscriptionsService } from './mail-subscriptions.service';
import { MailAppsController } from './mail-apps.controller';
import { MailAppsService } from './mail-apps.service';
import { MailMailboxesController } from './mail-mailboxes.controller';
import { MailMailboxesService } from './mail-mailboxes.service';
import { MailMessagesController } from './mail-messages.controller';
import { MailMessagesService } from './mail-messages.service';
import { MailSesService } from './mail-ses.service';
import { MailInboundService } from './mail-inbound.service';
import { MailRealtimeService } from './mail-realtime.service';
import { MailSesWebhookController } from './mail-ses-webhook.controller';
import { SupportTicketsModule } from '../support-tickets/support-tickets.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    ConfigModule,
    WhatsAppBusinessModule,
    StorageModule,
    SupportTicketsModule,
  ],
  controllers: [
    MailSubscriptionsController,
    MailAppsController,
    MailMailboxesController,
    MailMessagesController,
    MailSesWebhookController,
  ],
  providers: [
    MailSubscriptionsService,
    MailAppsService,
    MailMailboxesService,
    MailMessagesService,
    MailSesService,
    MailInboundService,
    MailRealtimeService,
  ],
  exports: [
    MailSubscriptionsService,
    MailAppsService,
    MailMailboxesService,
    MailMessagesService,
    MailSesService,
    MailInboundService,
    MailRealtimeService,
  ],
})
export class MailModule {}
