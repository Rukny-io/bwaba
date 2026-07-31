import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { PushSubscriptionService } from './push-subscription.service';
import { PushSubscriptionController } from './push-subscription.controller';

@Module({
  imports: [PrismaModule],
  providers: [PushSubscriptionService],
  controllers: [PushSubscriptionController],
  exports: [PushSubscriptionService],
})
export class PushNotificationsModule {}
