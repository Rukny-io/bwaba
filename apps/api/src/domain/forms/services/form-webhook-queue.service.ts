import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { randomUUID } from 'crypto';
import { WebhookService, WebhookPayload } from './webhook.service';
import { FormWebhookDeliveryService } from './form-webhook-delivery.service';

export interface FormWebhookJobData {
  formId: string;
  webhookUrl: string;
  webhookSecret?: string | null;
  payload: WebhookPayload;
  eventId: string;
}

@Injectable()
export class FormWebhookQueueService {
  private readonly logger = new Logger(FormWebhookQueueService.name);

  constructor(
    @InjectQueue('form-webhook')
    private readonly queue: Queue<FormWebhookJobData>,
    private readonly webhookService: WebhookService,
    private readonly deliveryLog: FormWebhookDeliveryService,
  ) {}

  async enqueueDelivery(
    formId: string,
    webhookUrl: string,
    webhookSecret: string | null | undefined,
    payload: WebhookPayload,
  ): Promise<void> {
    const eventId = randomUUID();
    await this.deliveryLog.recordQueued(formId, eventId, webhookUrl);
    await this.queue.add(
      'deliver',
      { formId, webhookUrl, webhookSecret, payload, eventId },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    );
  }

  async processJob(
    data: FormWebhookJobData,
    attempt = 1,
  ): Promise<void> {
    const result = await this.webhookService.sendWebhook(
      data.webhookUrl,
      data.payload,
      data.webhookSecret ?? undefined,
      data.eventId,
    );

    await this.deliveryLog.recordResult(data.eventId, {
      status: result.success ? 'success' : 'failed',
      responseCode: result.statusCode,
      latencyMs: result.latencyMs,
      errorMessage: result.errorMessage,
      attempt,
    });

    if (!result.success) {
      throw new Error(
        result.errorMessage ||
          `Webhook delivery failed for ${data.webhookUrl}`,
      );
    }
  }
}
