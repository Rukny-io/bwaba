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
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { PlanGuard } from '../../core/common/guards/plan.guard';
import { CheckLimit } from '../../core/common/decorators/auth/plan.decorator';
import { WorkspaceGuard } from '../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../workspace/workspace-context.middleware';
import { CouponsService } from './coupons.service';
import {
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
  CouponFiltersDto,
} from './dto/coupon.dto';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // ============ Store Owner Endpoints ============

  @Post()
  @UseGuards(JwtAuthGuard, WorkspaceGuard, PlanGuard)
  @RequiresWorkspacePermission('store:coupons:write')
  @CheckLimit('coupons')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إنشاء كود خصم جديد' })
  async createCoupon(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() createCouponDto: CreateCouponDto,
  ) {
    return this.couponsService.createCoupon(ws.ownerId, createCouponDto);
  }

  @Get('store')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:coupons:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'عرض كوبونات متجري' })
  async getStoreCoupons(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query() filters: CouponFiltersDto,
  ) {
    return this.couponsService.getStoreCoupons(ws.ownerId, filters);
  }

  @Get('store/stats')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:coupons:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'إحصائيات الكوبونات' })
  async getCouponStats(@ActiveWorkspace() ws: WorkspaceContext) {
    return this.couponsService.getCouponStats(ws.ownerId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:coupons:read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'عرض تفاصيل كوبون' })
  async getCoupon(
    @Param('id') couponId: string,
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    return this.couponsService.getCoupon(couponId, ws.ownerId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:coupons:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تحديث كوبون' })
  async updateCoupon(
    @Param('id') couponId: string,
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    return this.couponsService.updateCoupon(couponId, ws.ownerId, updateCouponDto);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:coupons:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تفعيل/إلغاء تفعيل كوبون' })
  async toggleCouponStatus(
    @Param('id') couponId: string,
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    return this.couponsService.toggleCouponStatus(couponId, ws.ownerId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:coupons:write')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف كوبون' })
  async deleteCoupon(
    @Param('id') couponId: string,
    @ActiveWorkspace() ws: WorkspaceContext,
  ) {
    return this.couponsService.deleteCoupon(couponId, ws.ownerId);
  }

  // ============ Public/Customer Endpoints ============

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'التحقق من صلاحية كود الخصم' })
  @ApiResponse({ status: 200, description: 'نتيجة التحقق' })
  async validateCoupon(@Request() req, @Body() validateDto: ValidateCouponDto) {
    return this.couponsService.validateCoupon(req.user.id, validateDto);
  }
}
