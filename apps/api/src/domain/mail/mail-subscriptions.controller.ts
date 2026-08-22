import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../core/common/guards/roles.guard';
import { Roles } from '../../core/common/decorators/auth/roles.decorator';
import { Public } from '../../core/common/decorators/auth/public.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import { MailSubscriptionsService } from './mail-subscriptions.service';
import {
  AdminActivateMailSubscriptionDto,
  RequestMailSubscriptionDto,
} from './dto/mail-subscription.dto';

@ApiTags('Mail - Subscription')
@Controller({ path: 'mail', version: '1' })
export class MailSubscriptionsController {
  constructor(private readonly mailSubscriptions: MailSubscriptionsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Mail pricing plans (IQD)' })
  getPlans() {
    return this.mailSubscriptions.getPlansOverview();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('apps/:appId/subscription')
  @ApiOperation({
    summary: 'Mail subscription for this app only (not shared across apps)',
  })
  getSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.mailSubscriptions.getOwnedAppSubscription(user.id, appId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('apps/:appId/subscription/request')
  @ApiOperation({
    summary:
      'Open a billing support ticket so an admin can activate this app’s plan',
  })
  requestPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: RequestMailSubscriptionDto,
  ) {
    return this.mailSubscriptions.requestPlan(
      user.id,
      appId,
      dto.plan,
      dto.mailboxCount,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/users/:userId/apps')
  @ApiOperation({ summary: 'Admin: list Mail apps and per-app subscriptions' })
  adminListUserApps(@Param('userId') userId: string) {
    return this.mailSubscriptions.adminListUserApps(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/apps/:appId/subscription')
  @ApiOperation({
    summary: 'Admin: activate Mail plan + seats + storage for one app',
  })
  adminActivate(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: AdminActivateMailSubscriptionDto,
  ) {
    return this.mailSubscriptions.adminActivateForApp(
      admin.id,
      appId,
      dto.plan,
      dto.mailboxCount,
      dto.billingCycle,
      dto.ticketId,
    );
  }
}
