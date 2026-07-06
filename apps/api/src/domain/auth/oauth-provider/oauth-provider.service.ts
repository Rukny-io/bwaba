import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import type { Request, Response } from 'express';
import { RedisService } from '../../../core/cache/redis.service';
import { TokenService } from '../token.service';
import { extractAccessToken } from '../cookie.config';
import {
  generateCsrfToken,
  setAccessTokenCookie,
  setCsrfTokenCookie,
  setRefreshTokenCookie,
} from '../cookie.config';
import { RedisOAuthCodeService } from '../redis-oauth-code.service';
import { PendingTwoFactorService } from '../pending-two-factor.service';

const CODE_PREFIX = 'oauth:integration:code:';
const CODE_TTL_SECONDS = 5 * 60;

export interface IntegrationAuthCodeRecord {
  userId: string;
  email: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

@Injectable()
export class OAuthProviderService {
  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly oauthCodeService: RedisOAuthCodeService,
    private readonly pendingTwoFactorService: PendingTwoFactorService,
  ) {}

  getAuthorizeUrl(baseUrl: string, query: Record<string, string>): string {
    const params = new URLSearchParams(query);
    return `${baseUrl}/api/v1/oauth/authorize?${params.toString()}`;
  }

  getAccountsLoginUrl(authorizeUrl: string): string {
    const accountsBase =
      this.config.get<string>('AUTH_FRONTEND_URL') ||
      this.config.get<string>('ACCOUNTS_URL') ||
      'http://localhost:3005';
    return `${accountsBase.replace(/\/$/, '')}/login?next=${encodeURIComponent(authorizeUrl)}`;
  }

  getApiPublicUrl(fallbackHost: string): string {
    const configured = this.config.get<string>('API_PUBLIC_URL')?.trim();
    if (configured) return configured.replace(/\/$/, '');
    return fallbackHost.replace(/\/$/, '');
  }

  validateAuthorizeRequest(query: {
    client_id?: string;
    redirect_uri?: string;
    response_type?: string;
  }): { clientId: string; redirectUri: string } {
    const clientId = query.client_id?.trim();
    const redirectUri = query.redirect_uri?.trim();
    const responseType = query.response_type?.trim();

    if (!clientId || !redirectUri) {
      throw new BadRequestException('client_id and redirect_uri are required');
    }
    if (responseType && responseType !== 'code') {
      throw new BadRequestException('Unsupported response_type');
    }

    this.assertClient(clientId);
    this.assertRedirectUri(redirectUri);

    return { clientId, redirectUri };
  }

  assertClient(clientId: string, clientSecret?: string): void {
    const expectedId = this.config.get<string>('INTEGRATION_OAUTH_CLIENT_ID');
    const expectedSecret = this.config.get<string>(
      'INTEGRATION_OAUTH_CLIENT_SECRET',
    );

    if (!expectedId || !expectedSecret) {
      throw new BadRequestException('OAuth integration is not configured');
    }
    if (clientId !== expectedId) {
      throw new UnauthorizedException('Invalid client_id');
    }
    if (clientSecret !== undefined && clientSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid client_secret');
    }
  }

  assertRedirectUri(redirectUri: string): void {
    const allowed = this.getAllowedRedirectUris();
    if (!allowed.includes(redirectUri)) {
      throw new BadRequestException('redirect_uri is not allowed');
    }
  }

