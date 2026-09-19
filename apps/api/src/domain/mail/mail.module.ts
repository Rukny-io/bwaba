import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { RedisModule } from '../../core/cache/redis.module';
import { WhatsAppBusinessModule } from '../../integrations/whatsapp-business/whatsapp-business.module';
import { StorageModule } from '../storage/storage.module';
import { SupportTicketsModule } from '../support-tickets/support-tickets.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SecurityModule } from '../../infrastructure/security/security.module';
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
import { MailAppAccessService } from './mail-app-access.service';
import { MailMembersService } from './mail-members.service';
import { MailMembersController } from './mail-members.controller';
import { MailSesService } from './mail-ses.service';
import { MailInboundService } from './mail-inbound.service';
import { MailRealtimeService } from './mail-realtime.service';
import { MailSesWebhookController } from './mail-ses-webhook.controller';
import { MailPublicController } from './mail-public.controller';
import { MailBimiService } from './mail-bimi.service';
import { MailDomainVerificationController } from './mail-domain-verification.controller';
import { MailDomainVerificationService } from './mail-domain-verification.service';
import { MailFeatureFlags } from './mail-feature-flags';
import { MailBodyCryptoService } from './crypto/mail-body-crypto.service';
import { MailBodyEncryptionPolicy } from './crypto/mail-body-encryption.policy';
import { MailKmsClient } from './crypto/mail-kms.client';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    ConfigModule,
    WhatsAppBusinessModule,
    StorageModule,
    SupportTicketsModule,
    NotificationsModule,
    SecurityModule,
  ],
  controllers: [
    MailSubscriptionsController,
    MailAppsController,
    MailMembersController,
    MailMailboxesController,
    MailMessagesController,
    MailLogsController,
    MailCatchAllController,
    MailAutoReplyController,
    MailAliasController,
    MailForwarderController,
    MailSesWebhookController,
    MailPublicController,
    MailDomainVerificationController,
  ],
  providers: [
    MailSubscriptionsService,
    MailAppsService,
    MailAppAccessService,
    MailMembersService,
    MailMailboxesService,
    MailMailboxSessionService,
    MailMessagesService,
    MailCatchAllService,
    MailAutoReplyService,
    MailAliasService,
    MailForwarderService,
    MailSesService,
    MailInboundService,
    MailBimiService,
    MailFeatureFlags,
    MailKmsClient,
    MailBodyCryptoService,
    MailBodyEncryptionPolicy,
    MailRealtimeService,
    MailDomainVerificationService,
  ],
  exports: [
    MailSubscriptionsService,
    MailAppsService,
    MailAppAccessService,
    MailMembersService,
    MailMailboxesService,
    MailMailboxSessionService,
    MailMessagesService,
    MailCatchAllService,
    MailAutoReplyService,
    MailAliasService,
    MailForwarderService,
    MailSesService,
    MailInboundService,
    MailBimiService,
    MailFeatureFlags,
    MailKmsClient,
    MailBodyCryptoService,
    MailBodyEncryptionPolicy,
    MailRealtimeService,
    MailDomainVerificationService,
  ],
})
export class MailModule {}
