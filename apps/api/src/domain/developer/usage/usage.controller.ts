import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsageService } from './usage.service';
import { WorkspaceGuard } from '../../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../../workspace/workspace-context.middleware';

@ApiTags('Developer - Usage')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceGuard)
@Controller({ path: 'developer/usage', version: '1' })
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get()
  @RequiresWorkspacePermission('developer:usage:read')
  @ApiOperation({ summary: 'ملخص الاستخدام' })
  getUsageSummary(@ActiveWorkspace() ws: WorkspaceContext) {
    return this.usageService.getUsageSummary(ws.ownerId);
  }

  @Get('daily')
  @RequiresWorkspacePermission('developer:usage:read')
  @ApiOperation({ summary: 'الاستخدام اليومي' })
  getDailyUsage(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query('days') days?: string,
  ) {
    return this.usageService.getDailyUsage(
      ws.ownerId,
      days ? parseInt(days, 10) : 30,
    );
  }

  @Get('messages')
  @RequiresWorkspacePermission('developer:usage:read')
  @ApiOperation({ summary: 'تفاصيل الرسائل' })
  getMessageLogs(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query('status') status?: string,
    @Query('direction') direction?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('phoneId') phoneId?: string,
  ) {
    return this.usageService.getMessageLogs(ws.ownerId, {
      status,
      direction,
      type,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      from,
      to,
      phoneId,
    });
  }
}
