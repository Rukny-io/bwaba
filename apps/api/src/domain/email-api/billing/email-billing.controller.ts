import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../core/common/guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../../core/common/guards/roles.guard';
import { Roles } from '../../../core/common/decorators/auth/roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../core/common/decorators/auth/current-user.decorator';
import { ActivateEmailPlanDto } from './dto/activate-email-plan.dto';
import { ActivateEmailMarketingPlanDto } from './dto/activate-email-marketing-plan.dto';
import { EmailBillingService } from './email-billing.service';

@ApiTags('Developer Portal - Email API billing')
@ApiBearerAuth()
@Controller({ path: 'developer/email', version: '1' })
export class EmailBillingController {
  constructor(private readonly billing: EmailBillingService) {}

  @Get('plans')
  getPlans() {
    return this.billing.getPlans();
  }

  /** @deprecated Use GET developer/apps/:appId/email/subscription */
  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  getSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.billing.getSummaryLegacy(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscription/marketing/request')
  requestMarketingPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ActivateEmailMarketingPlanDto,
  ) {
    return this.billing.requestMarketingPlan(user.id, dto.plan);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscription/enterprise/request')
  requestEnterprise(@CurrentUser() user: AuthenticatedUser) {
    return this.billing.requestEnterprise(user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('subscription/admin/users/:userId/activate')
  async activatePlan(
    @Param('userId') userId: string,
    @Body() dto: ActivateEmailPlanDto,
  ) {
    if (dto.publicAppId) {
      return this.billing.activatePlanByPublicAppId(
        userId,
        dto.publicAppId,
        dto.plan,
        dto.periodEndsAt ? new Date(dto.periodEndsAt) : undefined,
        dto.enterpriseMonthlyQuota,
      );
    }
    const developerAppId =
      await this.billing.resolveDefaultDeveloperAppId(userId);
    return this.billing.activatePlan(
      userId,
      developerAppId,
      dto.plan,
      dto.periodEndsAt ? new Date(dto.periodEndsAt) : undefined,
      dto.enterpriseMonthlyQuota,
    );
  }
}