  parseScopes(scope?: string): string[] {
    if (!scope?.trim()) return ['forms:read'];
    return scope
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async resolveUserFromRequest(req: {
    headers: Record<string, string | string[] | undefined>;
  }): Promise<{ id: string; email: string } | null> {
    const token = extractAccessToken(req as any);
    if (!token) return null;

    try {
      const payload = this.jwtService.verify<{ sub: string; email: string; type?: string }>(
        token,
      );
      if (payload.type !== 'access' || !payload.sub || !payload.email) {
        return null;
      }
      return { id: payload.sub, email: payload.email };
    } catch {
      return null;
    }
  }

  async createAuthorizationCode(
    input: IntegrationAuthCodeRecord,
  ): Promise<string> {
    const code = randomBytes(32).toString('hex');
    await this.redis.set(`${CODE_PREFIX}${code}`, input, CODE_TTL_SECONDS);
    return code;
  }

  async consumeAuthorizationCode(
    code: string,
    clientId: string,
    redirectUri: string,
  ): Promise<IntegrationAuthCodeRecord> {
    const record = await this.redis.get<IntegrationAuthCodeRecord>(
      `${CODE_PREFIX}${code}`,
    );
    await this.redis.del(`${CODE_PREFIX}${code}`);

    if (!record) {
      throw new UnauthorizedException('Invalid or expired authorization code');
    }
    if (record.clientId !== clientId || record.redirectUri !== redirectUri) {
      throw new UnauthorizedException('Authorization code mismatch');
    }

    return record;
  }

  async issueTokens(
    userId: string,
    email: string,
    scopes: string[],
    userAgent?: string,
    ipAddress?: string,
  ) {
    const { tokens } = await this.tokenService.generateTokenPair(
      userId,
      email,
      { userId, userAgent, ipAddress },
    );

    return {
      access_token: tokens.accessToken,
      token_type: 'Bearer',
      expires_in: 30 * 60,
      refresh_token: tokens.refreshToken,
      scope: scopes.join(' '),
    };
  }

  async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    this.assertClient(clientId, clientSecret);

    const tokens = await this.tokenService.refreshTokens(
      refreshToken,
      ipAddress,
      userAgent,
    );

    return {
      access_token: tokens.accessToken,
      token_type: 'Bearer',
      expires_in: 30 * 60,
      refresh_token: tokens.refreshToken,
    };
  }

  /**
   * Browser callback after cross-app login (accounts → API).
   * Exchanges one-time code, sets session cookies, redirects to `next`.
   */
  async completeBrowserCallback(
    code: string,
    next: string | undefined,
    req: Request,
    res: Response,
  ): Promise<void> {
    if (!code?.trim()) {
      throw new BadRequestException('code is required');
    }

    const exchanged = await this.oauthCodeService.exchange(code.trim());
    const accountsBase =
      this.config.get<string>('AUTH_FRONTEND_URL') ||
      this.config.get<string>('ACCOUNTS_URL') ||
      'http://localhost:3005';

    if (exchanged.requiresLinking) {
      res.redirect(
        `${accountsBase.replace(/\/$/, '')}/login?error=linking_required`,
      );
      return;
    }

    if (exchanged.requiresChallenge) {
      const pendingSessionId = await this.pendingTwoFactorService.create(
        exchanged.userId,
        exchanged.email,
      );
      const verify = new URL('/verify-2fa', accountsBase);
      verify.searchParams.set('sessionId', pendingSessionId);
      if (next) {
        verify.searchParams.set('next', this.assertSafeRedirect(next));
      }
      res.redirect(verify.toString());
      return;
    }

    if (exchanged.needsProfileCompletion) {
      const complete = new URL('/complete-profile', accountsBase);
      if (next) {
        complete.searchParams.set('next', this.assertSafeRedirect(next));
      }
      res.redirect(complete.toString());
      return;
    }

    const { tokens } = await this.tokenService.generateTokenPair(
      exchanged.userId,
      exchanged.email,
      {
        userId: exchanged.userId,
        userAgent: exchanged.userAgent || req.headers['user-agent'],
        ipAddress:
          exchanged.ipAddress || req.ip || req.socket?.remoteAddress,
      },
    );

    setAccessTokenCookie(res, tokens.accessToken);
    setRefreshTokenCookie(res, tokens.refreshToken);
    setCsrfTokenCookie(res, generateCsrfToken());

    const fallback = this.getAuthorizeUrl(
      this.getApiPublicUrl(`${req.protocol}://${req.get('host')}`),
      {
        client_id: this.config.get<string>('INTEGRATION_OAUTH_CLIENT_ID') || '',
        redirect_uri:
          this.getAllowedRedirectUris()[0] ||
          'https://www.make.com/oauth/cb/app',
        response_type: 'code',
        scope: 'forms:read',
      },
    );

    const target = next ? this.assertSafeRedirect(next) : fallback;
    res.redirect(target);
  }

  assertSafeRedirect(url: string): string {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname;
      const allowed =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.endsWith('.rukny.io') ||
        hostname === 'rukny.io';

      if (!allowed) {
        throw new BadRequestException('redirect target is not allowed');
      }
      return parsed.toString();
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Invalid redirect target');
    }
  }

  private getAllowedRedirectUris(): string[] {
    const raw =
      this.config.get<string>('INTEGRATION_OAUTH_REDIRECT_URIS') ||
      'https://www.make.com/oauth/cb/app';
    return raw
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);
  }
}
