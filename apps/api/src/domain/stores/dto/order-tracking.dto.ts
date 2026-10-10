import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Matches, Length } from 'class-validator';

/**
 * 📦 DTOs لتتبع الطلبات
 */

/**
 * طلب OTP للتتبع
 */
export class RequestTrackingOtpDto {
  @ApiProperty({
    description: 'رقم الهاتف بالصيغة الدولية',
    example: '+9647701234567',
  })
  @IsString()
  @Matches(/^\+964[0-9]{10}$/, {
    message: 'رقم الهاتف يجب أن يكون بالصيغة العراقية: +964XXXXXXXXXX',
  })
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'رقم الطلب (اختياري - للتحقق من وجوده)',
    example: '3E3154',
  })
  @IsOptional()
  @IsString()
  orderNumber?: string;
}

/**
 * التحقق من OTP للتتبع
 */
export class VerifyTrackingOtpDto {
  @ApiProperty({
    description: 'رقم الهاتف',
    example: '+9647701234567',
  })
  @IsString()
  @Matches(/^\+964[0-9]{10}$/, {
    message: 'رقم الهاتف يجب أن يكون بالصيغة العراقية: +964XXXXXXXXXX',
  })
  phoneNumber: string;

  @ApiProperty({
    description: 'رمز التحقق المكون من 6 أرقام',
    example: '458921',
  })
  @IsString()
  @Length(6, 6, { message: 'رمز التحقق يجب أن يكون 6 أرقام' })
  @Matches(/^[0-9]{6}$/, { message: 'رمز التحقق يجب أن يحتوي على أرقام فقط' })
  code: string;

  @ApiProperty({
    description: 'معرف OTP',
    example: 'uuid-otp-id',
  })
  @IsString()
  otpId: string;
}

/**
 * فحص سريع للطلب
 */
export class QuickTrackDto {
  @ApiProperty({
    description: 'رقم الطلب',
    example: '3E3154',
  })
  @IsString()
  orderNumber: string;
}

/**
 * Response للـ OTP Request
 */
export class TrackingOtpResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'تم إرسال رمز التحقق عبر واتساب' })
  message: string;

  @ApiProperty({ example: 'uuid-otp-id' })
  otpId: string;

  @ApiProperty({ example: 600, description: 'صلاحية الرمز بالثواني' })
  expiresIn: number;

  @ApiProperty({ example: 3, description: 'عدد الطلبات المرتبطة بالرقم' })
  ordersCount: number;
}

/**
 * Response لجلسة التتبع
 */
export class TrackingSessionResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ description: 'JWT Token للجلسة' })
  accessToken: string;

  @ApiProperty({
    example: 1800,
    description: 'صلاحية الجلسة بالثواني (30 دقيقة)',
  })
  expiresIn: number;

  @ApiProperty({ description: 'قائمة الطلبات', type: 'array' })
  orders: OrderSummaryDto[];
}

/**
 * ملخص الطلب
 */
export class OrderSummaryDto {
  @ApiProperty({ example: '3E3154' })
  orderNumber: string;

  @ApiProperty({ example: 'SHIPPED' })
  status: string;

  @ApiProperty({ example: '🚚 تم الشحن' })
  statusLabel: string;

  @ApiProperty({ example: 'متجر الإلكترونيات' })
  storeName: string;

  @ApiProperty({ example: 250000 })
  total: number;

  @ApiProperty({ example: 'IQD' })
  currency: string;

  @ApiProperty({ example: 3 })
  itemsCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  estimatedDelivery?: Date;
}

// ============ Supporting Classes (must be defined before OrderDetailsDto) ============

class StatusHistoryDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  isCurrent: boolean;
}

class StoreInfoDto {
  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  logo?: string;
}

class OrderItemDto {
  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  nameAr?: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  subtotal: number;

  @ApiPropertyOptional()
  image?: string;
}

class AddressInfoDto {
  @ApiProperty()
  fullName: string;

  @ApiProperty()
  city: string;

  @ApiPropertyOptional()
  district?: string;

  @ApiProperty()
  street: string;

  @ApiProperty()
  fullAddress: string;
}

class PaymentInfoDto {
  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  shippingFee: number;

  @ApiProperty()
  discount: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  currency: string;
}

class DatesInfoDto {
  @ApiProperty()
  ordered: Date;

  @ApiPropertyOptional()
  estimatedDelivery?: Date;

  @ApiPropertyOptional()
  deliveredAt?: Date;
}

// ============ Main DTOs ============

/**
 * تفاصيل الطلب الكاملة
 */
export class OrderDetailsDto {
  @ApiProperty({ example: '3E3154' })
  orderNumber: string;

  @ApiProperty({ example: 'SHIPPED' })
  status: string;

  @ApiProperty({ example: '🚚 تم الشحن' })
  statusLabel: string;

  @ApiProperty({ description: 'سجل تغيير الحالات' })
  statusHistory: StatusHistoryDto[];

  @ApiProperty({ description: 'معلومات المتجر' })
  store: StoreInfoDto;

  @ApiProperty({ description: 'المنتجات' })
  items: OrderItemDto[];

  @ApiProperty({ description: 'العنوان' })
  address: AddressInfoDto;

  @ApiProperty({ description: 'تفاصيل الدفع' })
  payment: PaymentInfoDto;

  @ApiProperty({ description: 'التواريخ' })
  dates: DatesInfoDto;

  @ApiPropertyOptional({ description: 'ملاحظة العميل' })
  customerNote?: string;
}
