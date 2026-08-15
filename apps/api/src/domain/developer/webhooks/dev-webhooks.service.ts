import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { randomBytes, createHmac } from 'crypto';
import { assertUrlSafe } from '../../../core/common/utils/ssrf-guard';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { resolveLimitValue } from '../subscriptions/dev-plan-limits.config';
import { DevSubscriptionsService } from '../subscriptions/dev-subscriptions.service';

@Injectable()
export class DevWebhooksService {
  private readonly logger = new Logger(DevWebhooksService.name);

  constructor(
    private prisma: PrismaService,
    private devSubscriptions: DevSubscriptionsService,
  ) {}

  private async resolveDeveloperAppId(
    userId: string,
    publicAppId?: string,
  ): Promise<string | null> {
    if (!publicAppId) return null;

    const app = await this.prisma.developerApp.findFirst({
      where: { appId: publicAppId, userId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!app) {
      throw new NotFoundException('App not found');
    }
    return app.id;
  }

  async create(userId: string, dto: CreateWebhookDto) {
    await this.checkWebhookLimit(userId);
    await assertUrlSafe(dto.url);

    const developerAppId = await this.resolveDeveloperAppId(userId, dto.appId);
    const secret = `whsec_${randomBytes(32).toString('hex')}`;

    const webhook = await this.prisma.developerWebhook.create({
      data: {
        userId,
        developerAppId,
        url: dto.url,
        secret,
        events: dto.events,
        description: dto.description,
      },
    });

    return {
      ...webhook,
      secret,
    };
  }

  async findAll(userId: string, publicAppId?: string) {
    const developerAppId = publicAppId
      ? await this.resolveDeveloperAppId(userId, publicAppId)
      : null;

    return this.prisma.developerWebhook.findMany({
      where: {
        userId,
        ...(developerAppId ? { developerAppId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        url: true,
        events: true,
        status: true,
        description: true,
        failureCount: true,
        developerAppId: true,
        lastSuccessAt: true,
        lastFailureAt: true,
        lastResponseCode: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(userId: string, webhookId: string, dto: UpdateWebhookDto) {
    const webhook = await this.prisma.developerWebhook.findFirst({
      where: { id: webhookId, userId },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');

    if (dto.url) {
      await assertUrlSafe(dto.url);
    }

    return this.prisma.developerWebhook.update({
      where: { id: webhookId },
      data: {
        ...(dto.url && { url: dto.url }),
        ...(dto.events && { events: dto.events }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status && { status: dto.status as any }),
      },
      select: {
        id: true,
        url: true,
        events: true,
        status: true,
        description: true,
        developerAppId: true,
        updatedAt: true,
      },
    });
  }

  async remove(userId: string, webhookId: string) {
    const webhook = await this.prisma.developerWebhook.findFirst({
      where: { id: webhookId, userId },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');

    await this.prisma.developerWebhook.delete({ where: { id: webhookId } });
    return { success: true };
  }

  async rotateSecret(userId: string, webhookId: string) {
    const webhook = await this.prisma.developerWebhook.findFirst({
      where: { id: webhookId, userId },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');

    const newSecret = `whsec_${randomBytes(32).toString('hex')}`;

    await this.prisma.developerWebhook.update({
      where: { id: webhookId },
      data: { secret: newSecret },
    });

    return { secret: newSecret };
  }

  async test(userId: string, webhookId: string) {
    const webhook = await this.prisma.developerWebhook.findFirst({
      where: { id: webhookId, userId },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');

    const timestamp = Math.floor(Date.now() / 1000);
    const testPayload = {
      id: `evt_test_${randomBytes(8).toString('hex')}`,
      type: 'test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook event from Rukny.io',
      },
    };

    const payloadStr = JSON.stringify(testPayload);
    const signature = this.signPayload(payloadStr, webhook.secret);

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Rukny-Signature': `sha256=${signature}`,
          'X-Rukny-Event': 'test',
          'X-Rukny-Delivery': testPayload.id,
          'X-Rukny-Timestamp': String(timestamp),
        },
        body: payloadStr,
        signal: AbortSignal.timeout(10000),
      });

      return {
        success: response.ok,
        statusCode: response.status,
        message: response.ok
          ? 'Webhook test successful'
          : 'Webhook returned non-2xx status',
      };
    } catch (error) {
      return {
        success: false,
        statusCode: null,
        message: `Connection failed: ${error.message}`,
      };
    }
  }

  async getActiveWebhooksForEvent(
    userId: string,
    eventType: string,
    developerAppId?: string,
  ) {
    return this.prisma.developerWebhook.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        events: { has: eventType },
        ...(developerAppId ? { developerAppId } : {}),
      },
    });
  }

  signPayload(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  private async checkWebhookLimit(userId: string) {
    const allowed = await this.devSubscriptions.checkResourceLimit(
      userId,
      'webhooks',
    );
    if (!allowed) {
      const limits = await this.devSubscriptions.getPlanLimits(userId);
      const max = resolveLimitValue(limits.maxWebhooks);
      throw new ForbiddenException(
        `Webhook limit reached (${max}). Upgrade to Pro for more.`,
      );
    }
  }
}
