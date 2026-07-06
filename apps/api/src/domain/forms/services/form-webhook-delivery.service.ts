import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';

export type WebhookDeliveryStatus =
  | 'queued'
  | 'success'
  | 'failed';

@Injectable()
export class FormWebhookDeliveryService {
  constructor(private readonly prisma: PrismaService) {}

  async recordQueued(
    formId: string,
    eventId: string,
    webhookUrl: string,
    attempt = 1,
  ) {
    return this.prisma.form_webhook_delivery.upsert({
      where: { eventId },
      create: {
        formId,
        eventId,
        webhookUrl,
        status: 'queued',
        attempt,
      },
      update: {
        status: 'queued',
        attempt,
        errorMessage: null,
        responseCode: null,
        latencyMs: null,
      },
    });
  }

  async listForForm(formId: string, limit = 50) {
    const take = Math.min(Math.max(limit, 1), 100);
    return this.prisma.form_webhook_delivery.findMany({
      where: { formId },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        eventId: true,
        status: true,
        attempt: true,
        responseCode: true,
        latencyMs: true,
        errorMessage: true,
        createdAt: true,
        webhookUrl: true,
      },
    });
  }

  async recordResult(
    eventId: string,
    result: {
      status: 'success' | 'failed';
      responseCode?: number;
      latencyMs?: number;
      errorMessage?: string;
      attempt?: number;
    },
  ) {
    return this.prisma.form_webhook_delivery.update({
      where: { eventId },
      data: {
        status: result.status,
        responseCode: result.responseCode ?? null,
        latencyMs: result.latencyMs ?? null,
        errorMessage: result.errorMessage ?? null,
        ...(result.attempt !== undefined ? { attempt: result.attempt } : {}),
      },
    });
  }
}
