import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Throttle } from '@nestjs/throttler';
import { CheckoutSessionGuard } from '../../core/common/guards/auth/checkout-session.guard';
import { Public } from '../../core/common/decorators/auth/public.decorator';
import {
  assertVerifiedCheckoutSession,
  resolveCheckoutContact,
} from '../checkout/checkout-session.util';
import type { CheckoutSessionContext } from '../checkout/checkout-session.types';
import { CheckoutOrderService } from '../checkout/application/checkout-order.service';

/**
 * Item في السلة
 */
class OrderItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  quantity: number;

  /** Ignored — unit price is resolved server-side from the product/variant. */
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variantId?: string;
}

/**
 * DTO لإنشاء طلب من checkout
 */
class CreateCheckoutOrderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty()
  @IsString()
  @Transform(({ value }) => String(value))
  @IsOptional()
  shippingAddressId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsEnum(['CASH', 'QASEH_CARD', 'BANK_TRANSFER'])
  paymentMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  subtotal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  shippingCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  total?: number;
}

/**
 * 🛒 Checkout Orders Controller
 *
 * إنشاء طلبات للمستخدمين الضيوف باستخدام جلسة checkout
 */
@ApiTags('Checkout Orders')
@ApiBearerAuth()
@Public()
@UseGuards(CheckoutSessionGuard)
@Controller('checkout/orders')
export class CheckoutOrdersController {
  constructor(private readonly checkoutOrder: CheckoutOrderService) {}

  /**
   * 📦 إنشاء طلب جديد (للضيوف)
   */
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'إنشاء طلب جديد للضيف' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الطلب بنجاح' })
  @ApiResponse({ status: 400, description: 'بيانات غير صحيحة' })
  @ApiResponse({ status: 401, description: 'جلسة غير صالحة' })
  async createGuestOrder(
    @Body() createOrderDto: CreateCheckoutOrderDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Req() req: { checkoutSession?: CheckoutSessionContext },
  ) {
    const session = assertVerifiedCheckoutSession(req.checkoutSession);
    const { phoneNumber, email } = resolveCheckoutContact(session);

    return this.checkoutOrder.create(
      createOrderDto,
      { ...session, phoneNumber, email },
      idempotencyKey,
    );
  }
}
