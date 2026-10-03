import { ExecutionContext } from '@nestjs/common';
import { ThrottlerUserGuard } from './throttler-user.guard';
import * as clientIpUtil from '../utils/client-ip.util';

describe('ThrottlerUserGuard', () => {
  let guard: ThrottlerUserGuard;

  beforeEach(() => {
    guard = new ThrottlerUserGuard({} as any, {} as any, {} as any);
    jest.spyOn(clientIpUtil, 'getClientIp').mockReturnValue('203.0.113.10');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('tracks anonymous users by resolved client IP', async () => {
    const req = {
      headers: { 'x-forwarded-for': '1.2.3.4' },
      user: undefined,
    };

    const tracker = await (guard as any).getTracker(req);
    expect(tracker).toBe('ip:203.0.113.10');
    expect(clientIpUtil.getClientIp).toHaveBeenCalledWith(req);
  });

  it('tracks authenticated users by user id', async () => {
    const req = {
      headers: {},
      user: { id: 'user-123' },
    };

    const tracker = await (guard as any).getTracker(req);
    expect(tracker).toBe('user:user-123');
  });

  it('skips throttling for internal Next.js SSR requests', async () => {
    jest.spyOn(clientIpUtil, 'getClientIp').mockReturnValue('127.0.0.1');

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'user-agent': 'node' },
        }),
      }),
    } as ExecutionContext;

    await expect((guard as any).shouldSkip(context)).resolves.toBe(true);
  });
});
