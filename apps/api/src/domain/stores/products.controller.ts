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
  UseInterceptors,
  UploadedFiles,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductsService } from './products.service';
import { ProductsUploadService } from './products-upload.service';
import { CreateProductDto, ProductStatus } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { PlanGuard } from '../../core/common/guards/plan.guard';
import { CheckLimit } from '../../core/common/decorators/auth/plan.decorator';
import { WorkspaceGuard } from '../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../workspace/workspace-context.middleware';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productsUploadService: ProductsUploadService,
  ) {}

  /**
   * Get top products for store owner's dashboard
   * Sorted by order count, limited to specified amount
   */
  @Get('store/top')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get top products for store dashboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopProducts(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query('limit') limit?: number,
  ) {
    return this.productsService.getTopProducts(ws.ownerId, limit || 5);
  }

  @Post()
  @UseGuards(JwtAuthGuard, WorkspaceGuard, PlanGuard)
  @RequiresWorkspacePermission('store:products:write')
  @CheckLimit('products')
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Create a new product' })
  create(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(ws.ownerId, createProductDto);
  }

  @Get('my-products')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my products' })
  @ApiQuery({ name: 'status', enum: ProductStatus, required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isFeatured', type: Boolean, required: false })
  getMyProducts(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query('status') status?: ProductStatus,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
    @Query('isFeatured') isFeatured?: boolean,
  ) {
    return this.productsService.getMyProducts(ws.ownerId, {
      status,
      categoryId,
      search,
      isFeatured,
    });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get product statistics' })
  getProductStats(@ActiveWorkspace() ws: WorkspaceContext) {
    return this.productsService.getProductStats(ws.ownerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id;
    return this.productsService.findOne(id, userId);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  @ApiResponse({ status: 200, description: 'Product retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  update(
    @Param('id') id: string,
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, ws.ownerId, updateProductDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Partially update a product' })
  patchUpdate(
    @Param('id') id: string,
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, ws.ownerId, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product' })
  remove(@Param('id') id: string, @ActiveWorkspace() ws: WorkspaceContext) {
    return this.productsService.remove(id, ws.ownerId);
  }

  // ==================== صور المنتجات - Product Images ====================

  /**
   * رفع صور للمنتج (Server Upload)
   */
  @Post(':id/images')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('files', 5, { storage: memoryStorage() }))
  @ApiOperation({ summary: 'رفع صور للمنتج' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'تم رفع الصور بنجاح' })
  @ApiResponse({ status: 400, description: 'خطأ في الطلب' })
  @ApiResponse({ status: 401, description: 'غير مصرح' })
  @ApiResponse({ status: 403, description: 'ممنوع' })
  uploadImages(
    @Param('id') productId: string,
    @ActiveWorkspace() ws: WorkspaceContext,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.productsUploadService.uploadProductImages(
      ws.ownerId,
      productId,
      files,
    );
  }

  /**
   * الحصول على Presigned URLs للرفع المباشر
   */
  @Post(':id/images/presign')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الحصول على روابط مؤقتة لرفع الصور مباشرة إلى S3' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              size: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'تم إنشاء الروابط بنجاح' })
  getPresignedUrls(
    @Param('id') productId: string,
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() body: { files: { name: string; type: string; size: number }[] },
  ) {
    return this.productsUploadService.generatePresignedUrls(
      ws.ownerId,
      productId,
      body.files,
    );
  }

  /**
   * تأكيد رفع الصور بعد استخدام Presigned URLs
   */
  @Post(':id/images/confirm')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تأكيد رفع الصور بعد الرفع المباشر' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        keys: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'تم التأكيد بنجاح' })
  confirmUpload(
    @Param('id') productId: string,
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() body: { keys: string[] },
  ) {
    return this.productsUploadService.confirmUpload(
      ws.ownerId,
      productId,
      body.keys,
    );
  }

  /**
   * الحصول على صور المنتج
   */
  @Get(':id/images')
  @ApiOperation({ summary: 'الحصول على صور المنتج' })
  @ApiResponse({ status: 200, description: 'تم الحصول على الصور بنجاح' })
  getProductImages(@Param('id') productId: string) {
    return this.productsUploadService.getProductImageUrls(productId);
  }

  /**
   * حذف صورة من المنتج
   */
  @Delete(':id/images/:imageId')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف صورة من المنتج' })
  deleteImage(
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    return this.productsUploadService.deleteProductImage(
      ws.ownerId,
      productId,
      imageId,
    );
  }

  /**
   * تعيين صورة كصورة رئيسية
   */
  @Patch(':id/images/:imageId/primary')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تعيين صورة كصورة رئيسية' })
  setPrimaryImage(
    @Param('id') productId: string,
    @Param('imageId') imageId: string,
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    return this.productsUploadService.setPrimaryImage(
      ws.ownerId,
      productId,
      imageId,
    );
  }

  /**
   * إعادة ترتيب الصور
   */
  @Patch(':id/images/reorder')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إعادة ترتيب صور المنتج' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        imageIds: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'تم إعادة الترتيب بنجاح' })
  reorderImages(
    @Param('id') productId: string,
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() body: { imageIds: string[] },
  ) {
    return this.productsUploadService.reorderImages(
      ws.ownerId,
      productId,
      body.imageIds,
    );
  }
}
