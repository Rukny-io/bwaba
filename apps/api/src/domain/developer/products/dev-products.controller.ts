import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle } from '@nestjs/throttler';
import { DevProductsService } from './dev-products.service';
import type { DeveloperProductId } from './developer-product-catalog';
import { WorkspaceGuard } from '../../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../../workspace/workspace-context.middleware';

@ApiTags('Developer - Products')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceGuard)
@Controller({ path: 'developer/apps/:appId/products', version: '1' })
export class DevProductsController {
  constructor(private readonly devProducts: DevProductsService) {}

  @Get()
  @SkipThrottle()
  @RequiresWorkspacePermission('developer:products:read')
  @ApiOperation({ summary: 'المنتجات المثبتة على التطبيق' })
  listInstalled(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('appId') appId: string,
  ) {
    return this.devProducts.listInstalled(ws.ownerId, appId);
  }

  @Get(':productId/status')
  @SkipThrottle()
  @RequiresWorkspacePermission('developer:products:read')
  @ApiOperation({ summary: 'هل المنتج مثبّت على التطبيق؟' })
  getStatus(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('appId') appId: string,
    @Param('productId') productId: DeveloperProductId,
  ) {
    return this.devProducts
      .isInstalled(ws.ownerId, appId, productId)
      .then((installed) => ({ installed }));
  }

  @Post(':productId/install')
  @RequiresWorkspacePermission('developer:products:write')
  @ApiOperation({ summary: 'تثبيت منتج على التطبيق (دائم)' })
  install(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('appId') appId: string,
    @Param('productId') productId: string,
  ) {
    return this.devProducts.install(ws.ownerId, appId, productId);
  }
}
