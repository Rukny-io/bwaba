import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FormsController } from './forms.controller';
import { FormsUploadController } from './forms-upload.controller';
import { FormsService } from './forms.service';
import { FormsFacadeService } from './forms-facade.service';
import { PrismaModule } from '../../core/database/prisma/prisma.module';
import { EmailModule } from '../../integrations/email/email.module';
import { ValidationService } from '../../core/common/validation.service';
import { ConditionalLogicService } from './services/conditional-logic.service';
import { WebhookService } from './services/webhook.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { GoogleSheetsModule } from '../../integrations/google-sheets/google-sheets.module';
import { GoogleDriveModule } from '../../integrations/google-drive/google-drive.module';
import { S3Service } from '../../services/s3.service';
import { RedisModule } from '../../core/cache/redis.module';
import { TurnstileService } from '../../infrastructure/security/turnstile.service';
import { FormWebhookProcessor } from './processors/form-webhook.processor';
import {
  FormsCommandsService,
  FormsQueriesService,
  FormsSubmissionService,
  FormsExportService,
  FormsStepsService,
  FormsAnalyticsDashboardService,
  FormsIntegrationsDashboardService,
} from './services';
import { FormAnalyticsTrackerService } from './services/form-analytics-tracker.service';
import { FormGeoResolverService } from './services/form-geo-resolver.service';
import { FormsEmailVerificationService } from './services/forms-email-verification.service';
import { FormsPhoneVerificationService } from './services/forms-phone-verification.service';
import { FormWebhookQueueService } from './services/form-webhook-queue.service';
import { FormsUploadCleanupService } from './services/forms-upload-cleanup.service';
import { FormsDeletionService } from './services/forms-deletion.service';
import { FormsDeletionPurgeService } from './services/forms-deletion-purge.service';
import { FormsPublicUploadService } from './services/forms-public-upload.service';
import { FormWebhookDeliveryService } from './services/form-webhook-delivery.service';
import { FormsCacheService } from './services/forms-cache.service';
import { AnalyticsService as FormInsightsService } from './services/analytics.service';
import { SubmitContentLengthGuard } from './guards/submit-content-length.guard';
import { StorageModule } from '../storage/storage.module';
import { SecurityModule } from '../../infrastructure/security/security.module';
import { FormTeamAccessService } from './form-team/form-team-access.service';
import { FormTeamService } from './form-team/form-team.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DeveloperModule } from '../developer/developer.module';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    NotificationsModule,
    RedisModule,
    StorageModule,
    SecurityModule,
    ConfigModule,
    forwardRef(() => GoogleSheetsModule),
    forwardRef(() => GoogleDriveModule),
    SubscriptionsModule,
    DeveloperModule,
    WorkspaceModule,
    BullModule.registerQueueAsync({
      name: 'form-webhook',
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          attempts: 5,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FormsController, FormsUploadController],
  providers: [
    FormsService,
    FormsFacadeService,
    FormTeamAccessService,
    FormTeamService,
    FormsCommandsService,
    FormsQueriesService,
    FormsSubmissionService,
    FormsExportService,
    FormsStepsService,
    FormsAnalyticsDashboardService,
    FormsIntegrationsDashboardService,
    FormAnalyticsTrackerService,
    FormGeoResolverService,
    FormInsightsService,
    FormsEmailVerificationService,
    FormsPhoneVerificationService,
    FormWebhookQueueService,
    FormWebhookProcessor,
    FormsUploadCleanupService,
    FormsDeletionService,
    FormsDeletionPurgeService,
    FormsPublicUploadService,
    FormWebhookDeliveryService,
    FormsCacheService,
    ValidationService,
    ConditionalLogicService,
    WebhookService,
    S3Service,
    TurnstileService,
    SubmitContentLengthGuard,
  ],
  exports: [FormsService, FormsFacadeService, FormTeamAccessService],
})
export class FormsModule {}
