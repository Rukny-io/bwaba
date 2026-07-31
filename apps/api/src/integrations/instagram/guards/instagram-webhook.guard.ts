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
 * This guard:
 *  - reads the raw body captured in main.ts (`req.rawBody`),
 *  - recomputes the HMAC-SHA256 with `INSTAGRAM_APP_SECRET`,
 *  - compares in constant time (`crypto.timingSafeEqual`),
 *  - FAILS CLOSED (403) when the secret is unset, the header is missing, the
 *    raw body is unavailable, or the signature does not match.
 */
@Injectable()
export class InstagramWebhookGuard implements CanActivate {
  private readonly logger = new Logger(InstagramWebhookGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<Request & { rawBody?: Buffer }>();

    const appSecret = this.config.get<string>('INSTAGRAM_APP_SECRET');
    if (!appSecret) {
      // No secret configured → cannot verify → reject (fail closed).
      this.logger.error(
        'INSTAGRAM_APP_SECRET is not set — rejecting Instagram webhook (fail closed).',
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

    const expected =
      'sha256=' +
      crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

    const providedBuf = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expected, 'utf8');

    if (
      providedBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(providedBuf, expectedBuf)
    ) {
      this.logger.warn('Instagram webhook rejected: signature mismatch');
      throw new ForbiddenException('Invalid webhook signature');
    }

    return true;
  }
}
