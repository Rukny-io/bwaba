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
import { ProductDiscountsService } from './product-discounts.service';
import {
  CreateProductDiscountDto,
  UpdateProductDiscountDto,
  ProductDiscountResponseDto,
} from './dto/product-discount.dto';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../workspace/workspace-context.middleware';

@ApiTags('Product Discounts')
@Controller('stores/my-store/discounts')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@ApiBearerAuth()
export class ProductDiscountsController {
  constructor(private readonly discountsService: ProductDiscountsService) {}

  @Post()
  @RequiresWorkspacePermission('store:products:write')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'إنشاء خصم على منتجات' })
  @ApiResponse({
    status: 201,
    description: 'تم إنشاء الخصم بنجاح',
    type: ProductDiscountResponseDto,
  })
  create(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() createDto: CreateProductDiscountDto,
  ) {
    return this.discountsService.create(ws.ownerId, createDto);
  }

  @Get()
  @RequiresWorkspacePermission('store:products:read')
  @ApiOperation({ summary: 'الحصول على جميع خصومات المتجر' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'تضمين الخصومات غير النشطة',
  })
  @ApiResponse({
    status: 200,
    description: 'قائمة الخصومات',
    type: [ProductDiscountResponseDto],
  })
  findAll(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.discountsService.findAll(ws.ownerId, includeInactive === 'true');
  }

  @Get(':id')
  @RequiresWorkspacePermission('store:products:read')
  @ApiOperation({ summary: 'الحصول على خصم بالمعرف' })
  @ApiParam({ name: 'id', description: 'معرف الخصم' })
  @ApiResponse({
    status: 200,
    description: 'بيانات الخصم',
    type: ProductDiscountResponseDto,
  })
  findOne(@ActiveWorkspace() ws: WorkspaceContext, @Param('id') id: string) {
    return this.discountsService.findOne(ws.ownerId, id);
  }

  @Put(':id')
  @RequiresWorkspacePermission('store:products:write')
  @ApiOperation({ summary: 'تحديث خصم' })
  @ApiParam({ name: 'id', description: 'معرف الخصم' })
  @ApiResponse({
    status: 200,
    description: 'تم تحديث الخصم بنجاح',
    type: ProductDiscountResponseDto,
  })
  update(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Body() updateDto: UpdateProductDiscountDto,
  ) {
    return this.discountsService.update(ws.ownerId, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequiresWorkspacePermission('store:products:write')
  @ApiOperation({ summary: 'حذف خصم' })
  @ApiParam({ name: 'id', description: 'معرف الخصم' })
  @ApiResponse({ status: 200, description: 'تم حذف الخصم بنجاح' })
  remove(@ActiveWorkspace() ws: WorkspaceContext, @Param('id') id: string) {
    return this.discountsService.remove(ws.ownerId, id);
  }

  @Put(':id/toggle-active')
  @RequiresWorkspacePermission('store:products:write')
  @ApiOperation({ summary: 'تفعيل/إلغاء تفعيل خصم' })
  @ApiParam({ name: 'id', description: 'معرف الخصم' })
  @ApiResponse({
    status: 200,
    description: 'تم تغيير حالة الخصم',
    type: ProductDiscountResponseDto,
  })
  toggleActive(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    return this.discountsService.toggleActive(ws.ownerId, id);
  }
}
