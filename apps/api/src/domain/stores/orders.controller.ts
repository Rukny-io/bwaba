import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { WorkspaceGuard } from '../workspace/workspace.guard';
import { RequiresWorkspacePermission } from '../workspace/workspace-permission-key';
import { ActiveWorkspace } from '../workspace/active-workspace.decorator';
import type { WorkspaceContext } from '../workspace/workspace-context.middleware';
import { OrdersService } from './orders.service';
import {
  CreateOrderFromCartDto,
  CreateDirectOrderDto,
  UpdateOrderStatusDto,
  CancelOrderDto,
  OrderFiltersDto,
} from './dto/order.dto';
import { TrackOrderDto, TrackOrderResponse } from './dto/checkout-otp.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ============ Public Endpoints ============

  /**
   * 🔐 تتبع الطلب (عام - آمن)
   * يتطلب رقم الطلب + آخر 4 أرقام من الهاتف
   */
  @Post('track')
  @ApiOperation({
    summary: 'تتبع طلب بدون تسجيل دخول',
    description:
      'تتبع حالة الطلب باستخدام رقم الطلب وآخر 4 أرقام من رقم الهاتف للتحقق من الهوية',
  })
  @ApiBody({ type: TrackOrderDto })
  @ApiResponse({
    status: 200,
    description: 'بيانات تتبع الطلب',
    type: TrackOrderResponse,
  })
  @ApiResponse({ status: 400, description: 'رقم الهاتف غير متطابق' })
  @ApiResponse({ status: 404, description: 'الطلب غير موجود' })
  async trackOrder(@Body() dto: TrackOrderDto): Promise<TrackOrderResponse> {
    return this.ordersService.trackOrderSecure(dto.orderNumber, dto.phoneLast4);
  }

  // ============ Customer Endpoints (Protected) ============

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('from-cart')
  @ApiOperation({ summary: 'إنشاء طلب من السلة' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الطلب بنجاح' })
  async createFromCart(
    @Request() req,
    @Body() createOrderDto: CreateOrderFromCartDto,
  ) {
    return this.ordersService.createFromCart(req.user.id, createOrderDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('direct')
  @ApiOperation({ summary: 'شراء مباشر (اشتري الآن)' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الطلب بنجاح' })
  async createDirect(
    @Request() req,
    @Body() createOrderDto: CreateDirectOrderDto,
  ) {
    return this.ordersService.createDirect(req.user.id, createOrderDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  @ApiOperation({ summary: 'عرض طلباتي (كمشتري)' })
  @ApiResponse({ status: 200, description: 'قائمة الطلبات' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'تصفية حسب الحالة',
  })
  @ApiQuery({
    name: 'storeId',
    required: false,
    description: 'تصفية حسب المتجر',
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'من تاريخ' })
  @ApiQuery({ name: 'endDate', required: false, description: 'إلى تاريخ' })
  async getMyOrders(@Request() req, @Query() filters: OrderFiltersDto) {
    return this.ordersService.getMyOrders(req.user.id, filters);
  }

  /**
   * Get store orders (alternative route matching frontend expectations)
   * This route MUST be before :id to prevent 'store' being captured as orderId
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:orders:read')
  @Get('store')
  @ApiOperation({ summary: 'عرض طلبات متجري (كبائع) - مسار بديل' })
  async getStoreOrdersAlt(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query() filters: OrderFiltersDto,
  ) {
    return this.ordersService.getStoreOrders(ws.ownerId, filters);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'عرض تفاصيل طلب' })
  @ApiResponse({ status: 200, description: 'تفاصيل الطلب' })
  @ApiResponse({ status: 404, description: 'الطلب غير موجود' })
  async getOrder(@Param('id') orderId: string, @Request() req) {
    return this.ordersService.getOrder(orderId, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id/cancel')
  @ApiOperation({ summary: 'إلغاء طلب' })
  @ApiResponse({ status: 200, description: 'تم إلغاء الطلب' })
  @ApiResponse({ status: 400, description: 'لا يمكن إلغاء الطلب' })
  async cancelOrder(
    @Param('id') orderId: string,
    @Request() req,
    @Body() cancelDto: CancelOrderDto,
  ) {
    return this.ordersService.cancelOrder(orderId, req.user.id, cancelDto);
  }

  // ============ Store Owner Endpoints ============

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:orders:read')
  @Get('store/orders')
  @ApiOperation({ summary: 'عرض طلبات متجري (كبائع)' })
  async getStoreOrders(
    @ActiveWorkspace() ws: WorkspaceContext,
    @Query() filters: OrderFiltersDto,
  ) {
    return this.ordersService.getStoreOrders(ws.ownerId, filters);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:orders:read')
  @Get('store/stats')
  @ApiOperation({ summary: 'إحصائيات طلبات المتجر' })
  async getStoreOrderStats(@ActiveWorkspace() ws: WorkspaceContext) {
    return this.ordersService.getStoreOrderStats(ws.ownerId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @RequiresWorkspacePermission('store:orders:write')
  @Put(':id/status')
  @ApiOperation({ summary: 'تحديث حالة الطلب (للبائع)' })
  async updateOrderStatus(
    @Param('id') orderId: string,
    @ActiveWorkspace() ws: WorkspaceContext,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(orderId, ws.ownerId, updateDto);
  }
}
