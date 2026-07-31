import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ForbiddenException } from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpdateStoreAnalyticsDto } from './dto/update-store-analytics.dto';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../workspace/workspace-context.middleware';

@ApiTags('Stores')
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a new store (owner only)' })
  @ApiResponse({ status: 201, description: 'Store created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() createStoreDto: CreateStoreDto,
  ) {
    if (!ws.isOwner) {
      throw new ForbiddenException({
        message: 'إنشاء المتجر يقتصر على مالك الحساب',
        code: 'OWNER_ONLY',
      });
    }
    return this.storesService.create(ws.ownerId, createStoreDto);
  }

  @Get('my-store')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:settings:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my store' })
  getMyStore(@ActiveWorkspace() ws: WorkspaceContext) {
    return this.storesService.getMyStore(ws.ownerId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:analytics:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get store statistics' })
  getStoreStats(@ActiveWorkspace() ws: WorkspaceContext) {
    return this.storesService.getStoreStats(ws.ownerId);
  }

  @Get('stats/weekly-sales')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:analytics:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get weekly sales data for charts' })
  getWeeklySales(@ActiveWorkspace() ws: WorkspaceContext) {
    return this.storesService.getWeeklySales(ws.ownerId);
  }

  @Get('check-slug/:slug')
  @ApiOperation({ summary: 'Check if store slug is available' })
  @ApiResponse({ status: 200, description: 'Slug is taken' })
  @ApiResponse({ status: 404, description: 'Slug is available' })
  async checkSlugAvailability(@Param('slug') slug: string) {
    return this.storesService.checkSlugAvailability(slug);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get store categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  getStoreCategories() {
    return this.storesService.getStoreCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store by ID' })
  @ApiResponse({ status: 200, description: 'Store retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  findOne(@Param('id') id: string) {
    return this.storesService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get store by slug' })
  @ApiResponse({ status: 200, description: 'Store retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.storesService.findBySlug(slug);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:settings:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a store' })
  update(
    @Param('id') id: string,
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() updateStoreDto: UpdateStoreDto,
  ) {
    return this.storesService.update(id, ws.ownerId, updateStoreDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a store (owner only)' })
  remove(@Param('id') id: string, @ActiveWorkspace() ws: WorkspaceContext) {
    if (!ws.isOwner) {
      throw new ForbiddenException({
        message: 'حذف المتجر يقتصر على مالك الحساب',
        code: 'OWNER_ONLY',
      });
    }
    return this.storesService.remove(id, ws.ownerId);
  }

  @Get('my-store/analytics')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:analytics:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get store analytics settings' })
  getAnalyticsSettings(@ActiveWorkspace() ws: WorkspaceContext) {
    return this.storesService.getAnalyticsSettings(ws.ownerId);
  }

  @Patch('my-store/analytics')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:settings:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update store analytics settings' })
  updateAnalyticsSettings(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() dto: UpdateStoreAnalyticsDto,
  ) {
    return this.storesService.updateAnalyticsSettings(
      ws.ownerId,
      dto.googleAnalyticsId,
    );
  }

  /**
   * 🛍️ الحصول على منتجات المستخدم حسب username
   * Public endpoint - لا يحتاج تسجيل دخول
   */
  @Get(':username/products')
  @ApiOperation({ summary: 'Get products by username' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  getProductsByUsername(
    @Param('username') username: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.storesService.getProductsByUsername(username, {
      limit: limit ? Number(limit) : 12,
      page: page ? Number(page) : 1,
      categoryId,
      search,
    });
  }

  /**
   * 📂 الحصول على فئات منتجات المستخدم
   */
  @Get(':username/categories')
  @ApiOperation({ summary: 'Get product categories by username' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  getCategoriesByUsername(@Param('username') username: string) {
    return this.storesService.getCategoriesByUsername(username);
  }
}
