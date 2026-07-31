import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UnauthorizedException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../../core/common/decorators/auth/current-user.decorator';
import { ApiKeysService } from './api-keys.service';
import { TwoFactorService } from '../../auth/two-factor.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { WorkspaceGuard } from '../../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../../workspace/workspace-context.middleware';

@ApiTags('Developer - API Keys')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceGuard)
@Controller({ path: 'developer/api-keys', version: '1' })
export class ApiKeysController {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  @Post()
  @RequiresWorkspacePermission('developer:api-keys:write')
  @ApiOperation({ summary: 'إنشاء مفتاح API جديد' })
  create(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.create(ws.ownerId, dto);
  }

  @Get()
  @RequiresWorkspacePermission('developer:api-keys:read')
  @ApiOperation({ summary: 'قائمة مفاتيح API' })
  findAll(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query('developerAppId') developerAppId?: string,
  ) {
    return this.apiKeysService.findAll(ws.ownerId, developerAppId);
  }

  @Patch(':slug')
  @RequiresWorkspacePermission('developer:api-keys:write')
  @ApiOperation({ summary: 'تحديث مفتاح API' })
  update(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('slug') keySlug: string,
    @Body() dto: UpdateApiKeyDto,
  ) {
    return this.apiKeysService.update(ws.ownerId, keySlug, dto);
  }

  @Delete(':slug')
  @RequiresWorkspacePermission('developer:api-keys:write')
  @ApiOperation({ summary: 'إلغاء مفتاح API' })
  revoke(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('slug') keySlug: string,
  ) {
    return this.apiKeysService.revoke(ws.ownerId, keySlug);
  }

  @Post(':slug/reveal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'كشف مفتاح API الكامل (يتطلب 2FA - مالك الحساب فقط)',
  })
  async revealKey(
    @ActiveWorkspace() ws: WorkspaceContext,
    @CurrentUser('id') actorId: string,
    @Param('slug') keySlug: string,
    @Body() body: { token: string },
  ) {
    // الكشف عن المفتاح حساس: يقتصر على المالك ويتطلب 2FA على حساب المالك.
    if (!ws.isOwner) {
      throw new ForbiddenException({
        message: 'كشف المفتاح يقتصر على مالك الحساب',
        code: 'OWNER_ONLY',
      });
    }

    if (!body.token || body.token.length < 6) {
      throw new UnauthorizedException('رمز التحقق مطلوب');
    }

    const status = await this.twoFactorService.getStatus(actorId);
    if (!status.enabled) {
      throw new ForbiddenException('يجب تفعيل التحقق الثنائي أولاً');
    }

    const result = await this.twoFactorService.verifyToken(actorId, body.token);
    if (!result.valid) {
      throw new UnauthorizedException('رمز التحقق غير صحيح');
    }

    return this.apiKeysService.revealKey(ws.ownerId, keySlug);
  }
}
