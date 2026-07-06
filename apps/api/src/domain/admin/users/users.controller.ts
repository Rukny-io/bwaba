import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/common/guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../../core/common/guards/roles.guard';
import { Roles } from '../../../core/common/decorators/auth/roles.decorator';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('stats')
  getStats() {
    return this.usersService.getStats();
  }

  @Get('export')
  exportUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('emailVerified') emailVerified?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('verificationLevel') verificationLevel?: string,
    @Query('isRuknyVerified') isRuknyVerified?: string,
    @Query('twoFactorEnabled') twoFactorEnabled?: string,
    @Query('phoneVerified') phoneVerified?: string,
    @Query('isDeactivated') isDeactivated?: string,
  ) {
    return this.usersService.exportUsers({
      search,
      role,
      emailVerified,
      startDate,
      endDate,
      verificationLevel,
      isRuknyVerified,
      twoFactorEnabled,
      phoneVerified,
      isDeactivated,
    });
  }

  @Get()
  getUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('emailVerified') emailVerified?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('verificationLevel') verificationLevel?: string,
    @Query('isRuknyVerified') isRuknyVerified?: string,
    @Query('twoFactorEnabled') twoFactorEnabled?: string,
    @Query('phoneVerified') phoneVerified?: string,
    @Query('isDeactivated') isDeactivated?: string,
  ) {
    return this.usersService.getUsers({
      page,
      limit: Math.min(limit, 100),
      search,
      role,
      emailVerified,
      startDate,
      endDate,
      verificationLevel,
      isRuknyVerified,
      twoFactorEnabled,
      phoneVerified,
      isDeactivated,
    });
  }

  @Get(':id/notes')
  getUserNotes(@Param('id') id: string) {
    return this.usersService.getUserAdminNotes(id);
  }

  @Post(':id/notes')
  addUserNote(
    @Param('id') id: string,
    @Body('note') note: string,
    @Req() req: { user?: { id: string } },
  ) {
    return this.usersService.addUserAdminNote(
      id,
      req.user?.id ?? 'admin',
      note,
    );
  }

  @Get(':id/admin-activity')
  getUserAdminActivity(@Param('id') id: string) {
    return this.usersService.getUserAdminActivity(id);
  }

  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Get(':id/lockout')
  getUserLockout(@Param('id') id: string) {
    return this.usersService.getUserLockoutStatus(id);
  }

  @Post(':id/notify')
  sendNotification(
    @Param('id') id: string,
    @Body()
    body: {
      title: string;
      message: string;
      channels?: { inApp?: boolean; email?: boolean; whatsapp?: boolean };
    },
    @Req() req: { user?: { id: string } },
  ) {
    return this.usersService.sendUserNotification(
      id,
      body.title,
      body.message,
      req.user?.id ?? 'admin',
      body.channels,
    );
  }

  @Post(':id/unlock')
  unlockAccount(
    @Param('id') id: string,
    @Req() req: { user?: { id: string } },
  ) {
    return this.usersService.unlockUserAccount(id, req.user?.id ?? 'admin');
  }

  @Patch(':id/deactivate')
  deactivateUser(
    @Param('id') id: string,
    @Body('reason') reason: string | undefined,
    @Req() req: { user?: { id: string } },
  ) {
    if (req.user?.id === id) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }
    return this.usersService.deactivateUser(
      id,
      req.user?.id ?? 'admin',
      reason,
    );
  }

  @Patch(':id/reactivate')
  reactivateUser(
    @Param('id') id: string,
    @Req() req: { user?: { id: string } },
  ) {
    return this.usersService.reactivateUser(id, req.user?.id ?? 'admin');
  }

  @Patch(':id/role')
  updateRole(
    @Param('id') id: string,
    @Body('role') role: string,
    @Req() req: { user?: { id: string } },
  ) {
    if (req.user?.id === id) {
      throw new ForbiddenException('You cannot change your own role');
    }
    return this.usersService.updateUserRole(id, role, req.user?.id);
  }

  @Delete(':id/sessions')
  deleteSessions(
    @Param('id') id: string,
    @Req() req: { user?: { id: string } },
  ) {
    return this.usersService.deleteUserSessions(id, req.user?.id);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string, @Req() req: { user?: { id: string } }) {
    if (req.user?.id === id) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    return this.usersService.deleteUser(id);
  }
}
