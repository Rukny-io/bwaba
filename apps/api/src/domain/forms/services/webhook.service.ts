import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { assertUrlSafe } from '../../../core/common/utils/ssrf-guard';

export interface WebhookSendResult {
  success: boolean;
  statusCode?: number;
  latencyMs: number;
  errorMessage?: string;
}

export interface WebhookPayload {
  event:
    | 'form.submission.created'
    | 'form.submission.updated'
    | 'form.submission.deleted';
  timestamp: string;
  formId: string;
  formSlug: string;
  submissionId?: string;
  /** Field answers keyed by question label (for integrations e.g. Make / Sheets). */
  answers?: Record<string, string>;
  data?: any;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  /**
   * Send webhook notification to external URL
   */
  async sendWebhook(
    webhookUrl: string,
    payload: WebhookPayload,
    secret?: string,
    eventId?: string,
  ): Promise<WebhookSendResult> {
    const finalEventId = eventId || crypto.randomUUID();
    const timestamp = payload.timestamp || new Date().toISOString();
    const started = Date.now();

    try {
      // SSRF protection: DNS-resolve and block private/reserved ranges
      try {
        await assertUrlSafe(webhookUrl);
      } catch {
        this.logger.warn(`Blocked webhook to unsafe URL: ${webhookUrl}`);
        return {
          success: false,
          latencyMs: Date.now() - started,
          errorMessage: 'Unsafe webhook URL',
        };
      }
      // Generate signature if secret is provided
      const headers: any = {
        'Content-Type': 'application/json',
        'User-Agent': 'Rukny-Forms-Webhook/1.0',
        'X-Webhook-Event-Id': finalEventId,
        'X-Webhook-Timestamp': timestamp,
      };

      if (secret) {
        headers['X-Webhook-Signature'] = this.generateSignature(
          payload,
          secret,
        );
        headers['X-Webhook-Signature-V2'] = this.generateTimestampedSignature(
          timestamp,
          payload,
          secret,
        );
      }

      // Send POST request
      const response = await axios.post(webhookUrl, payload, {
        headers,
        timeout: 10000, // 10 seconds timeout
        maxRedirects: 0,
      });

      const latencyMs = Date.now() - started;
      if (response.status >= 200 && response.status < 300) {
        this.logger.log(`Webhook sent successfully to ${webhookUrl}`);
        return { success: true, statusCode: response.status, latencyMs };
      }

      this.logger.warn(
        `Webhook returned non-2xx status: ${response.status} for ${webhookUrl}`,
      );
      return {
        success: false,
        statusCode: response.status,
        latencyMs,
        errorMessage: `HTTP ${response.status}`,
      };
    } catch (error) {
      const latencyMs = Date.now() - started;
      const message =
        error instanceof Error ? error.message : 'Webhook request failed';
      this.logger.error(`Failed to send webhook to ${webhookUrl}: ${message}`);
      return {
        success: false,
        latencyMs,
        errorMessage: message,
        statusCode: (error as { response?: { status?: number } })?.response
          ?.status,
      };
    }
  }

  private generateSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadString);
    return `sha256=${hmac.digest('hex')}`;
  }

  /** Preferred: HMAC over `{timestamp}.{json}` — mitigates replay when combined with X-Webhook-Timestamp. */
  private generateTimestampedSignature(
    timestamp: string,
    payload: WebhookPayload,
    secret: string,
  ): string {
    const body = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${timestamp}.${body}`);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Verify webhook signature (for incoming webhooks)
   */
  verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Send form submission webhook
   */
  async notifyFormSubmission(
    webhookUrl: string,
    webhookSecret: string | null,
    formId: string,
    formSlug: string,
    submissionId: string,
    submissionData: any,
  ): Promise<void> {
    const payload: WebhookPayload = {
      event: 'form.submission.created',
      timestamp: new Date().toISOString(),
      formId,
      formSlug,
      submissionId,
      data: submissionData,
    };

    await this.sendWebhook(webhookUrl, payload, webhookSecret);
  }

  /**
   * Send form submission updated webhook
   */
  async notifyFormSubmissionUpdated(
    webhookUrl: string,
    webhookSecret: string | null,
    formId: string,
    formSlug: string,
    submissionId: string,
    submissionData: any,
  ): Promise<void> {
    const payload: WebhookPayload = {
      event: 'form.submission.updated',
      timestamp: new Date().toISOString(),
      formId,
      formSlug,
      submissionId,
      data: submissionData,
    };

    await this.sendWebhook(webhookUrl, payload, webhookSecret);
  }

  /**
   * Send form submission deleted webhook
   */
  async notifyFormSubmissionDeleted(
    webhookUrl: string,
    webhookSecret: string | null,
    formId: string,
    formSlug: string,
    submissionId: string,
  ): Promise<void> {
    const payload: WebhookPayload = {
      event: 'form.submission.deleted',
      timestamp: new Date().toISOString(),
      formId,
      formSlug,
      submissionId,
    };

    await this.sendWebhook(webhookUrl, payload, webhookSecret);
  }

  /**
   * Test webhook URL (for configuration testing)
   */
  async testWebhook(
    webhookUrl: string,
    secret?: string,
  ): Promise<WebhookSendResult> {
    const testPayload: WebhookPayload = {
      event: 'form.submission.created',
      timestamp: new Date().toISOString(),
      formId: 'test-form-id',
      formSlug: 'test-form',
      submissionId: 'test-submission-id',
      data: {
        test: true,
        message: 'This is a test webhook from Rukny Forms',
      },
    };

    return this.sendWebhook(webhookUrl, testPayload, secret);
  }
}
