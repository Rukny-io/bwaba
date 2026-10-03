import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GlobalJwtAuthGuard } from './global-jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../../decorators/auth/public.decorator';

describe('GlobalJwtAuthGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  let guard: GlobalJwtAuthGuard;

  const createContext = (url = '/api/v1/forms') =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          originalUrl: url,
          url,
        }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new GlobalJwtAuthGuard(reflector);
    delete process.env.GLOBAL_AUTH_MODE;
  });

  afterEach(() => {
    delete process.env.GLOBAL_AUTH_MODE;
    delete process.env.NODE_ENV;
  });

  it('allows @Public() routes without invoking passport', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockImplementation((key) =>
      key === IS_PUBLIC_KEY ? true : undefined,
    );

    const activateSpy = jest
      .spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      )
      .mockResolvedValue(false);

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
    expect(activateSpy).not.toHaveBeenCalled();
    activateSpy.mockRestore();
  });

  it('blocks unauthenticated requests in enforce mode', async () => {
    process.env.GLOBAL_AUTH_MODE = 'enforce';
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

    jest
      .spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      )
      .mockRejectedValue(new UnauthorizedException());

    await expect(guard.canActivate(createContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('allows unauthenticated requests in report mode', async () => {
    process.env.GLOBAL_AUTH_MODE = 'report';
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);

    jest
      .spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      )
      .mockRejectedValue(new UnauthorizedException());

    await expect(guard.canActivate(createContext('/api/v1/private'))).resolves.toBe(
      true,
    );
  });

  it('defaults to enforce mode in production', () => {
    process.env.NODE_ENV = 'production';
    const prodGuard = new GlobalJwtAuthGuard(reflector);
    expect((prodGuard as any).mode).toBe('enforce');
  });
});
