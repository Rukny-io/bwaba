import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { validateCsrfToken } from '../../../domain/auth/cookie.config';
import { IS_PUBLIC_KEY } from '../decorators/auth/public.decorator';

/**
 * 🔒 CSRF Protection Guard
 *
 * Validates CSRF token for state-changing requests
 * - Token must be sent in X-CSRF-Token header
 * - Must match the csrf_token cookie
 *
 * Usage:
 * @UseGuards(CsrfGuard)
 * @Post('sensitive-action')
 * async sensitiveAction() { ... }
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ||
      /^Bearer\s+\S+$/i.test(request.headers.authorization || '')
    ) {
      return true;
    }

    // Skip CSRF validation for safe methods
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(request.method.toUpperCase())) {
      return true;
    }

    // Skip in development if CSRF_SKIP is set
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.CSRF_SKIP === 'true'
    ) {
      return true;
    }

    const validation = validateCsrfToken(request);

    if (!validation.valid) {
      throw new ForbiddenException(
        `CSRF validation failed: ${validation.reason}`,
      );
    }

    return true;
  }
}
