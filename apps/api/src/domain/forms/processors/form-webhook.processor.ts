import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { NotificationsGateway } from '../../notifications/notifications.gateway';
import {
  FormWebhookJobData,
  FormWebhookQueueService,
} from '../services/form-webhook-queue.service';

@Processor('form-webhook')
export class FormWebhookProcessor {
  private readonly logger = new Logger(FormWebhookProcessor.name);

  constructor(
    private readonly webhookQueue: FormWebhookQueueService,
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  @Process('deliver')
  async handleDelivery(job: Job<FormWebhookJobData>): Promise<void> {
    await this.webhookQueue.processJob(job.data, job.attemptsMade || 1);
  }

  @OnQueueFailed()
  async onFailed(job: Job<FormWebhookJobData>, error: Error) {
    this.logger.error(
      `Form webhook job failed (attempt ${job.attemptsMade}): ${error.message}`,
    );

    const maxAttempts = job.opts.attempts ?? 5;
    if (job.attemptsMade < maxAttempts) return;

    try {
      const form = await this.prisma.form.findUnique({
        where: { id: job.data.formId },
        select: { id: true, slug: true, title: true, userId: true },
      });

      if (!form) return;

      await this.notificationsGateway.sendNotification({
        userId: form.userId,
        type: NotificationType.SYSTEM,
        title: 'فشل Webhook',
        message: `فشل تسليم Webhook للنموذج «${form.title}» بعد ${maxAttempts} محاولات.`,
        data: {
          formId: form.id,
          formSlug: form.slug,
          formTitle: form.title,
          eventId: job.data.eventId,
          webhookUrl: job.data.webhookUrl,
          integrationType: 'webhook',
        },
      });
    } catch (notifyError) {
      this.logger.error(
        `Failed to notify owner about webhook failure: ${(notifyError as Error).message}`,
      );
    }
  }
}
