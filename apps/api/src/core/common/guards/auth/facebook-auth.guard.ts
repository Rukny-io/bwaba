import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthStateService } from '../../../../domain/auth/oauth-state.service';

/**
 * 🔒 F-02: Facebook OAuth guard.
 * `state` is an unpredictable single-use anti-CSRF nonce (Redis-backed).
 */
@Injectable()
export class FacebookAuthGuard extends AuthGuard('facebook') {
  constructor(private readonly oauthState: OAuthStateService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.oauthState.attachToRequest(context);
    return (await super.canActivate(context)) as boolean;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    return OAuthStateService.readAuthenticateOptions(context);
  }
}
