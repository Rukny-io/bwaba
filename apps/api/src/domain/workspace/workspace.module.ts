import { Module } from '@nestjs/common';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { EmailModule } from '../../integrations/email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { WorkspaceAccessService } from './workspace-access.service';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import { WorkspaceGuard } from './workspace.guard';

@Module({
  imports: [PrismaModule, EmailModule, NotificationsModule, SubscriptionsModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, WorkspaceAccessService, WorkspaceGuard],
  exports: [WorkspaceService, WorkspaceAccessService, WorkspaceGuard],
})
export class WorkspaceModule {}
