import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DevWebhooksService } from './dev-webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { WorkspaceGuard } from '../../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../../workspace/workspace-context.middleware';

@ApiTags('Developer - Webhooks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceGuard)
@Controller({ path: 'developer/webhooks', version: '1' })
export class DevWebhooksController {
  constructor(private readonly webhooksService: DevWebhooksService) {}

  @Post()
  @RequiresWorkspacePermission('developer:webhooks:write')
  @ApiOperation({ summary: 'إنشاء webhook' })
  create(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.webhooksService.create(ws.ownerId, dto);
  }

  @Get()
  @RequiresWorkspacePermission('developer:webhooks:read')
  @ApiOperation({ summary: 'قائمة webhooks' })
  findAll(@ActiveWorkspace() ws: WorkspaceContext) {
    return this.webhooksService.findAll(ws.ownerId);
  }

  @Patch(':id')
  @RequiresWorkspacePermission('developer:webhooks:write')
  @ApiOperation({ summary: 'تحديث webhook' })
  update(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhooksService.update(ws.ownerId, id, dto);
  }

  @Delete(':id')
  @RequiresWorkspacePermission('developer:webhooks:write')
  @ApiOperation({ summary: 'حذف webhook' })
  remove(@ActiveWorkspace() ws: WorkspaceContext, @Param('id') id: string) {
    return this.webhooksService.remove(ws.ownerId, id);
  }

  @Post(':id/test')
  @RequiresWorkspacePermission('developer:webhooks:write')
  @ApiOperation({ summary: 'اختبار webhook بحدث تجريبي' })
  test(@ActiveWorkspace() ws: WorkspaceContext, @Param('id') id: string) {
    return this.webhooksService.test(ws.ownerId, id);
  }

  @Post(':id/rotate-secret')
  @RequiresWorkspacePermission('developer:webhooks:write')
  @ApiOperation({ summary: 'تدوير المفتاح السري' })
  rotateSecret(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    return this.webhooksService.rotateSecret(ws.ownerId, id);
  }
}
