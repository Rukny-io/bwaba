import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../core/common/decorators/auth/public.decorator';
import { CheckoutSessionGuard } from '../../core/common/guards/auth/checkout-session.guard';
import { OrdersService } from './orders.service';

@ApiTags('Checkout Payment Options')
@ApiBearerAuth()
@Public()
@UseGuards(CheckoutSessionGuard)
@Controller('checkout/payment-options')
export class CheckoutPaymentOptionsController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Available payment methods for guest checkout cart' })
  async getPaymentOptions(@Query('productIds') productIdsRaw?: string) {
    const productIds = (productIdsRaw || '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    const options =
      await this.ordersService.resolveCheckoutPaymentOptions(productIds);

    return {
      success: true,
      ...options,
    };
  }
}
