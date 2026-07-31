import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../workspace/workspace-context.middleware';
import { ProductAttributesService } from './product-attributes.service';
import {
  CreateProductAttributeDto,
  UpdateProductAttributeDto,
  BulkCreateAttributesDto,
} from './dto/product-attribute.dto';

@ApiTags('Product Attributes - خصائص المنتجات')
@Controller('products/:productId/attributes')
@ApiBearerAuth()
export class ProductAttributesController {
  constructor(private readonly attributesService: ProductAttributesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @ApiOperation({ summary: 'إنشاء أو تحديث خاصية منتج' })
  async create(
    @Param('productId') productId: string,
    @Body() dto: CreateProductAttributeDto,
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    return this.attributesService.create(productId, dto, ws.ownerId);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @ApiOperation({ summary: 'إنشاء أو تحديث عدة خصائص دفعة واحدة' })
  async bulkCreate(
    @Param('productId') productId: string,
    @Body() dto: BulkCreateAttributesDto,
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    return this.attributesService.bulkCreate(productId, dto, ws.ownerId);
  }

  @Get()
  @ApiOperation({ summary: 'الحصول على جميع خصائص منتج' })
  @ApiParam({ name: 'productId', description: 'معرف المنتج' })
  @ApiResponse({ status: 200, description: 'قائمة الخصائص' })
  async findByProduct(@Param('productId') productId: string) {
    return this.attributesService.findByProduct(productId);
  }

  @Get('with-template')
  @ApiOperation({ summary: 'الحصول على خصائص المنتج مع قالب الفئة' })
  @ApiParam({ name: 'productId', description: 'معرف المنتج' })
  @ApiResponse({ status: 200, description: 'الخصائص مع القالب' })
  async findByProductWithTemplate(@Param('productId') productId: string) {
    return this.attributesService.findByProductWithTemplate(productId);
  }

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'التحقق من اكتمال الخصائص المطلوبة' })
  @ApiParam({ name: 'productId', description: 'معرف المنتج' })
  @ApiResponse({ status: 200, description: 'نتيجة التحقق' })
  async validateRequired(
    @Param('productId') productId: string,
    @Request() req: any,
  ) {
    // الحصول على فئة المتجر من المنتج
    const product = await this.attributesService['prisma'].products.findUnique({
      where: { id: productId },
      include: { stores: true },
    });

    if (!product?.stores.categoryId) {
      return { valid: true, missing: [] };
    }

    return this.attributesService.validateRequiredAttributes(
      productId,
      product.stores.categoryId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'الحصول على خاصية محددة' })
  @ApiParam({ name: 'productId', description: 'معرف المنتج' })
  @ApiParam({ name: 'id', description: 'معرف الخاصية' })
  @ApiResponse({ status: 200, description: 'بيانات الخاصية' })
  @ApiResponse({ status: 404, description: 'الخاصية غير موجودة' })
  async findOne(@Param('id') id: string) {
    return this.attributesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @ApiOperation({ summary: 'تحديث خاصية' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductAttributeDto,
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    return this.attributesService.update(id, dto, ws.ownerId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف خاصية' })
  async remove(
    @Param('id') id: string,
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    return this.attributesService.remove(id, ws.ownerId);
  }

  @Delete()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف جميع خصائص المنتج' })
  async removeAll(
    @Param('productId') productId: string,
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    return this.attributesService.removeAllByProduct(productId, ws.ownerId);
  }
}

@ApiTags('Store Categories - فئات المتاجر')
@Controller('store-categories')
export class StoreCategoriesTemplateController {
  constructor(private readonly attributesService: ProductAttributesService) {}

  @Get(':id/template')
  @ApiOperation({ summary: 'الحصول على قالب خصائص فئة متجر' })
  @ApiParam({ name: 'id', description: 'معرف فئة المتجر' })
  @ApiResponse({ status: 200, description: 'قالب الخصائص' })
  async getCategoryTemplate(@Param('id') id: string) {
    return this.attributesService.getCategoryTemplate(id);
  }
}

@ApiTags('Stores - المتاجر')
@Controller('stores/:storeId/template')
export class StoreTemplateController {
  constructor(private readonly attributesService: ProductAttributesService) {}

  @Get()
  @ApiOperation({ summary: 'الحصول على قالب خصائص المتجر' })
  @ApiParam({ name: 'storeId', description: 'معرف المتجر' })
  @ApiResponse({ status: 200, description: 'قالب الخصائص' })
  async getStoreTemplate(@Param('storeId') storeId: string) {
    return this.attributesService.getTemplateByStoreId(storeId);
  }
}
