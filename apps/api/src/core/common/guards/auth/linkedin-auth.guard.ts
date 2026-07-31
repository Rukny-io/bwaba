import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthStateService } from '../../../../domain/auth/oauth-state.service';

/**
 * 🔒 F-02: LinkedIn OAuth guard.
 * Migrated from passport's session-backed `state: true` to the unified
 * Redis-backed single-use nonce (stateless, works without server sessions).
 */
@Injectable()
export class LinkedInAuthGuard extends AuthGuard('linkedin') {
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
