import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
  Logger,
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
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Throttle } from '@nestjs/throttler';
import { CheckoutSessionGuard } from '../../core/common/guards/auth/checkout-session.guard';
import { Public } from '../../core/common/decorators/auth/public.decorator';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { QasehPaymentService } from '../../integrations/qaseh-payment/qaseh-payment.service';
import {
  assertVerifiedCheckoutSession,
  resolveCheckoutContact,
} from '../checkout/checkout-session.util';
import type { CheckoutSessionContext } from '../checkout/checkout-session.types';

/**
 * Item في السلة
 */
class OrderItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  price: number;

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
  @IsNumber()
  subtotal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  shippingCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
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
  private readonly logger = new Logger(CheckoutOrdersController.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly prisma: PrismaService,
    private readonly qasehPayment: QasehPaymentService,
  ) {}

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
    @Req() req: { checkoutSession?: CheckoutSessionContext },
  ) {
    const session = assertVerifiedCheckoutSession(req.checkoutSession);
    const { phoneNumber: sessionPhone, email: sessionEmail } =
      resolveCheckoutContact(session);

    let userId = session.userId;

    if (!userId) {
      let user = sessionPhone
        ? await this.prisma.user.findFirst({
            where: { phoneNumber: sessionPhone },
          })
        : sessionEmail
          ? await this.prisma.user.findFirst({ where: { email: sessionEmail } })
          : null;

      if (!user) {
        if (!sessionPhone && !sessionEmail) {
          throw new ForbiddenException({
            message: 'يجب التحقق عبر رمز واتساب لإتمام الشراء',
            code: 'CHECKOUT_VERIFICATION_REQUIRED',
          });
        }
        user = await this.prisma.user.create({
          data: {
            phoneNumber: sessionPhone,
            email: sessionEmail,
            role: 'GUEST',
            emailVerified: false,
          },
        });
      }

      userId = user.id;
    }

    try {
      if (createOrderDto.shippingAddressId) {
        const address = await this.prisma.addresses.findUnique({
          where: { id: createOrderDto.shippingAddressId },
        });

        if (!address) {
          throw new ForbiddenException('العنوان غير موجود');
        }

        const ownsAddress =
          (sessionPhone && address.phoneNumber === sessionPhone) ||
          (userId && address.userId === userId) ||
          address.userId === null;

        if (!ownsAddress) {
          throw new ForbiddenException('غير مصرح باستخدام هذا العنوان');
        }

        if (address.userId === null) {
          await this.prisma.addresses.updateMany({
            where: {
              id: createOrderDto.shippingAddressId,
              userId: null,
              ...(sessionPhone ? { phoneNumber: sessionPhone } : {}),
            },
            data: { userId },
          });
        }
      }

      const paymentMethod = createOrderDto.paymentMethod || 'CASH';
      const orderItems = createOrderDto.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        ...(item.variantId ? { variantId: item.variantId } : {}),
      }));

      if (paymentMethod === 'CASH') {
        await this.ordersService.assertCashOnDeliveryAllowed(orderItems);
      }

      const order = await this.ordersService.createDirectMultiItem(userId, {
        addressId: createOrderDto.shippingAddressId,
        customerNote: createOrderDto.notes,
        phoneNumber: sessionPhone,
        paymentMethod,
        items: orderItems,
      });

      if (
        createOrderDto.paymentMethod === 'QASEH_CARD' &&
        this.qasehPayment.isConfigured()
      ) {
        try {
          const itemDescriptions = createOrderDto.items
            .map((item, i) => `${i + 1}. x${item.quantity}`)
            .join(', ');
          const description =
            `طلب ${order.orderNumber}: ${itemDescriptions}`.substring(0, 250);

          const payment = await this.qasehPayment.createPayment({
            orderId: order.orderNumber,
            amount: Number(order.total),
            currency: order.currency || 'IQD',
            description,
            customData: { rukny_order_id: order.id },
          });

          await this.prisma.orders.update({
            where: { id: order.id },
            data: {
              paymentId: payment.payment_id,
              paymentToken: payment.token,
              paymentStatus: 'PENDING',
            },
          });

          return {
            success: true,
            message: 'تم إنشاء الطلب - يرجى إكمال الدفع',
            orders: [{ ...order, paymentId: payment.payment_id }],
            payment: {
              paymentId: payment.payment_id,
              paymentUrl: this.qasehPayment.getPaymentPageUrl(payment.token),
              token: payment.token,
            },
          };
        } catch (paymentError) {
          this.logger.error(
            `Qaseh payment initiation failed for order ${order.id}`,
            paymentError instanceof Error ? paymentError.stack : paymentError,
          );
          return {
            success: true,
            message: 'تم إنشاء الطلب لكن فشل بدء الدفع. يمكنك إعادة المحاولة.',
            orders: [order],
            paymentError: true,
          };
        }
      }

      return {
        success: true,
        message: 'تم إنشاء الطلب بنجاح',
        orders: [order],
      };
    } catch (error) {
      this.logger.error(
        'Error creating checkout order',
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }
}
