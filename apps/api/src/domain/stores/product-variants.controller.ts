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
import { ProductVariantsService } from './product-variants.service';
import {
  CreateProductVariantDto,
  UpdateProductVariantDto,
  BulkCreateVariantsDto,
  GenerateVariantsDto,
  UpdateVariantStockDto,
  BulkUpdateStockDto,
} from './dto/product-variant.dto';

@ApiTags('Product Variants - متغيرات المنتجات')
@Controller('products/:productId/variants')
@ApiBearerAuth()
export class ProductVariantsController {
  constructor(private readonly variantsService: ProductVariantsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @ApiOperation({ summary: 'إنشاء متغير منتج جديد' })
  async create(
    @Param('productId') productId: string,
    @Body() dto: CreateProductVariantDto,
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    return this.variantsService.create(productId, dto, ws.ownerId);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @ApiOperation({ summary: 'إنشاء عدة متغيرات دفعة واحدة' })
  async bulkCreate(
    @Param('productId') productId: string,
    @Body() dto: BulkCreateVariantsDto,
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    return this.variantsService.bulkCreate(productId, dto, ws.ownerId);
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @ApiOperation({ summary: 'توليد كل التركيبات الممكنة للمتغيرات' })
  async generateVariants(
    @Param('productId') productId: string,
    @Body() dto: GenerateVariantsDto,
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    return this.variantsService.generateVariants(productId, dto, ws.ownerId);
  }

  @Get()
  @ApiOperation({ summary: 'الحصول على جميع متغيرات منتج' })
  @ApiParam({ name: 'productId', description: 'معرف المنتج' })
  @ApiResponse({ status: 200, description: 'قائمة المتغيرات' })
  async findByProduct(@Param('productId') productId: string) {
    return this.variantsService.findByProduct(productId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'الحصول على متغير محدد' })
  @ApiParam({ name: 'productId', description: 'معرف المنتج' })
  @ApiParam({ name: 'id', description: 'معرف المتغير' })
  @ApiResponse({ status: 200, description: 'بيانات المتغير' })
  @ApiResponse({ status: 404, description: 'المتغير غير موجود' })
  async findOne(@Param('id') id: string) {
    return this.variantsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @ApiOperation({ summary: 'تحديث متغير' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductVariantDto,
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    return this.variantsService.update(id, dto, ws.ownerId);
  }

  @Put(':id/stock')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @ApiOperation({ summary: 'تحديث مخزون متغير' })
  async updateStock(
    @Param('id') id: string,
    @Body() dto: UpdateVariantStockDto,
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    return this.variantsService.updateStock(id, dto.stock, ws.ownerId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف متغير' })
  async remove(
    @Param('id') id: string,
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    return this.variantsService.remove(id, ws.ownerId);
  }

  @Delete()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف جميع متغيرات المنتج' })
  async removeAll(
    @Param('productId') productId: string,
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    return this.variantsService.removeAllByProduct(productId, ws.ownerId);
  }
}

@ApiTags('Product Variants - متغيرات المنتجات')
@Controller('variants')
@ApiBearerAuth()
export class VariantsBulkController {
  constructor(private readonly variantsService: ProductVariantsService) {}

  @Put('bulk-stock')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:products:write')
  @ApiOperation({ summary: 'تحديث مخزون عدة متغيرات' })
  async bulkUpdateStock(
    @Body() dto: BulkUpdateStockDto,
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    return this.variantsService.bulkUpdateStock(dto, ws.ownerId);
  }
}
