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
import { ActivateEmailStarterDto } from './dto/activate-email-starter.dto';
import { ActivateEmailMarketingPlanDto } from './dto/activate-email-marketing-plan.dto';
import { PurchaseEmailOverageDto } from './dto/purchase-email-overage.dto';
import { RequestEmailPlanDto } from './dto/request-email-plan.dto';
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

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  getSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.billing.getSummary(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscription/request')
  requestPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestEmailPlanDto,
  ) {
    return this.billing.requestPlan(user.id, dto.plan);
  }

  /** @deprecated Use POST subscription/request with plan PRO_10K */
  @UseGuards(JwtAuthGuard)
  @Post('subscription/request-starter')
  requestStarter(@CurrentUser() user: AuthenticatedUser) {
    return this.billing.requestStarter(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscription/overage/purchase')
  purchaseOverage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PurchaseEmailOverageDto,
  ) {
    return this.billing.purchaseOverage(user.id, dto.packs);
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
  activatePlan(
    @Param('userId') userId: string,
    @Body() dto: ActivateEmailPlanDto,
  ) {
    return this.billing.activatePlan(
      userId,
      dto.plan,
      dto.periodEndsAt ? new Date(dto.periodEndsAt) : undefined,
      dto.enterpriseMonthlyQuota,
    );
  }

  /** @deprecated Use admin activate with plan PRO_10K */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('subscription/admin/users/:userId/activate-starter')
  activateStarter(
    @Param('userId') userId: string,
    @Body() dto: ActivateEmailStarterDto,
  ) {
    return this.billing.activateStarter(
      userId,
      dto.periodEndsAt ? new Date(dto.periodEndsAt) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('subscription/admin/users/:userId/marketing/activate')
  activateMarketingPlan(
    @Param('userId') userId: string,
    @Body() dto: ActivateEmailMarketingPlanDto,
  ) {
    return this.billing.activateMarketingPlan(userId, dto.plan);
  }
}
