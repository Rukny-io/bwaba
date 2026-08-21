import {
  Body,
  Controller,
  Delete,
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
  AdminSetMailPlanDto,
  UpsertMailSubscriptionDto,
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
  @Get('subscription')
  @ApiOperation({ summary: 'Current Mail subscription for the signed-in user' })
  getSubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.mailSubscriptions.getSubscription(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('subscription')
  @ApiOperation({
    summary:
      'Activate or change Mail plan (manual activation until payment gateway)',
  })
  upsertSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertMailSubscriptionDto,
  ) {
    return this.mailSubscriptions.upsertSubscription(
      user.id,
      dto.plan,
      dto.mailboxCount ?? 1,
      dto.billingCycle,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('subscription')
  @ApiOperation({ summary: 'Cancel Mail subscription' })
  cancelSubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.mailSubscriptions.cancelSubscription(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('subscription/admin/:userId')
  @ApiOperation({ summary: 'Admin: set Mail plan for a user' })
  adminSetPlan(
    @Param('userId') userId: string,
    @Body() dto: AdminSetMailPlanDto,
  ) {
    return this.mailSubscriptions.adminSetPlan(
      userId,
      dto.plan,
      dto.mailboxCount ?? 1,
      dto.billingCycle,
    );
  }
}
