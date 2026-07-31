import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { TikTokController } from './tiktok.controller';
import { TikTokService } from './tiktok.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [TikTokController],
  providers: [TikTokService],
  exports: [TikTokService],
})
export class TikTokModule {}
