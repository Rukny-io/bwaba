import {
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../decorators/auth/public.decorator';

/**
 * 🔒 F-07 — Global default-deny authentication guard.
 *
 * Registered as an APP_GUARD so EVERY route requires a valid JWT unless it is
 * explicitly whitelisted with `@Public()`. This closes the "forgot to add
 * @UseGuards" gap where any new endpoint was public by default.
 *
 * Zero-downtime rollout via `GLOBAL_AUTH_MODE`:
 *   - `report` (default): never blocks; logs any route that WOULD be blocked so
 *      the team can add `@Public()` where legitimately needed before enforcing.
 *   - `enforce`: unauthenticated, non-public routes receive 401.
 *
 * Flip to `enforce` once the report logs are clean (see
 * scripts/scan-unprotected-routes.ts).
 */
@Injectable()
export class GlobalJwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(GlobalJwtAuthGuard.name);

  constructor(private readonly reflector: Reflector) {
    super();
  }

  private get mode(): 'report' | 'enforce' {
    return (process.env.GLOBAL_AUTH_MODE || 'report').toLowerCase() ===
      'enforce'
      ? 'enforce'
      : 'report';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    try {
      return (await super.canActivate(context)) as boolean;
    } catch (err) {
      if (this.mode === 'enforce') {
        throw err instanceof UnauthorizedException
          ? err
          : new UnauthorizedException('Authentication required');
      }
      // report mode — allow but surface the gap
      const req = context.switchToHttp().getRequest();
      this.logger.warn(
        `[GLOBAL_AUTH:report] Unauthenticated access allowed to ${req.method} ${
          req.originalUrl || req.url
        } — add @Public() if intentional, or it will be blocked in enforce mode.`,
      );
      return true;
    }
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // In report mode, swallow errors so canActivate's catch path handles them.
    if (this.mode === 'report') {
      return user || null;
    }
    if (err || !user) {
      throw err instanceof Error
        ? err
        : new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
