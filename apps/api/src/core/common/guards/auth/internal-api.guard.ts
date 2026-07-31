import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * 🔒 Internal API Guard
 *
 * Protects internal-only endpoints (proxy / service-to-service / cron calls)
 * by requiring a shared secret in the `x-internal-api-secret` header that must
 * match `INTERNAL_API_SECRET`.
 *
 * Behavior:
 * - Fails **closed**: if `INTERNAL_API_SECRET` is not configured, all access is
 *   denied (an internal endpoint must never be reachable without the secret).
 * - Uses a constant-time comparison to avoid timing attacks.
 *
 * Usage: annotate a controller/route with `@InternalOnly()` (which applies this
 * guard) or `@UseGuards(InternalApiGuard)`.
 */
@Injectable()
export class InternalApiGuard implements CanActivate {
  private readonly logger = new Logger(InternalApiGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const configuredSecret =
      this.configService.get<string>('INTERNAL_API_SECRET');

    if (!configuredSecret) {
      this.logger.error(
        'INTERNAL_API_SECRET is not configured — denying access to internal endpoint',
      );
      throw new ForbiddenException('Internal access is not configured');
    }

    const provided = request.headers?.['x-internal-api-secret'] as
      | string
      | undefined;

    if (!provided || !this.safeEqual(provided, configuredSecret)) {
      throw new ForbiddenException('Invalid internal API credentials');
    }

    return true;
  }

  private safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  }
}
