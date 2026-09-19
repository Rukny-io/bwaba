import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { RolesGuard, ROLES_KEY } from '../../core/common/guards/roles.guard';
import { RateLimitingController } from './rate-limiting.controller';

describe('RateLimitingController authorization', () => {
  it('protects every route with JWT and ADMIN role guards', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, RateLimitingController);
    const roles = Reflect.getMetadata(ROLES_KEY, RateLimitingController);

    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
    expect(roles).toEqual([Role.ADMIN]);
  });
});
