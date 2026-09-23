import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CheckoutSessionGuard } from '../../core/common/guards/auth/checkout-session.guard';
import { Public } from '../../core/common/decorators/auth/public.decorator';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import {
  assertVerifiedCheckoutSession,
  resolveCheckoutContact,
} from '../checkout/checkout-session.util';
import type { CheckoutSessionContext } from '../checkout/checkout-session.types';

/**
 * 📍 Checkout Addresses Controller
 *
 * إدارة العناوين للمستخدمين الضيوف — مربوطة بجلسة checkout فقط
 */
@ApiTags('Checkout Addresses')
@ApiBearerAuth()
@Public()
@UseGuards(CheckoutSessionGuard)
@Throttle({ default: { limit: 30, ttl: 60_000 } })
@Controller('checkout/addresses')
export class CheckoutAddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  private requireSessionPhone(
    req: { checkoutSession?: CheckoutSessionContext },
  ): string {
    const session = assertVerifiedCheckoutSession(req.checkoutSession);
    const { phoneNumber } = resolveCheckoutContact(session);
    if (!phoneNumber) {
      throw new ForbiddenException({
        message: 'يجب التحقق عبر رقم الهاتف لإدارة العناوين',
        code: 'CHECKOUT_PHONE_REQUIRED',
      });
    }
    return phoneNumber;
  }

  /**
   * 📋 عرض عناوين جلسة checkout
   */
  @Get()
  @ApiOperation({ summary: 'عرض عناوين جلسة checkout' })
  @ApiResponse({ status: 200, description: 'قائمة العناوين' })
  async getAddresses(@Req() req: { checkoutSession?: CheckoutSessionContext }) {
    const phoneNumber = this.requireSessionPhone(req);
    return this.addressesService.getAddressesByPhone(phoneNumber);
  }

  /**
   * ➕ إضافة عنوان جديد
   */
  @Post()
  @ApiOperation({ summary: 'إضافة عنوان جديد' })
  @ApiResponse({ status: 201, description: 'تم إضافة العنوان بنجاح' })
  async createAddress(
    @Body() createAddressDto: CreateAddressDto,
    @Req() req: { checkoutSession?: CheckoutSessionContext },
  ) {
    const session = assertVerifiedCheckoutSession(req.checkoutSession);
    const phoneNumber = this.requireSessionPhone(req);
    return this.addressesService.createAddressByPhone(
      phoneNumber,
      createAddressDto,
      session.userId,
    );
  }

  /**
   * ✏️ تحديث عنوان
   */
  @Patch(':id')
  @ApiOperation({ summary: 'تحديث عنوان' })
  @ApiParam({ name: 'id', description: 'معرف العنوان' })
  @ApiResponse({ status: 200, description: 'تم التحديث بنجاح' })
  async updateAddress(
    @Param('id') addressId: string,
    @Body() updateAddressDto: UpdateAddressDto,
    @Req() req: { checkoutSession?: CheckoutSessionContext },
  ) {
    const phoneNumber = this.requireSessionPhone(req);
    return this.addressesService.updateAddressByPhone(
      addressId,
      phoneNumber,
      updateAddressDto,
    );
  }

  /**
   * 🗑️ حذف عنوان
   */
  @Delete(':id')
  @ApiOperation({ summary: 'حذف عنوان' })
  @ApiParam({ name: 'id', description: 'معرف العنوان' })
  @ApiResponse({ status: 200, description: 'تم الحذف بنجاح' })
  async deleteAddress(
    @Param('id') addressId: string,
    @Req() req: { checkoutSession?: CheckoutSessionContext },
  ) {
    const phoneNumber = this.requireSessionPhone(req);
    return this.addressesService.deleteAddressByPhone(addressId, phoneNumber);
  }
}
