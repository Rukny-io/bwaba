import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../core/common/guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../../core/common/guards/roles.guard';
import { Roles } from '../../../core/common/decorators/auth/roles.decorator';
import { AuthenticatedUser, CurrentUser } from '../../../core/common/decorators/auth/current-user.decorator';
import { ActivateEmailStarterDto } from './dto/activate-email-starter.dto';
import { EmailBillingService } from './email-billing.service';

@ApiTags('Developer Portal - Email API billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'developer/email/subscription', version: '1' })
export class EmailBillingController {
  constructor(private readonly billing: EmailBillingService) {}

  @Get()
  getSummary(@CurrentUser() user: AuthenticatedUser) { return this.billing.getSummary(user.id); }

  @Post('request')
  requestStarter(@CurrentUser() user: AuthenticatedUser) { return this.billing.requestStarter(user.id); }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/users/:userId/activate')
  activateStarter(@Param('userId') userId: string, @Body() dto: ActivateEmailStarterDto) {
    return this.billing.activateStarter(userId, dto.periodEndsAt ? new Date(dto.periodEndsAt) : undefined);
  }
}
