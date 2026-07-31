import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle } from '@nestjs/throttler';
import { DevFormsService } from './dev-forms.service';
import { LinkFormToAppDto, UpdateEmbedOriginsDto } from './dto/dev-forms.dto';
import { WorkspaceGuard } from '../../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../../workspace/workspace-context.middleware';

@ApiTags('Developer - Forms')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceGuard)
@Controller({ path: 'developer/forms', version: '1' })
export class DevFormsController {
  constructor(private readonly devForms: DevFormsService) {}

  @Get('summary')
  @SkipThrottle()
  @RequiresWorkspacePermission('developer:forms:read')
  @ApiOperation({ summary: 'ملخص نماذج مرتبطة بتطبيق المطوّر' })
  getSummary(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query('appId') appId: string,
  ) {
    return this.devForms.getSummary(ws.ownerId, appId);
  }

  @Get()
  @SkipThrottle()
  @RequiresWorkspacePermission('developer:forms:read')
  @ApiOperation({ summary: 'النماذج المرتبطة بالتطبيق' })
  listLinked(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query('appId') appId: string,
  ) {
    return this.devForms.listLinked(ws.ownerId, appId);
  }

  @Get('available')
  @SkipThrottle()
  @RequiresWorkspacePermission('developer:forms:read')
  @ApiOperation({ summary: 'نماذج المستخدم المتاحة للربط' })
  listAvailable(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query('appId') appId: string,
  ) {
    return this.devForms.listAvailableToLink(ws.ownerId, appId);
  }

  @Get(':formId')
  @SkipThrottle()
  @RequiresWorkspacePermission('developer:forms:read')
  @ApiOperation({ summary: 'تفاصيل نموذج مرتبط + إعدادات العرض' })
  getLinkedForm(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query('appId') appId: string,
    @Param('formId') formId: string,
  ) {
    return this.devForms.getLinkedForm(ws.ownerId, appId, formId);
  }

  @Post('link')
  @RequiresWorkspacePermission('developer:forms:write')
  @ApiOperation({ summary: 'ربط نموذج بتطبيق المطوّر' })
  linkForm(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() dto: LinkFormToAppDto,
  ) {
    return this.devForms.linkForm(ws.ownerId, dto.appId, dto.formId);
  }

  @Delete(':formId/link')
  @RequiresWorkspacePermission('developer:forms:write')
  @ApiOperation({ summary: 'إلغاء ربط نموذج من التطبيق' })
  unlinkForm(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query('appId') appId: string,
    @Param('formId') formId: string,
  ) {
    return this.devForms.unlinkForm(ws.ownerId, appId, formId);
  }

  @Patch('embed-origins')
  @RequiresWorkspacePermission('developer:forms:write')
  @ApiOperation({ summary: 'تحديث النطاقات المسموح بها لتضمين النماذج' })
  updateEmbedOrigins(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() dto: UpdateEmbedOriginsDto,
  ) {
    return this.devForms.updateEmbedOrigins(
      ws.ownerId,
      dto.appId,
      dto.allowedOrigins,
    );
  }
}
