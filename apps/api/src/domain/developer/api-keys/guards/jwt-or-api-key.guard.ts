import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeysService } from '../api-keys.service';
import { extractRawApiKey } from '../extract-raw-api-key.util';
import { PrismaService } from '../../../../core/database/prisma/prisma.service';
import { getClientIp } from '../../../../core/common/utils/client-ip.util';

/**
 * Accepts JWT (Bearer access token / cookie) or Developer API key (rk_live_/rk_test_).
 * Scope checks via @RequireScopes apply only when authenticating with an API key.
 */
@Injectable()
export class JwtOrApiKeyGuard extends AuthGuard('jwt') {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawKey = extractRawApiKey(request);

    if (rawKey) {
      const keyData = await this.apiKeysService.validateKey(rawKey);
      if (!keyData) {
        throw new UnauthorizedException('Invalid or expired API key.');
      }

      if (keyData.ipAllowlist.length > 0) {
        const clientIp = getClientIp(request);
        if (!keyData.ipAllowlist.includes(clientIp)) {
          throw new ForbiddenException(
            'IP address not allowed for this API key.',
          );
        }
      }

      const requiredScopes = this.reflector.get<string[]>(
        'api-scopes',
        context.getHandler(),
      );
      if (requiredScopes?.length) {
        const hasScope = requiredScopes.every((scope) =>
          keyData.scopes.includes(scope),
        );
        if (!hasScope) {
          throw new ForbiddenException(
            `Insufficient permissions. Required scopes: ${requiredScopes.join(', ')}`,
          );
        }
      }

      const user = await this.prisma.user.findUnique({
        where: { id: keyData.userId },
        select: {
          id: true,
          email: true,
          role: true,
          phone: true,
          bannerUrls: true,
          profileCompleted: true,
          profile: {
            select: { name: true, username: true, avatar: true, bio: true },
          },
          subscription: {
            select: { plan: true, status: true, currentPeriodEnd: true },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('API key owner not found.');
      }

      const sub = user.subscription;
      const subscriptionPlan =
        sub?.status === 'ACTIVE' &&
        (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date())
          ? sub.plan
          : 'FREE';

      request.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.profile?.name,
        username: user.profile?.username,
        avatar: user.profile?.avatar,
        bio: user.profile?.bio,
        phone: user.phone,
        bannerUrls: user.bannerUrls || [],
        profileCompleted: user.profileCompleted ?? false,
        subscriptionPlan,
      };
      request.authMethod = 'api_key';
      request.apiKey = keyData;
      request.apiKeyId = keyData.id;
      return true;
    }

    request.authMethod = 'jwt';
    const result = await super.canActivate(context);
    return result as boolean;
  }

  handleRequest<TUser>(
    err: Error | null,
    user: TUser,
    info: Error | { message?: string } | undefined,
    context: ExecutionContext,
  ): TUser {
    if (user) {
      return user;
    }

    const request = context.switchToHttp().getRequest();
    const auth = request.headers?.authorization;
    const hasAuthHeader = typeof auth === 'string' && auth.trim().length > 0;

    if (hasAuthHeader && !extractRawApiKey(request)) {
      throw new UnauthorizedException(
        'Invalid credentials. Use Authorization: Bearer <rk_live_...> or X-API-Key for API keys.',
      );
    }

    if (!hasAuthHeader) {
      throw new UnauthorizedException(
        'Authentication required. Send Authorization: Bearer <rk_live_...> or X-API-Key.',
      );
    }

    throw err || new UnauthorizedException(info?.message || 'Unauthorized');
  }
}
