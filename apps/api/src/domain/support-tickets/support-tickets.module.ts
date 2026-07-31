import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../../integrations/email/email.module';
import { StorageModule } from '../storage/storage.module';
import { SupportTicketsController } from './support-tickets.controller';
import { SupportTicketsAdminController } from './support-tickets-admin.controller';
import { SupportTicketsService } from './support-tickets.service';
import { SupportTicketsGateway } from './support-tickets.gateway';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    EmailModule,
    StorageModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SupportTicketsController, SupportTicketsAdminController],
  providers: [SupportTicketsService, SupportTicketsGateway],
  exports: [SupportTicketsService, SupportTicketsGateway],
})
export class SupportTicketsModule {}
