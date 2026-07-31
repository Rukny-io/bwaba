import { Module } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';
import { SharedModule } from '../../shared/modules/shared.module';
import { RedisModule } from '../../core/cache/redis.module';
import { WhatsAppBusinessModule } from '../../integrations/whatsapp-business/whatsapp-business.module';
import { SupportTicketsModule } from '../support-tickets/support-tickets.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    SharedModule,
    RedisModule,
    WhatsAppBusinessModule,
    SupportTicketsModule,
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
