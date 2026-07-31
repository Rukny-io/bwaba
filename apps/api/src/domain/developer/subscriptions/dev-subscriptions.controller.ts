import { Controller, Get, Post, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DevSubscriptionsService } from './dev-subscriptions.service';
import { UpgradePlanDto } from './dto/upgrade-plan.dto';
import { WorkspaceGuard } from '../../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../../workspace/workspace-context.middleware';

@ApiTags('Developer - Subscription')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceGuard)
@Controller({ path: 'developer/subscription', version: '1' })
export class DevSubscriptionsController {
  constructor(private readonly subscriptionsService: DevSubscriptionsService) {}

  @Get()
  @RequiresWorkspacePermission('developer:subscription:read')
  @ApiOperation({ summary: 'اشتراكي الحالي' })
  getSubscription(@ActiveWorkspace() ws: WorkspaceContext) {
    return this.subscriptionsService.getSubscription(ws.ownerId);
  }

  @Get('plans')
  @ApiOperation({ summary: 'الخطط المتاحة' })
  getPlans() {
    return this.subscriptionsService.getAvailablePlans();
  }

  @Post('upgrade')
  @ApiOperation({ summary: 'ترقية الخطة (مالك الحساب فقط)' })
  upgradePlan(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() dto: UpgradePlanDto,
  ) {
    if (!ws.isOwner) {
      throw new ForbiddenException({
        message: 'ترقية الاشتراك تقتصر على مالك الحساب',
        code: 'OWNER_ONLY',
      });
    }
    return this.subscriptionsService.upgradePlan(ws.ownerId, dto);
  }
}
