import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../core/common/guards/auth/jwt-auth.guard';
import { RolesGuard, ROLES_KEY } from '../../../core/common/guards/roles.guard';
import { AdminMailController } from './admin-mail.controller';

describe('AdminMailController authorization', () => {
  it('protects every domain decision route with JWT and ADMIN role guards', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, AdminMailController);
    const roles = Reflect.getMetadata(ROLES_KEY, AdminMailController);

    expect(guards).toEqual(expect.arrayContaining([JwtAuthGuard, RolesGuard]));
    expect(roles).toEqual([Role.ADMIN]);
  });
});
