import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthStateService } from '../../../../domain/auth/oauth-state.service';

/**
 * 🔒 F-02: Google OAuth guard.
 * The `state` parameter is now an unpredictable single-use anti-CSRF nonce
 * (managed via OAuthStateService in Redis), not base64-encoded redirect data.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
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
