import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsArray,
  ArrayMaxSize,
  ValidateNested,
  IsNumber,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum OrderPaymentStatus {
  UNPAID = 'UNPAID',
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export class CreateOrderDto {
  @ApiPropertyOptional({
    description: 'Delivery address ID (not required for digital products)',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  addressId?: string;

  @ApiPropertyOptional({ description: 'Coupon code to apply' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({ description: 'Customer note for the order' })
  @IsOptional()
  @IsString()
  customerNote?: string;
}

export class CreateOrderFromCartDto extends CreateOrderDto {
  // Inherits addressId, couponCode, customerNote
  // Will create order from user's cart
}

export class CreateDirectOrderDto extends CreateOrderDto {
  @ApiProperty({ description: 'Product ID to order' })
  @IsString()
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Quantity to order', minimum: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({ description: 'Variant ID (if product has variants)' })
  @IsOptional()
  @IsString()
  variantId?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, description: 'New order status' })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({ description: 'Store note (for store owner)' })
  @IsOptional()
  @IsString()
  storeNote?: string;

  @ApiPropertyOptional({ description: 'Estimated delivery date' })
  @IsOptional()
  @Type(() => Date)
  estimatedDelivery?: Date;
}

export class CancelOrderDto {
  @ApiProperty({ description: 'Cancellation reason' })
  @IsString()
  cancellationReason: string;
}

export class UpdateOrderPaymentStatusDto {
  @ApiProperty({
    enum: ['PAID', 'UNPAID'],
    description: 'حالة الدفع الجديدة',
  })
  @IsIn(['PAID', 'UNPAID'])
  paymentStatus: 'PAID' | 'UNPAID';
}

export class BulkOrderIdsDto {
  @ApiProperty({ description: 'معرفات الطلبات', type: [String] })
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  orderIds: string[];
}

export class BulkUpdateOrderStatusDto extends BulkOrderIdsDto {
  @ApiProperty({ enum: OrderStatus, description: 'الحالة الجديدة' })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}

export class BulkUpdatePaymentStatusDto extends BulkOrderIdsDto {
  @ApiProperty({
    enum: ['PAID', 'UNPAID'],
    description: 'حالة الدفع الجديدة',
  })
  @IsIn(['PAID', 'UNPAID'])
  paymentStatus: 'PAID' | 'UNPAID';
}

export class OrderFiltersDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: OrderPaymentStatus })
  @IsOptional()
  @IsEnum(OrderPaymentStatus)
  paymentStatus?: OrderPaymentStatus;

  @ApiPropertyOptional({
    description: 'بحث برقم الطلب أو الهاتف أو اسم العميل',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'رقم الصفحة', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'عدد العناصر في الصفحة', default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'ترتيب حسب' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'اتجاه الترتيب' })
  @IsOptional()
  @IsString()
  sortOrder?: string;

  @ApiPropertyOptional({
    description: 'Store ID (for customers viewing orders from specific store)',
  })
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiPropertyOptional({ description: 'Start date filter' })
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date filter' })
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}
