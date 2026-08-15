import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InstagramController } from './instagram.controller';
import { InstagramService } from './instagram.service';
import { InstagramInboxService } from './instagram-inbox.service';
import { InstagramWebhookGuard } from './guards/instagram-webhook.guard';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { RedisModule } from '../../core/cache/redis.module';

@Module({
  imports: [PrismaModule, ConfigModule, RedisModule],
  controllers: [InstagramController],
  providers: [InstagramService, InstagramInboxService, InstagramWebhookGuard],
  exports: [InstagramService, InstagramInboxService],
})
export class InstagramModule {}
