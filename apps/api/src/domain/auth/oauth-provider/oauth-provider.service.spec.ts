import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuthProviderService } from './oauth-provider.service';
import { RedisService } from '../../../core/cache/redis.service';
import { TokenService } from '../token.service';

describe('OAuthProviderService', () => {
  const config = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        INTEGRATION_OAUTH_CLIENT_ID: 'make-client',
        INTEGRATION_OAUTH_CLIENT_SECRET: 'make-secret',
        INTEGRATION_OAUTH_REDIRECT_URIS: 'https://www.make.com/oauth/cb/app',
        API_PUBLIC_URL: 'https://api.rukny.io',
        AUTH_FRONTEND_URL: 'https://accounts.rukny.io',
      };
      return values[key];
    }),
  } as unknown as ConfigService;

  const redis = {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  } as unknown as RedisService;

  const jwtService = {} as JwtService;
  const tokenService = {} as TokenService;
  const oauthCodeService = {} as import('../redis-oauth-code.service').RedisOAuthCodeService;
  const pendingTwoFactorService = {} as import('../pending-two-factor.service').PendingTwoFactorService;

  let service: OAuthProviderService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OAuthProviderService(
      config,
      redis,
      jwtService,
      tokenService,
      oauthCodeService,
      pendingTwoFactorService,
    );
  });

  it('defaults scopes to forms:read', () => {
    expect(service.parseScopes(undefined)).toEqual(['forms:read']);
    expect(service.parseScopes('')).toEqual(['forms:read']);
  });

  it('parses comma-separated scopes', () => {
    expect(service.parseScopes('forms:read,forms:write')).toEqual([
      'forms:read',
      'forms:write',
    ]);
  });

  it('validates authorize request', () => {
    const result = service.validateAuthorizeRequest({
      client_id: 'make-client',
      redirect_uri: 'https://www.make.com/oauth/cb/app',
      response_type: 'code',
    });
    expect(result.clientId).toBe('make-client');
    expect(result.redirectUri).toBe('https://www.make.com/oauth/cb/app');
  });

  it('rejects unknown redirect_uri', () => {
    expect(() =>
      service.assertRedirectUri('https://evil.example/callback'),
    ).toThrow(BadRequestException);
  });

  it('rejects invalid client credentials', () => {
    expect(() => service.assertClient('wrong-id')).toThrow(
      UnauthorizedException,
    );
    expect(() => service.assertClient('make-client', 'wrong-secret')).toThrow(
      UnauthorizedException,
    );
  });

  it('builds accounts login URL with next param', () => {
    const url = service.getAccountsLoginUrl(
      'https://api.rukny.io/api/v1/oauth/authorize?client_id=x',
    );
    expect(url).toContain('https://accounts.rukny.io/login?next=');
    expect(decodeURIComponent(url.split('next=')[1])).toContain(
      '/oauth/authorize',
    );
  });
});
