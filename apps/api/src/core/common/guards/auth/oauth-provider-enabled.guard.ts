import {
  CanActivate,
  ExecutionContext,
  Injectable,
  mixin,
  Type,
} from '@nestjs/common';
import {
  assertOAuthProviderEnabled,
  type OAuthProviderName,
} from '../../../../domain/auth/oauth-providers.config';

export function OAuthProviderEnabledGuard(
  provider: OAuthProviderName,
): Type<CanActivate> {
  @Injectable()
  class ProviderEnabledGuard implements CanActivate {
    canActivate(_context: ExecutionContext): boolean {
      assertOAuthProviderEnabled(provider);
      return true;
    }
  }

  return mixin(ProviderEnabledGuard);
}
