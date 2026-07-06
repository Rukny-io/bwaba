import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SkipThrottle } from '@nestjs/throttler';
import { CurrentUser } from '../../../core/common/decorators/auth/current-user.decorator';
import { DevProductsService } from './dev-products.service';
import type { DeveloperProductId } from './developer-product-catalog';

@ApiTags('Developer - Products')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'developer/apps/:appId/products', version: '1' })
export class DevProductsController {
  constructor(private readonly devProducts: DevProductsService) {}

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'المنتجات المثبتة على التطبيق' })
  listInstalled(
    @CurrentUser('id') userId: string,
    @Param('appId') appId: string,
  ) {
    return this.devProducts.listInstalled(userId, appId);
  }

  @Get(':productId/status')
  @SkipThrottle()
  @ApiOperation({ summary: 'هل المنتج مثبّت على التطبيق؟' })
  getStatus(
    @CurrentUser('id') userId: string,
    @Param('appId') appId: string,
    @Param('productId') productId: DeveloperProductId,
  ) {
    return this.devProducts
      .isInstalled(userId, appId, productId)
      .then((installed) => ({ installed }));
  }

  @Post(':productId/install')
  @ApiOperation({ summary: 'تثبيت منتج على التطبيق (دائم)' })
  install(
    @CurrentUser('id') userId: string,
    @Param('appId') appId: string,
    @Param('productId') productId: string,
  ) {
    return this.devProducts.install(userId, appId, productId);
  }
}
