import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DeveloperEmailPlan } from '@prisma/client';
import { JwtAuthGuard } from '../../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../core/common/decorators/auth/current-user.decorator';
import { PurchaseEmailOverageDto } from './dto/purchase-email-overage.dto';
import { RequestEmailPlanDto } from './dto/request-email-plan.dto';
import { UpdateEmailAddonsDto } from './dto/update-email-addons.dto';
import { EmailBillingService } from './email-billing.service';

@ApiTags('Developer Portal - Email API billing (per app)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'developer/apps/:appId/email', version: '1' })
export class EmailAppBillingController {
  constructor(private readonly billing: EmailBillingService) {}

  @Get('subscription')
  getSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.billing.getSummary(user.id, appId);
  }

  @Post('subscription/request')
  requestPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: RequestEmailPlanDto,
  ) {
    return this.billing.requestPlan(user.id, appId, dto.plan);
  }

  @Post('subscription/overage/purchase')
  purchaseOverage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: PurchaseEmailOverageDto,
  ) {
    return this.billing.purchaseOverage(user.id, appId, dto.packs);
  }

  @Post('subscription/addons')
  updateAddons(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: UpdateEmailAddonsDto,
  ) {
    return this.billing.updateAddons(user.id, appId, dto);
  }
}
