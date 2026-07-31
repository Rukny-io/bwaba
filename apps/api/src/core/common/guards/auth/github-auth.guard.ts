import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthStateService } from '../../../../domain/auth/oauth-state.service';

/**
 * 🔒 F-02: GitHub OAuth guard.
 * `state` is an unpredictable single-use anti-CSRF nonce (Redis-backed).
 *
 * On callback failure, redirect to the accounts login page instead of a raw
 * JSON 401/500 (GitHub sends the browser to the API callback URL).
 */
@Injectable()
export class GitHubAuthGuard extends AuthGuard('github') {
  constructor(private readonly oauthState: OAuthStateService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.oauthState.attachToRequest(context);
    try {
      return (await super.canActivate(context)) as boolean;
    } catch (error) {
      if (this.redirectOAuthFailure(context, error)) {
        // Response already redirected; returning false still raises Forbidden,
        // which HttpExceptionFilter ignores when headers were sent.
        return false;
      }
      throw error;
    }
  }

  getAuthenticateOptions(context: ExecutionContext) {
    return OAuthStateService.readAuthenticateOptions(context);
  }

  handleRequest<TUser>(err: Error | null, user: TUser, info: unknown): TUser {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          (info as { message?: string })?.message ||
            'فشل تسجيل الدخول عبر GitHub',
        )
      );
    }
    return user;
  }

  private redirectOAuthFailure(
    context: ExecutionContext,
    error: unknown,
  ): boolean {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    // Only redirect on the callback leg (browser lands here from GitHub).
    if (!req.query?.code || res.headersSent) {
      return false;
    }

    const base = (
      process.env.AUTH_FRONTEND_URL || 'http://localhost:3005'
    ).replace(/\/$/, '');
    const rawMessage =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'فشل تسجيل الدخول عبر GitHub';

    // Nest UnauthorizedException message may be string | string[].
    const message = Array.isArray((error as { message?: unknown })?.message)
      ? ((error as { message: string[] }).message[0] ?? rawMessage)
      : rawMessage;

    const url = new URL(`${base}/login`);
    url.searchParams.set('error', 'github');
    url.searchParams.set('message', message.slice(0, 300));
    if (typeof req.query?.next === 'string' && req.query.next) {
      url.searchParams.set('next', req.query.next);
    }

    res.redirect(url.toString());
    return true;
  }
}
