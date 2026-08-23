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
import { MailLogsController } from './mail-logs.controller';
import { MailCatchAllController } from './mail-catch-all.controller';
import { MailCatchAllService } from './mail-catch-all.service';
import { MailAutoReplyController } from './mail-auto-reply.controller';
import { MailAutoReplyService } from './mail-auto-reply.service';
import { MailAliasController } from './mail-alias.controller';
import { MailAliasService } from './mail-alias.service';
import { MailForwarderController } from './mail-forwarder.controller';
import { MailForwarderService } from './mail-forwarder.service';
import { MailMessagesService } from './mail-messages.service';
import { MailMailboxSessionService } from './mail-mailbox-session.service';
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
    MailLogsController,
    MailCatchAllController,
    MailAutoReplyController,
    MailAliasController,
    MailForwarderController,
    MailSesWebhookController,
  ],
  providers: [
    MailSubscriptionsService,
    MailAppsService,
    MailMailboxesService,
    MailMailboxSessionService,
    MailMessagesService,
    MailCatchAllService,
    MailAutoReplyService,
    MailAliasService,
    MailForwarderService,
    MailSesService,
    MailInboundService,
    MailRealtimeService,
  ],
  exports: [
    MailSubscriptionsService,
    MailAppsService,
    MailMailboxesService,
    MailMailboxSessionService,
    MailMessagesService,
    MailCatchAllService,
    MailAutoReplyService,
    MailAliasService,
    MailForwarderService,
    MailSesService,
    MailInboundService,
    MailRealtimeService,
  ],
})
export class MailModule {}
