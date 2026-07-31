import {
  Controller,
  Get,
  Post,
  Put,
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
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ProductCategoriesService } from './product-categories.service';
import {
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
  ReorderCategoriesDto,
  ProductCategoryResponseDto,
} from './dto/product-category.dto';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { PlanGuard } from '../../core/common/guards/plan.guard';
import { CheckLimit } from '../../core/common/decorators/auth/plan.decorator';
import { WorkspaceGuard } from '../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../workspace/workspace-context.middleware';

@ApiTags('Product Categories')
@Controller('stores/my-store/categories')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@ApiBearerAuth()
export class ProductCategoriesController {
  constructor(private readonly categoriesService: ProductCategoriesService) {}

  @Post()
  @UseGuards(PlanGuard)
  @RequiresWorkspacePermission('store:settings:write')
  @CheckLimit('categories')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'إنشاء فئة منتج جديدة' })
  @ApiResponse({
    status: 201,
    description: 'تم إنشاء الفئة بنجاح',
    type: ProductCategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'بيانات غير صالحة' })
  @ApiResponse({ status: 401, description: 'غير مصرح' })
  @ApiResponse({ status: 404, description: 'لم يتم العثور على المتجر' })
  create(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() createDto: CreateProductCategoryDto,
  ) {
    return this.categoriesService.create(ws.ownerId, createDto);
  }

  /**
   * الحصول على جميع فئات المتجر
   */
  @Get()
  @ApiOperation({ summary: 'الحصول على جميع فئات المتجر' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'تضمين الفئات غير النشطة',
  })
  @ApiResponse({
    status: 200,
    description: 'قائمة الفئات',
    type: [ProductCategoryResponseDto],
  })
  @ApiResponse({ status: 401, description: 'غير مصرح' })
  @ApiResponse({ status: 404, description: 'لم يتم العثور على المتجر' })
  @RequiresWorkspacePermission('store:settings:read')
  findAll(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const include = includeInactive === 'true';
    return this.categoriesService.findAll(ws.ownerId, include);
  }

  /**
   * الحصول على فئة واحدة
   */
  @Get(':id')
  @ApiOperation({ summary: 'الحصول على فئة بالمعرف' })
  @ApiParam({ name: 'id', description: 'معرف الفئة' })
  @ApiResponse({
    status: 200,
    description: 'بيانات الفئة',
    type: ProductCategoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'غير مصرح' })
  @ApiResponse({ status: 403, description: 'غير مسموح' })
  @ApiResponse({ status: 404, description: 'لم يتم العثور على الفئة' })
  @RequiresWorkspacePermission('store:settings:read')
  findOne(@ActiveWorkspace() ws: WorkspaceContext, @Param('id') id: string) {
    return this.categoriesService.findOne(ws.ownerId, id);
  }

  /**
   * تحديث فئة
   */
  @Put(':id')
  @ApiOperation({ summary: 'تحديث فئة' })
  @ApiParam({ name: 'id', description: 'معرف الفئة' })
  @ApiResponse({
    status: 200,
    description: 'تم تحديث الفئة بنجاح',
    type: ProductCategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'بيانات غير صالحة' })
  @ApiResponse({ status: 401, description: 'غير مصرح' })
  @ApiResponse({ status: 403, description: 'غير مسموح' })
  @ApiResponse({ status: 404, description: 'لم يتم العثور على الفئة' })
  @RequiresWorkspacePermission('store:settings:write')
  update(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Body() updateDto: UpdateProductCategoryDto,
  ) {
    return this.categoriesService.update(ws.ownerId, id, updateDto);
  }

  /**
   * حذف فئة
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف فئة' })
  @ApiParam({ name: 'id', description: 'معرف الفئة' })
  @ApiResponse({ status: 200, description: 'تم حذف الفئة بنجاح' })
  @ApiResponse({ status: 400, description: 'لا يمكن حذف الفئة (تحتوي منتجات)' })
  @ApiResponse({ status: 401, description: 'غير مصرح' })
  @ApiResponse({ status: 403, description: 'غير مسموح' })
  @ApiResponse({ status: 404, description: 'لم يتم العثور على الفئة' })
  @RequiresWorkspacePermission('store:settings:write')
  remove(@ActiveWorkspace() ws: WorkspaceContext, @Param('id') id: string) {
    return this.categoriesService.remove(ws.ownerId, id);
  }

  /**
   * إعادة ترتيب الفئات
   */
  @Put('reorder/bulk')
  @ApiOperation({ summary: 'إعادة ترتيب الفئات' })
  @ApiResponse({ status: 200, description: 'تم إعادة الترتيب بنجاح' })
  @ApiResponse({ status: 400, description: 'بيانات غير صالحة' })
  @ApiResponse({ status: 401, description: 'غير مصرح' })
  @RequiresWorkspacePermission('store:settings:write')
  reorder(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() reorderDto: ReorderCategoriesDto,
  ) {
    return this.categoriesService.reorder(ws.ownerId, reorderDto.categoryIds);
  }

  /**
   * تبديل حالة التفعيل
   */
  @Put(':id/toggle-active')
  @ApiOperation({ summary: 'تفعيل/إلغاء تفعيل فئة' })
  @ApiParam({ name: 'id', description: 'معرف الفئة' })
  @ApiResponse({
    status: 200,
    description: 'تم تغيير حالة الفئة',
    type: ProductCategoryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'غير مصرح' })
  @ApiResponse({ status: 403, description: 'غير مسموح' })
  @ApiResponse({ status: 404, description: 'لم يتم العثور على الفئة' })
  @RequiresWorkspacePermission('store:settings:write')
  toggleActive(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    return this.categoriesService.toggleActive(ws.ownerId, id);
  }
}

/**
 * Controller للفئات العامة (بدون مصادقة)
 */
@ApiTags('Product Categories')
@Controller('stores/:storeId/categories')
export class PublicProductCategoriesController {
  constructor(private readonly categoriesService: ProductCategoriesService) {}

  /**
   * الحصول على فئات متجر (عام)
   */
  @Get()
  @ApiOperation({ summary: 'الحصول على فئات متجر (عام)' })
  @ApiParam({ name: 'storeId', description: 'معرف المتجر' })
  @ApiResponse({
    status: 200,
    description: 'قائمة الفئات النشطة',
  })
  getPublicCategories(@Param('storeId') storeId: string) {
    return this.categoriesService.getPublicCategories(storeId);
  }
}
