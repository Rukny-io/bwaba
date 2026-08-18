import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import * as crypto from 'crypto';

/**
 * 🔒 F2-04 — Instagram / Meta webhook signature guard.
 *
 * Meta signs webhooks with the App Secret from App Dashboard → Settings → Basic
 * (ruknyio app 1575734613921683). This may differ from Instagram Login app secret.
 */
@Injectable()
export class InstagramWebhookGuard implements CanActivate {
  private readonly logger = new Logger(InstagramWebhookGuard.name);

  constructor(private readonly config: ConfigService) {}

  private getWebhookAppSecrets(): Array<{ label: string; value: string }> {
    const entries: Array<{ label: string; value: string | undefined }> = [
      {
        label: 'INSTAGRAM_WEBHOOK_APP_SECRET',
        value: this.config.get<string>('INSTAGRAM_WEBHOOK_APP_SECRET'),
      },
      {
        label: 'META_APP_SECRET',
        value: this.config.get<string>('META_APP_SECRET'),
      },
      {
        label: 'INSTAGRAM_APP_SECRET',
        value: this.config.get<string>('INSTAGRAM_APP_SECRET'),
      },
    ];

    const metaConfigured = Boolean(this.config.get<string>('META_APP_SECRET'));

    if (!metaConfigured) {
      entries.push(
        {
          label: 'FACEBOOK_APP_SECRET',
          value: this.config.get<string>('FACEBOOK_APP_SECRET'),
        },
        {
          label: 'WHATSAPP_APP_SECRET',
          value: this.config.get<string>('WHATSAPP_APP_SECRET'),
        },
      );
    }

    const seen = new Set<string>();
    const result: Array<{ label: string; value: string }> = [];

    for (const entry of entries) {
      if (!entry.value || seen.has(entry.value)) continue;
      seen.add(entry.value);
      result.push({ label: entry.label, value: entry.value });
    }

    return result;
  }

  private signatureMatches(rawBody: Buffer, signature: string, secret: string): boolean {
    const expected =
      'sha256=' +
      crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const providedBuf = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expected, 'utf8');

    return (
      providedBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(providedBuf, expectedBuf)
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<Request & { rawBody?: Buffer }>();

    const secrets = this.getWebhookAppSecrets();
    if (secrets.length === 0) {
      this.logger.error(
        'No Meta app secret for Instagram webhooks — set META_APP_SECRET or INSTAGRAM_WEBHOOK_APP_SECRET (fail closed).',
      );
      throw new ForbiddenException('Webhook signature verification unavailable');
    }

    const header = req.headers['x-hub-signature-256'];
    const signature = Array.isArray(header) ? header[0] : header;
    if (!signature || !signature.startsWith('sha256=')) {
      this.logger.warn('Instagram webhook rejected: missing/invalid signature header');
      throw new ForbiddenException('Missing webhook signature');
    }

    const rawBody = req.rawBody;
    if (!rawBody || rawBody.length === 0) {
      this.logger.error(
        'Instagram webhook rejected: raw body unavailable (rawBody not captured).',
      );
      throw new ForbiddenException('Cannot verify webhook signature');
    }

    for (const { label, value } of secrets) {
      if (this.signatureMatches(rawBody, signature, value)) {
        this.logger.debug(`Instagram webhook signature matched ${label}`);
        return true;
      }
    }

    this.logger.warn(
      `Instagram webhook rejected: signature mismatch (bodyBytes=${rawBody.length}, tried ${secrets.map((s) => s.label).join(', ')})`,
    );
    throw new ForbiddenException('Invalid webhook signature');
  }
}
