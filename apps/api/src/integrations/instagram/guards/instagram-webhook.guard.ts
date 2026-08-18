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
 * Meta signs every webhook POST with `X-Hub-Signature-256: sha256=<hex>` where
 * the HMAC is computed over the *raw* request body using the app secret.
 *
 * Instagram (ruknyio) and WhatsApp use different Meta apps — never prefer
 * WHATSAPP_APP_SECRET before Instagram secrets or valid POSTs are rejected.
 */
@Injectable()
export class InstagramWebhookGuard implements CanActivate {
  private readonly logger = new Logger(InstagramWebhookGuard.name);

  constructor(private readonly config: ConfigService) {}

  private getWebhookAppSecrets(): string[] {
    const candidates = [
      this.config.get<string>('INSTAGRAM_WEBHOOK_APP_SECRET'),
      this.config.get<string>('INSTAGRAM_APP_SECRET'),
      this.config.get<string>('FACEBOOK_APP_SECRET'),
      this.config.get<string>('WHATSAPP_APP_SECRET'),
    ];

    return [...new Set(candidates.filter((secret): secret is string => Boolean(secret)))];
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
        'No Meta app secret for Instagram webhooks — set INSTAGRAM_WEBHOOK_APP_SECRET or INSTAGRAM_APP_SECRET (fail closed).',
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

    const matched = secrets.some((secret) =>
      this.signatureMatches(rawBody, signature, secret),
    );

    if (!matched) {
      this.logger.warn(
        `Instagram webhook rejected: signature mismatch (tried ${secrets.length} configured secret(s))`,
      );
      throw new ForbiddenException('Invalid webhook signature');
    }

    return true;
  }
}
