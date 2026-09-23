import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../core/common/decorators/auth/public.decorator';
import { TrackingSessionGuard } from '../../core/common/guards/auth/tracking-session.guard';
import { OrderTrackingService } from './order-tracking.service';
import {
  RequestTrackingOtpDto,
  VerifyTrackingOtpDto,
} from './dto/order-tracking.dto';
import type { TrackingSessionContext } from '../checkout/checkout-session.types';

/**
 * 📦 API تتبع الطلبات
 *
 * Endpoints عامة لتتبع الطلبات عبر OTP
 */
@ApiTags('Order Tracking - تتبع الطلبات')
@Public()
@Controller('track')
export class OrderTrackingController {
  constructor(private readonly trackingService: OrderTrackingService) {}

  /**
   * 🔍 فحص سريع لوجود الطلب (بدون OTP)
   */
  @Get('quick/:orderNumber')
  @ApiOperation({ summary: 'فحص سريع لوجود الطلب' })
  @ApiResponse({ status: 200, description: 'معلومات أساسية عن الطلب' })
  @ApiResponse({ status: 404, description: 'الطلب غير موجود' })
  async quickCheck(@Param('orderNumber') orderNumber: string) {
    return this.trackingService.getQuickOrderStatus(orderNumber);
  }

  /**
   * 📲 طلب OTP للتتبع
   */
  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'طلب رمز OTP للتتبع' })
  @ApiResponse({ status: 200, description: 'تم إرسال رمز التحقق' })
  @ApiResponse({ status: 404, description: 'لا توجد طلبات لهذا الرقم' })
  @ApiResponse({ status: 429, description: 'تم تجاوز حد الطلبات' })
  async requestOtp(@Body() dto: RequestTrackingOtpDto) {
    return this.trackingService.requestTrackingOtp(dto);
  }

  /**
   * ✅ التحقق من OTP وجلب الطلبات
   */
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'التحقق من OTP وبدء جلسة التتبع' })
  @ApiResponse({ status: 200, description: 'تم التحقق - قائمة الطلبات' })
  @ApiResponse({ status: 400, description: 'رمز التحقق غير صالح' })
  async verifyOtp(@Body() dto: VerifyTrackingOtpDto) {
    return this.trackingService.verifyTrackingOtp(dto);
  }

  /**
   * 📋 جلب قائمة الطلبات (يتطلب جلسة تتبع OTP)
   */
  @Post('orders')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TrackingSessionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'جلب قائمة الطلبات برقم الهاتف المُتحقق' })
  @ApiResponse({ status: 200, description: 'قائمة الطلبات' })
  async getOrders(@Req() req: { trackingSession?: TrackingSessionContext }) {
    return this.trackingService.getOrdersByPhone(
      req.trackingSession!.phoneNumber,
    );
  }

  /**
   * 📦 جلب تفاصيل طلب معين
   */
  @Post('order/:orderNumber')
  @HttpCode(HttpStatus.OK)
  @UseGuards(TrackingSessionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'جلب تفاصيل طلب معين' })
  @ApiResponse({ status: 200, description: 'تفاصيل الطلب' })
  @ApiResponse({ status: 404, description: 'الطلب غير موجود' })
  async getOrderDetails(
    @Param('orderNumber') orderNumber: string,
    @Req() req: { trackingSession?: TrackingSessionContext },
  ) {
    return this.trackingService.getOrderDetails(
      orderNumber,
      req.trackingSession!.phoneNumber,
    );
  }
}
