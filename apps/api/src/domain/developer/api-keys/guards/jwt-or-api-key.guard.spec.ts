import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtOrApiKeyGuard } from './jwt-or-api-key.guard';
import { ApiKeysService } from '../api-keys.service';
import { PrismaService } from '../../../../core/database/prisma/prisma.service';

describe('JwtOrApiKeyGuard', () => {
  const apiKeysService = {
    validateKey: jest.fn(),
  } as unknown as ApiKeysService;

  const reflector = {
    get: jest.fn(),
  } as unknown as Reflector;

  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;

  let guard: JwtOrApiKeyGuard;

  const createContext = (headers: Record<string, string>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
          ip: '127.0.0.1',
        }),
      }),
      getHandler: () => ({}),
    }) as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtOrApiKeyGuard(apiKeysService, reflector, prisma);
  });

  it('authenticates valid API key and checks scopes', async () => {
    (apiKeysService.validateKey as jest.Mock).mockResolvedValue({
      id: 'key-1',
      userId: 'user-1',
      scopes: ['forms:read'],
      ipAllowlist: [],
    });
    (reflector.get as jest.Mock).mockReturnValue(['forms:read']);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'USER',
      phone: null,
      bannerUrls: [],
      profileCompleted: true,
      profile: { name: 'User', username: 'user', avatar: null, bio: null },
      subscription: null,
    });

    const request = {
      headers: { authorization: 'Bearer rk_live_abc123' },
      ip: '127.0.0.1',
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
    } as ExecutionContext;

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(request).toHaveProperty('user.id', 'user-1');
  });

  it('rejects API key without required scope', async () => {
    (apiKeysService.validateKey as jest.Mock).mockResolvedValue({
      id: 'key-1',
      userId: 'user-1',
      scopes: ['forms:read'],
      ipAllowlist: [],
    });
    (reflector.get as jest.Mock).mockReturnValue(['forms:write']);

    const context = createContext({
      'x-api-key': 'rk_test_secret',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('rejects invalid API key', async () => {
    (apiKeysService.validateKey as jest.Mock).mockResolvedValue(null);
    (reflector.get as jest.Mock).mockReturnValue(['forms:read']);

    const context = createContext({
      authorization: 'Bearer rk_live_invalid',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('accepts API key in Authorization without Bearer prefix', async () => {
    (apiKeysService.validateKey as jest.Mock).mockResolvedValue({
      id: 'key-1',
      userId: 'user-1',
      scopes: ['forms:read'],
      ipAllowlist: [],
    });
    (reflector.get as jest.Mock).mockReturnValue(['forms:read']);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      role: 'USER',
      phone: null,
      bannerUrls: [],
      profileCompleted: true,
      profile: { name: 'User', username: 'user', avatar: null, bio: null },
      subscription: null,
    });

    const request = {
      headers: { authorization: 'rk_live_abc123' },
      ip: '127.0.0.1',
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
    } as ExecutionContext;

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(request).toHaveProperty('user.id', 'user-1');
  });
});
