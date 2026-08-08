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
import { ProductCollectionsService } from './product-collections.service';
import {
  CreateProductCollectionDto,
  UpdateProductCollectionDto,
  ReorderCollectionsDto,
  ProductCollectionResponseDto,
} from './dto/product-collection.dto';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { PlanGuard } from '../../core/common/guards/plan.guard';
import { CheckLimit } from '../../core/common/decorators/auth/plan.decorator';
import { WorkspaceGuard } from '../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../workspace/workspace-context.middleware';

@ApiTags('Product Collections')
@Controller('stores/my-store/collections')
@UseGuards(JwtAuthGuard, WorkspaceGuard)
@ApiBearerAuth()
export class ProductCollectionsController {
  constructor(private readonly collectionsService: ProductCollectionsService) {}

  @Post()
  @UseGuards(PlanGuard)
  @RequiresWorkspacePermission('store:products:write')
  @CheckLimit('collections')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'إنشاء مجموعة منتجات جديدة' })
  @ApiResponse({
    status: 201,
    description: 'تم إنشاء المجموعة بنجاح',
    type: ProductCollectionResponseDto,
  })
  create(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() createDto: CreateProductCollectionDto,
  ) {
    return this.collectionsService.create(ws.ownerId, createDto);
  }

  @Get()
  @RequiresWorkspacePermission('store:products:read')
  @ApiOperation({ summary: 'الحصول على جميع مجموعات المتجر' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'تضمين المجموعات غير النشطة',
  })
  @ApiResponse({
    status: 200,
    description: 'قائمة المجموعات',
    type: [ProductCollectionResponseDto],
  })
  findAll(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.collectionsService.findAll(ws.ownerId, includeInactive === 'true');
  }

  @Put('reorder/bulk')
  @RequiresWorkspacePermission('store:products:write')
  @ApiOperation({ summary: 'إعادة ترتيب المجموعات' })
  @ApiResponse({ status: 200, description: 'تم إعادة الترتيب بنجاح' })
  reorder(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() reorderDto: ReorderCollectionsDto,
  ) {
    return this.collectionsService.reorder(ws.ownerId, reorderDto.collectionIds);
  }

  @Get(':id')
  @RequiresWorkspacePermission('store:products:read')
  @ApiOperation({ summary: 'الحصول على مجموعة بالمعرف' })
  @ApiParam({ name: 'id', description: 'معرف المجموعة' })
  @ApiResponse({
    status: 200,
    description: 'بيانات المجموعة',
    type: ProductCollectionResponseDto,
  })
  findOne(@ActiveWorkspace() ws: WorkspaceContext, @Param('id') id: string) {
    return this.collectionsService.findOne(ws.ownerId, id);
  }

  @Put(':id')
  @RequiresWorkspacePermission('store:products:write')
  @ApiOperation({ summary: 'تحديث مجموعة' })
  @ApiParam({ name: 'id', description: 'معرف المجموعة' })
  @ApiResponse({
    status: 200,
    description: 'تم تحديث المجموعة بنجاح',
    type: ProductCollectionResponseDto,
  })
  update(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
    @Body() updateDto: UpdateProductCollectionDto,
  ) {
    return this.collectionsService.update(ws.ownerId, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequiresWorkspacePermission('store:products:write')
  @ApiOperation({ summary: 'حذف مجموعة' })
  @ApiParam({ name: 'id', description: 'معرف المجموعة' })
  @ApiResponse({ status: 200, description: 'تم حذف المجموعة بنجاح' })
  remove(@ActiveWorkspace() ws: WorkspaceContext, @Param('id') id: string) {
    return this.collectionsService.remove(ws.ownerId, id);
  }

  @Put(':id/toggle-active')
  @RequiresWorkspacePermission('store:products:write')
  @ApiOperation({ summary: 'تفعيل/إلغاء تفعيل مجموعة' })
  @ApiParam({ name: 'id', description: 'معرف المجموعة' })
  @ApiResponse({
    status: 200,
    description: 'تم تغيير حالة المجموعة',
    type: ProductCollectionResponseDto,
  })
  toggleActive(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Param('id') id: string,
  ) {
    return this.collectionsService.toggleActive(ws.ownerId, id);
  }
}
