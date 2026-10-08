import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { RedisService } from '../../core/cache/redis.service';
import { CartService } from './cart.service';
import S3Service from '../../services/s3.service';
import {
  CreateOrderFromCartDto,
  CreateDirectOrderDto,
  UpdateOrderStatusDto,
  UpdateOrderPaymentStatusDto,
  BulkUpdateOrderStatusDto,
  BulkUpdatePaymentStatusDto,
  BulkOrderIdsDto,
  CancelOrderDto,
  OrderStatus,
  OrderFiltersDto,
} from './dto/order.dto';
import { v4 as uuidv4 } from 'uuid';
import {
  renderStoreOrderInvoicePdf,
  type StoreOrderInvoicePdfInput,
} from './store-order-invoice-pdf.util';

@Injectable()
export class OrdersService {
  private readonly bucket = process.env.S3_BUCKET || 'rukny-storage';

  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
    private readonly redisService: RedisService,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Generate unique order number
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Create order from cart
   */
  async createFromCart(userId: string, createOrderDto: CreateOrderFromCartDto) {
    const { addressId, couponCode, customerNote } = createOrderDto;

    // Validate address
    const address = await this.prisma.addresses.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('العنوان غير موجود');
    }

    // Validate cart
    const cartValidation = await this.cartService.validateCart(userId);

    if (!cartValidation.isValid) {
      throw new BadRequestException({
        message: 'بعض المنتجات في السلة غير متاحة',
        errors: cartValidation.errors,
      });
    }

    if (cartValidation.validItems.length === 0) {
      throw new BadRequestException('السلة فارغة');
    }

    // Group items by store
    const itemsByStore = cartValidation.validItems.reduce(
      (acc, item) => {
        const storeId = item.product.store.id;
        if (!acc[storeId]) {
          acc[storeId] = {
            store: item.product.store,
            items: [],
            subtotal: 0,
          };
        }
        acc[storeId].items.push(item);
        acc[storeId].subtotal += item.subtotal;
        return acc;
      },
      {} as Record<string, any>,
    );

    // Handle coupon if provided
    let coupon = null;
    const discount = 0;

    if (couponCode) {
      coupon = await this.prisma.coupons.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
        },
      });

      if (!coupon) {
        throw new BadRequestException('كود الخصم غير صالح');
      }

      // Check usage limit
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        throw new BadRequestException('تم استنفاد كود الخصم');
      }

      // Check per-user limit
      if (coupon.perUserLimit) {
        const userUsageCount = await this.prisma.coupon_usages.count({
          where: { couponId: coupon.id, userId },
        });
        if (userUsageCount >= coupon.perUserLimit) {
          throw new BadRequestException('لقد استخدمت هذا الكود من قبل');
        }
      }
    }

    // Create orders (one per store)
    const orders = [];

    for (const storeId of Object.keys(itemsByStore)) {
      const storeData = itemsByStore[storeId];
      let orderDiscount = 0;

      // Apply coupon if it's for this store or global
      if (coupon && (!coupon.storeId || coupon.storeId === storeId)) {
        if (coupon.discountType === 'PERCENTAGE') {
          orderDiscount =
            (storeData.subtotal * Number(coupon.discountValue)) / 100;
          if (coupon.maxDiscount) {
            orderDiscount = Math.min(orderDiscount, Number(coupon.maxDiscount));
          }
        } else {
          orderDiscount = Number(coupon.discountValue);
        }

        // Check minimum order amount
        if (
          coupon.minOrderAmount &&
          storeData.subtotal < Number(coupon.minOrderAmount)
        ) {
          orderDiscount = 0;
        }
      }

      const total = Math.max(0, storeData.subtotal - orderDiscount);

      // Create order
      const order = await this.prisma.orders.create({
        data: {
          id: uuidv4(),
          orderNumber: this.generateOrderNumber(),
          userId,
          storeId,
          addressId,
          phoneNumber: address.phoneNumber, // 🆕 ربط برقم الهاتف
          subtotal: storeData.subtotal,
          discount: orderDiscount,
          total,
          customerNote,
          couponId: coupon?.id,
        },
        include: {
          stores: {
            select: { id: true, name: true, slug: true },
          },
          addresses: true,
        },
      });

      // Invalidate dashboard cache for store owner
      try {
        const storeRec = await this.prisma.store.findUnique({
          where: { id: storeId },
          select: { userId: true },
        });
        if (storeRec?.userId) {
          await this.redisService.del(`dashboard:stats:${storeRec.userId}`);
        }
      } catch (err) {
        console.warn(
          'Redis del error (order createFromCart):',
          err?.message || err,
        );
      }

      // Create order items
      for (const item of storeData.items) {
        // Check if product has variants and try to find the matching one
        let matchedVariant: any = null;
        if (item.product.hasVariants) {
          const activeVariants = await this.prisma.product_variants.findMany({
            where: { productId: item.productId, isActive: true },
          });
          // If only one variant, use it; otherwise we can't determine which was ordered
          if (activeVariants.length === 1) {
            matchedVariant = activeVariants[0];
          }
        }

        await this.prisma.order_items.create({
          data: {
            id: uuidv4(),
            orderId: order.id,
            productId: item.productId,
            productName: item.product.name,
            productNameAr: item.product.nameAr,
            price: item.product.salePrice || item.product.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
            ...(matchedVariant
              ? {
                  variantId: matchedVariant.id,
                  variantAttributes: matchedVariant.attributes,
                }
              : {}),
          },
        });

        // Update stock
        if (matchedVariant) {
          // Decrement variant stock
          await this.prisma.product_variants.update({
            where: { id: matchedVariant.id },
            data: { stock: { decrement: item.quantity } },
          });
          // Recalculate product quantity as sum of all variant stocks
          const allVariants = await this.prisma.product_variants.findMany({
            where: { productId: item.productId, isActive: true },
            select: { stock: true },
          });
          const totalStock = allVariants.reduce((sum, v) => sum + v.stock, 0);
          await this.prisma.products.update({
            where: { id: item.productId },
            data: { quantity: totalStock },
          });
        } else {
          // No variants or can't determine variant - directly decrement product stock
          await this.prisma.products.update({
            where: { id: item.productId },
            data: {
              quantity: { decrement: item.quantity },
            },
          });
        }
      }

      // Record coupon usage
      if (coupon && orderDiscount > 0) {
        await this.prisma.coupon_usages.create({
          data: {
            id: uuidv4(),
            couponId: coupon.id,
            userId,
            orderId: order.id,
          },
        });

        // Increment coupon usage count
        await this.prisma.coupons.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });
      }

      orders.push(order);
    }

    // Clear the cart
    await this.cartService.clearCart(userId);

    return {
      message: 'تم إنشاء الطلب بنجاح',
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        store: o.stores,
        total: Number(o.total),
        status: o.status,
      })),
    };
  }

  /**
   * Create direct order (buy now)
   */
  async createDirect(userId: string, createOrderDto: CreateDirectOrderDto) {
    const {
      addressId,
      productId,
      quantity,
      couponCode,
      customerNote,
      variantId,
    } = createOrderDto;

    // Get product first to check if digital
    const product = await this.prisma.products.findUnique({
      where: { id: productId },
      include: {
        stores: {
          select: { id: true, name: true, slug: true },
        },
        digitalAssets: true,
      },
    });

    if (!product) {
      throw new NotFoundException('المنتج غير موجود');
    }

    const isDigital = product.isDigital;

    // Validate address (only for physical products)
    let address: any = null;
    if (!isDigital) {
      if (!addressId) {
        throw new BadRequestException('العنوان مطلوب للمنتجات المادية');
      }
      address = await this.prisma.addresses.findFirst({
        where: { id: addressId, userId },
      });
      if (!address) {
        throw new NotFoundException('العنوان غير موجود');
      }
    }

    const hasDigitalFile =
      isDigital && product.digitalAssets && product.digitalAssets.length > 0;

    // Handle variant if provided
    let variant: any = null;
    if (variantId) {
      variant = await this.prisma.product_variants.findFirst({
        where: { id: variantId, productId, isActive: true },
      });

      if (!variant) {
        throw new NotFoundException('خيار المنتج غير موجود أو غير متاح');
      }

      if (variant.stock < quantity) {
        throw new BadRequestException(
          `الكمية المتاحة لهذا الخيار هي ${variant.stock} فقط`,
        );
      }
    } else {
      if (product.quantity < quantity) {
        throw new BadRequestException(
          `الكمية المتاحة هي ${product.quantity} فقط`,
        );
      }
    }

    const price = variant
      ? Number(variant.price)
      : Number(product.salePrice || product.price);
    const subtotal = price * quantity;
    let discount = 0;
    let coupon = null;

    // Handle coupon
    if (couponCode) {
      coupon = await this.prisma.coupons.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          OR: [{ storeId: null }, { storeId: product.storeId }],
        },
      });

      if (coupon) {
        if (coupon.discountType === 'PERCENTAGE') {
          discount = (subtotal * Number(coupon.discountValue)) / 100;
          if (coupon.maxDiscount) {
            discount = Math.min(discount, Number(coupon.maxDiscount));
          }
        } else {
          discount = Number(coupon.discountValue);
        }

        if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
          discount = 0;
        }
      }
    }

    const total = Math.max(0, subtotal - discount);

    // Create order
    const order = await this.prisma.orders.create({
      data: {
        id: uuidv4(),
        orderNumber: this.generateOrderNumber(),
        userId,
        storeId: product.storeId,
        ...(address ? { addressId: address.id } : {}),
        phoneNumber: address?.phoneNumber || '', // فارغ للمنتجات الرقمية
        subtotal,
        discount,
        total,
        customerNote,
        couponId: coupon?.id,
        // المنتجات الرقمية تُسلَّم فوراً
        ...(isDigital
          ? { status: 'DELIVERED' as any, deliveredAt: new Date() }
          : {}),
      },
    });

    // Invalidate dashboard cache for store owner
    try {
      const storeRec = await this.prisma.store.findUnique({
        where: { id: product.storeId },
        select: { userId: true },
      });
      if (storeRec?.userId) {
        await this.redisService.del(`dashboard:stats:${storeRec.userId}`);
      }
    } catch (err) {
      console.warn(
        'Redis del error (order createDirect):',
        err?.message || err,
      );
    }

    // Create order item
    const orderItemId = uuidv4();
    await this.prisma.order_items.create({
      data: {
        id: orderItemId,
        orderId: order.id,
        productId,
        productName: product.name,
        productNameAr: product.nameAr,
        price,
        quantity,
        subtotal,
        isDigital,
        ...(variant
          ? {
              variantId: variant.id,
              variantAttributes: variant.attributes,
            }
          : {}),
      },
    });

    // إنشاء رمز تحميل للمنتجات الرقمية (فقط إذا يوجد ملف)
    if (hasDigitalFile) {
      const downloadToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      await this.prisma.download_tokens.create({
        data: {
          orderItemId,
          token: downloadToken,
          maxDownloads: 5,
          expiresAt,
        },
      });
    }

    // Update stock (skip for digital products)
    if (!isDigital) {
      if (variant) {
        await this.prisma.product_variants.update({
          where: { id: variant.id },
          data: { stock: { decrement: quantity } },
        });

        // Recalculate product quantity as sum of all variant stocks
        const allVariants = await this.prisma.product_variants.findMany({
          where: { productId, isActive: true },
          select: { stock: true },
        });
        const totalStock = allVariants.reduce((sum, v) => sum + v.stock, 0);
        await this.prisma.products.update({
          where: { id: productId },
          data: { quantity: totalStock },
        });
      } else {
        await this.prisma.products.update({
          where: { id: productId },
          data: {
            quantity: { decrement: quantity },
          },
        });
      }
    }

    // Record coupon usage
    if (coupon && discount > 0) {
      await this.prisma.coupon_usages.create({
        data: {
          id: uuidv4(),
          couponId: coupon.id,
          userId,
          orderId: order.id,
        },
      });

      await this.prisma.coupons.update({
        where: { id: coupon.id },
        data: { usageCount: { increment: 1 } },
      });
    }

    return this.getOrder(order.id, userId);
  }

  /**
   * Create direct order with multiple items (checkout flow)
   */
  async createDirectMultiItem(
    userId: string,
    dto: {
      addressId?: string;
      customerNote?: string;
      phoneNumber?: string;
      paymentMethod?: string;
      items: Array<{ productId: string; quantity: number; variantId?: string }>;
    },
  ) {
    const {
      addressId,
      customerNote,
      phoneNumber: dtoPhone,
      paymentMethod,
      items,
    } = dto;

    if (!items || items.length === 0) {
      throw new BadRequestException('يجب إضافة منتج واحد على الأقل');
    }

    // Validate all products and variants upfront
    const resolvedItems: Array<{
      product: any;
      variant: any;
      quantity: number;
      price: number;
      subtotal: number;
    }> = [];

    let storeId: string | null = null;
    let hasDigitalItems = false;
    let allDigital = true;

    for (const item of items) {
      const product = await this.prisma.products.findUnique({
        where: { id: item.productId },
        include: {
          stores: { select: { id: true, name: true, slug: true } },
          digitalAssets: true,
        },
      });

      if (!product) {
        throw new NotFoundException(`المنتج غير موجود: ${item.productId}`);
      }

      if (product.status !== 'ACTIVE') {
        throw new BadRequestException(
          `المنتج غير متاح حالياً: ${product.name}`,
        );
      }

      if (product.isDigital) {
        hasDigitalItems = true;
      } else {
        allDigital = false;
      }

      // All items must belong to the same store
      if (!storeId) {
        storeId = product.storeId;
      } else if (product.storeId !== storeId) {
        throw new BadRequestException(
          'جميع المنتجات يجب أن تكون من نفس المتجر',
        );
      }

      let variant: any = null;
      if (item.variantId) {
        variant = await this.prisma.product_variants.findFirst({
          where: {
            id: item.variantId,
            productId: item.productId,
            isActive: true,
          },
        });

        if (!variant) {
          throw new NotFoundException('خيار المنتج غير موجود أو غير متاح');
        }

        if (variant.stock < item.quantity) {
          throw new BadRequestException(
            `الكمية المتاحة لهذا الخيار هي ${variant.stock} فقط`,
          );
        }
      } else if (!product.isDigital) {
        // Only check stock for physical products
        if (product.quantity < item.quantity) {
          throw new BadRequestException(
            `الكمية المتاحة لـ ${product.name} هي ${product.quantity} فقط`,
          );
        }
      }

      const price = variant
        ? Number(variant.price)
        : Number(product.salePrice || product.price);
      const subtotal = price * item.quantity;

      resolvedItems.push({
        product,
        variant,
        quantity: item.quantity,
        price,
        subtotal,
      });
    }

    // Validate address (required for physical products)
    let address: any = null;
    if (!allDigital) {
      if (!addressId) {
        throw new BadRequestException('العنوان مطلوب للمنتجات المادية');
      }
      address = await this.prisma.addresses.findFirst({
        where: { id: addressId, userId },
      });
      if (!address) {
        throw new NotFoundException('العنوان غير موجود');
      }
    }

    const orderSubtotal = resolvedItems.reduce((sum, i) => sum + i.subtotal, 0);
    const total = Math.max(0, orderSubtotal);

    // Create single order
    const order = await this.prisma.orders.create({
      data: {
        id: uuidv4(),
        orderNumber: this.generateOrderNumber(),
        userId,
        storeId: storeId,
        ...(address ? { addressId: address.id } : {}),
        phoneNumber: address?.phoneNumber || '',
        subtotal: orderSubtotal,
        discount: 0,
        total,
        customerNote,
        ...(paymentMethod ? { paymentMethod: paymentMethod as any } : {}),
        // Digital-only orders are delivered immediately
        ...(allDigital
          ? { status: 'DELIVERED' as any, deliveredAt: new Date() }
          : {}),
      },
    });

    // Invalidate dashboard cache for store owner
    try {
      const storeRec = await this.prisma.store.findUnique({
        where: { id: storeId },
        select: { userId: true },
      });
      if (storeRec?.userId) {
        await this.redisService.del(`dashboard:stats:${storeRec.userId}`);
      }
    } catch (err) {
      console.warn(
        'Redis del error (order createDirectMultiItem):',
        err?.message || err,
      );
    }

    // Create order items, download tokens for digital, and update stock
    for (const item of resolvedItems) {
      const isDigital = !!item.product.isDigital;
      const orderItemId = uuidv4();

      await this.prisma.order_items.create({
        data: {
          id: orderItemId,
          orderId: order.id,
          productId: item.product.id,
          productName: item.product.name,
          productNameAr: item.product.nameAr,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
          isDigital,
          ...(item.variant
            ? {
                variantId: item.variant.id,
                variantAttributes: item.variant.attributes,
              }
            : {}),
        },
      });

      // Create download token for digital products (only if file exists)
      if (isDigital && item.product.digitalAssets?.length > 0) {
        const downloadToken = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await this.prisma.download_tokens.create({
          data: {
            orderItemId,
            token: downloadToken,
            maxDownloads: 5,
            expiresAt,
          },
        });
      }

      // Update stock (skip for digital products)
      if (!isDigital) {
        if (item.variant) {
          await this.prisma.product_variants.update({
            where: { id: item.variant.id },
            data: { stock: { decrement: item.quantity } },
          });

          // Recalculate product quantity as sum of all variant stocks
          const allVariants = await this.prisma.product_variants.findMany({
            where: { productId: item.product.id, isActive: true },
            select: { stock: true },
          });
          const totalStock = allVariants.reduce((sum, v) => sum + v.stock, 0);
          await this.prisma.products.update({
            where: { id: item.product.id },
            data: { quantity: totalStock },
          });
        } else {
          await this.prisma.products.update({
            where: { id: item.product.id },
            data: { quantity: { decrement: item.quantity } },
          });
        }
      }
    }

    const orderData = await this.getOrder(order.id, userId);

    // Include download tokens for digital items
    if (hasDigitalItems) {
      const tokens = await this.prisma.download_tokens.findMany({
        where: {
          orderItem: { orderId: order.id },
        },
        include: {
          orderItem: {
            select: { productName: true, productNameAr: true },
          },
        },
      });
      orderData.downloadTokens = tokens.map((t) => ({
        token: t.token,
        productName: t.orderItem.productNameAr || t.orderItem.productName,
        maxDownloads: t.maxDownloads,
        expiresAt: t.expiresAt,
      }));
    }

    return orderData;
  }

  /**
   * Get user's orders (as customer)
   */
  async getMyOrders(userId: string, filters?: OrderFiltersDto) {
    const where: any = { userId };
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.storeId) {
      where.storeId = filters.storeId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const orders = await this.prisma.orders.findMany({
      where,
      include: {
        stores: {
          select: { id: true, name: true, slug: true, logo: true },
        },
        addresses: true,
        order_items: {
          include: {
            products: {
              include: {
                product_images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        _count: {
          select: { order_items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return Promise.all(orders.map((order) => this.formatOrder(order)));
  }

  /**
   * Get store's orders (as seller)
   */

  async getStoreOrders(userId: string, filters?: OrderFiltersDto) {
    // Get user's store
    const store = await this.prisma.store.findFirst({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('لا يوجد لديك متجر');
    }

    const where: any = { storeId: store.id };
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 10, 100);
    const skip = (page - 1) * limit;

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.paymentStatus === 'UNPAID') {
      where.paymentStatus = { in: ['UNPAID', 'PENDING', 'FAILED'] };
    } else if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const search = filters?.search?.trim();
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        {
          users: {
            is: {
              OR: [
                { email: { contains: search, mode: 'insensitive' } },
                {
                  profile: {
                    is: { name: { contains: search, mode: 'insensitive' } },
                  },
                },
              ],
            },
          },
        },
        {
          addresses: {
            is: { fullName: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    const orders = await this.prisma.orders.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { name: true, avatar: true },
            },
          },
        },
        addresses: true,
        order_items: {
          include: {
            products: {
              include: {
                product_images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        _count: {
          select: { order_items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return Promise.all(orders.map((order) => this.formatOrder(order, true)));
  }

  private async assertStoreOrderOwnership(orderId: string, userId: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        stores: true,
        order_items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (order.stores.userId !== userId) {
      throw new ForbiddenException('غير مصرح لك بتحديث هذا الطلب');
    }

    return order;
  }

  private async restoreOrderStock(
    items: Array<{
      productId: string;
      variantId: string | null;
      quantity: number;
    }>,
  ) {
    for (const item of items) {
      if (item.variantId) {
        await this.prisma.product_variants.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
        const allVariants = await this.prisma.product_variants.findMany({
          where: { productId: item.productId, isActive: true },
          select: { stock: true },
        });
        const totalStock = allVariants.reduce((sum, v) => sum + v.stock, 0);
        await this.prisma.products.update({
          where: { id: item.productId },
          data: { quantity: totalStock },
        });
      } else {
        await this.prisma.products.update({
          where: { id: item.productId },
          data: {
            quantity: { increment: item.quantity },
          },
        });
      }
    }
  }

  /**
   * Get single order
   */

  async getOrder(orderId: string, userId: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        stores: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            userId: true,
          },
        },
        users: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { name: true, avatar: true },
            },
          },
        },
        addresses: true,
        order_items: {
          include: {
            products: {
              include: {
                product_images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        coupons: {
          select: { code: true, discountType: true, discountValue: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    // Check authorization (customer or store owner)
    const isCustomer = order.userId === userId;
    const isStoreOwner = order.stores?.userId === userId;

    if (!isCustomer && !isStoreOwner) {
      throw new ForbiddenException('غير مصرح لك بعرض هذا الطلب');
    }

    return await this.formatOrder(order, isStoreOwner);
  }

  async getStoreOrderInvoicePdf(orderId: string, ownerId: string) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        stores: {
          select: { id: true, name: true, userId: true },
        },
        users: {
          select: {
            email: true,
            profile: { select: { name: true } },
          },
        },
        addresses: true,
        order_items: true,
        coupons: { select: { code: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (order.stores?.userId !== ownerId) {
      throw new ForbiddenException('غير مصرح لك بعرض هذا الطلب');
    }

    const input = this.buildStoreOrderInvoiceInput(order);
    const buffer = await renderStoreOrderInvoicePdf(input);
    const safeId = (order.orderNumber || order.id.slice(0, 8)).replace(
      /[^a-zA-Z0-9-]/g,
      '',
    );

    return {
      buffer,
      filename: `invoice-${safeId}.pdf`,
      invoiceNumber: input.invoiceNumber,
    };
  }

  private buildStoreOrderInvoiceInput(order: {
    id: string;
    orderNumber: string | null;
    createdAt: Date;
    subtotal: unknown;
    shippingFee: unknown;
    discount: unknown;
    total: unknown;
    currency: string;
    customerNote: string | null;
    paymentMethod: string | null;
    paymentStatus: string | null;
    status: string;
    phoneNumber: string | null;
    stores: { name: string } | null;
    users: { email: string; profile: { name: string | null } | null } | null;
    addresses: {
      fullName: string | null;
      phoneNumber: string | null;
      city: string | null;
      district: string | null;
      street: string | null;
      buildingNo: string | null;
      floor: string | null;
      apartmentNo: string | null;
      landmark: string | null;
    } | null;
    order_items: Array<{
      productName: string;
      productNameAr: string | null;
      price: unknown;
      quantity: number;
      subtotal: unknown;
      variantAttributes: unknown;
    }>;
    coupons: { code: string } | null;
  }): StoreOrderInvoicePdfInput {
    const customerName =
      order.users?.profile?.name?.trim() ||
      order.addresses?.fullName?.trim() ||
      'عميل';

    const addressLines: string[] = [];
    if (order.addresses) {
      const area = [
        order.addresses.city,
        order.addresses.district,
        order.addresses.street,
      ]
        .filter(Boolean)
        .join('، ');
      const building = [
        order.addresses.buildingNo
          ? `بناية ${order.addresses.buildingNo}`
          : null,
        order.addresses.floor ? `طابق ${order.addresses.floor}` : null,
        order.addresses.apartmentNo
          ? `شقة ${order.addresses.apartmentNo}`
          : null,
      ]
        .filter(Boolean)
        .join('، ');
      if (area) addressLines.push(area);
      if (building) addressLines.push(building);
      if (order.addresses.landmark) addressLines.push(order.addresses.landmark);
    }

    const items = order.order_items.map((item) => ({
      name: item.productNameAr?.trim() || item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.price),
      subtotal: Number(item.subtotal),
      variantLabel: this.formatInvoiceVariantAttributes(item.variantAttributes),
    }));

    const orderNumber = order.orderNumber || order.id.slice(0, 8).toUpperCase();

    return {
      invoiceNumber: `INV-${orderNumber}`,
      orderNumber,
      issuedAt: order.createdAt,
      storeName: order.stores?.name?.trim() || 'المتجر',
      customerName,
      customerPhone: order.phoneNumber || order.addresses?.phoneNumber || null,
      customerEmail: order.users?.email || null,
      paymentMethodLabel: this.mapPaymentMethodLabel(order.paymentMethod),
      paymentStatusLabel: this.mapPaymentStatusLabel(order.paymentStatus),
      orderStatusLabel: this.mapOrderStatusLabel(order.status),
      items,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      discount: Number(order.discount),
      total: Number(order.total),
      currency: order.currency || 'IQD',
      couponCode: order.coupons?.code ?? null,
      addressLines,
      customerNote: order.customerNote,
    };
  }

  private formatInvoiceVariantAttributes(value: unknown): string | null {
    if (!value || typeof value !== 'object') return null;
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v != null && String(v).trim() !== '',
    );
    if (entries.length === 0) return null;
    return entries.map(([, v]) => String(v)).join(' · ');
  }

  private mapPaymentMethodLabel(method: string | null): string {
    switch (method) {
      case 'CASH':
        return 'عند الاستلام';
      case 'QASEH_CARD':
        return 'بطاقة';
      case 'BANK_TRANSFER':
        return 'تحويل بنكي';
      default:
        return 'عند الاستلام';
    }
  }

  private mapPaymentStatusLabel(status: string | null): string {
    switch (status) {
      case 'PAID':
        return 'مدفوع';
      case 'REFUNDED':
        return 'مسترد';
      case 'PENDING':
      case 'FAILED':
      case 'UNPAID':
      default:
        return 'غير مدفوع';
    }
  }

  private mapOrderStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'معلّق',
      CONFIRMED: 'مؤكد',
      PROCESSING: 'قيد التجهيز',
      SHIPPED: 'تم الشحن',
      OUT_FOR_DELIVERY: 'في الطريق',
      DELIVERED: 'مكتمل',
      CANCELLED: 'ملغي',
      REFUNDED: 'مسترد',
    };
    return labels[status] ?? status;
  }

  private readonly validStatusTransitions: Record<string, string[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['OUT_FOR_DELIVERY', 'DELIVERED'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
    DELIVERED: ['REFUNDED'],
    CANCELLED: [],
    REFUNDED: [],
  };

  /**
   * Update order status (store owner only)
   */
  async updateOrderStatus(
    orderId: string,
    userId: string,
    updateDto: UpdateOrderStatusDto,
  ) {
    const order = await this.assertStoreOrderOwnership(orderId, userId);

    if (!this.validStatusTransitions[order.status]?.includes(updateDto.status)) {
      throw new BadRequestException(
        `لا يمكن تغيير الحالة من ${order.status} إلى ${updateDto.status}`,
      );
    }

    const updateData: any = {
      status: updateDto.status,
      updatedAt: new Date(),
    };

    if (updateDto.storeNote) {
      updateData.storeNote = updateDto.storeNote;
    }

    if (updateDto.estimatedDelivery) {
      updateData.estimatedDelivery = updateDto.estimatedDelivery;
    }

    if (updateDto.status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    if (updateDto.status === 'CANCELLED') {
      updateData.cancelledAt = new Date();
      if (!['CANCELLED', 'REFUNDED'].includes(order.status)) {
        await this.restoreOrderStock(order.order_items);
      }
    }

    await this.prisma.orders.update({
      where: { id: orderId },
      data: updateData,
    });

    return this.getOrder(orderId, userId);
  }

  /**
   * Update payment status (store owner only)
   */
  async updateOrderPaymentStatus(
    orderId: string,
    userId: string,
    updateDto: UpdateOrderPaymentStatusDto,
  ) {
    await this.assertStoreOrderOwnership(orderId, userId);

    await this.prisma.orders.update({
      where: { id: orderId },
      data: {
        paymentStatus: updateDto.paymentStatus,
        updatedAt: new Date(),
      },
    });

    return this.getOrder(orderId, userId);
  }

  async bulkUpdateOrderStatus(
    userId: string,
    dto: BulkUpdateOrderStatusDto,
  ): Promise<{ updated: string[]; failed: Array<{ id: string; reason: string }> }> {
    const updated: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    for (const orderId of dto.orderIds) {
      try {
        await this.updateOrderStatus(orderId, userId, { status: dto.status });
        updated.push(orderId);
      } catch (error) {
        failed.push({
          id: orderId,
          reason:
            error instanceof Error ? error.message : 'تعذّر تحديث الطلب',
        });
      }
    }

    return { updated, failed };
  }

  async bulkUpdatePaymentStatus(
    userId: string,
    dto: BulkUpdatePaymentStatusDto,
  ): Promise<{ updated: string[]; failed: Array<{ id: string; reason: string }> }> {
    const updated: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    for (const orderId of dto.orderIds) {
      try {
        await this.updateOrderPaymentStatus(orderId, userId, {
          paymentStatus: dto.paymentStatus,
        });
        updated.push(orderId);
      } catch (error) {
        failed.push({
          id: orderId,
          reason:
            error instanceof Error ? error.message : 'تعذّر تحديث حالة الدفع',
        });
      }
    }

    return { updated, failed };
  }

  async bulkDeleteOrders(
    userId: string,
    dto: BulkOrderIdsDto,
  ): Promise<{ deleted: string[]; failed: Array<{ id: string; reason: string }> }> {
    const deleted: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    for (const orderId of dto.orderIds) {
      try {
        const order = await this.assertStoreOrderOwnership(orderId, userId);

        if (!['CANCELLED', 'REFUNDED'].includes(order.status)) {
          await this.restoreOrderStock(order.order_items);
        }

        await this.prisma.coupon_usages.deleteMany({
          where: { orderId },
        });

        await this.prisma.orders.delete({
          where: { id: orderId },
        });

        deleted.push(orderId);
      } catch (error) {
        failed.push({
          id: orderId,
          reason: error instanceof Error ? error.message : 'تعذّر حذف الطلب',
        });
      }
    }

    return { deleted, failed };
  }

  /**
   * Cancel order (customer only, if pending/confirmed)
   */
  async cancelOrder(
    orderId: string,
    userId: string,
    cancelDto: CancelOrderDto,
  ) {
    const order = await this.prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        order_items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('غير مصرح لك بإلغاء هذا الطلب');
    }

    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException('لا يمكن إلغاء الطلب في هذه المرحلة');
    }

    // Restore product stock (including variant stock)
    for (const item of order.order_items) {
      if (item.variantId) {
        // Restore variant stock
        await this.prisma.product_variants.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
        // Recalculate product quantity as sum of all variant stocks
        const allVariants = await this.prisma.product_variants.findMany({
          where: { productId: item.productId, isActive: true },
          select: { stock: true },
        });
        const totalStock = allVariants.reduce((sum, v) => sum + v.stock, 0);
        await this.prisma.products.update({
          where: { id: item.productId },
          data: { quantity: totalStock },
        });
      } else {
        await this.prisma.products.update({
          where: { id: item.productId },
          data: {
            quantity: { increment: item.quantity },
          },
        });
      }
    }

    // Update order
    await this.prisma.orders.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: cancelDto.cancellationReason,
        updatedAt: new Date(),
      },
    });

    return { message: 'تم إلغاء الطلب بنجاح' };
  }

  /**
   * Get order statistics for store
   */
  async getStoreOrderStats(userId: string) {
    const store = await this.prisma.store.findFirst({
      where: { userId },
    });

    if (!store) {
      return {
        totalOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
      };
    }

    const [statusCounts, revenueData] = await Promise.all([
      this.prisma.orders.groupBy({
        by: ['status'],
        where: { storeId: store.id },
        _count: true,
      }),
      this.prisma.orders.aggregate({
        where: {
          storeId: store.id,
          status: 'DELIVERED',
        },
        _sum: { total: true },
      }),
    ]);

    const totalOrders = statusCounts.reduce((sum, s) => sum + s._count, 0);
    const getCount = (status: string) =>
      statusCounts.find((s) => s.status === status)?._count || 0;

    return {
      totalOrders,
      pendingOrders: getCount('PENDING'),
      processingOrders:
        getCount('CONFIRMED') + getCount('PROCESSING') + getCount('SHIPPED'),
      completedOrders: getCount('DELIVERED'),
      cancelledOrders: getCount('CANCELLED') + getCount('REFUNDED'),
      totalRevenue: Number(revenueData._sum?.total || 0),
    };
  }

  /**
   * 🔐 تتبع الطلب بشكل آمن (عام)
   * يتطلب رقم الطلب + آخر 4 أرقام من الهاتف للتحقق
   */
  async trackOrderSecure(orderNumber: string, phoneLast4: string) {
    // 1. البحث عن الطلب برقم الطلب
    const order = await this.prisma.orders.findUnique({
      where: { orderNumber },
      include: {
        stores: {
          select: { name: true },
        },
        addresses: {
          select: {
            city: true,
            district: true,
            phoneNumber: true,
          },
        },
        _count: {
          select: { order_items: true },
        },
      },
    });

    // 2. الطلب غير موجود
    if (!order) {
      throw new NotFoundException({
        message: 'الطلب غير موجود',
        code: 'ORDER_NOT_FOUND',
      });
    }

    // 3. 🔒 التحقق من آخر 4 أرقام من رقم الهاتف
    const orderPhone = order.phoneNumber || order.addresses?.phoneNumber || '';
    const actualLast4 = orderPhone.slice(-4);

    if (actualLast4 !== phoneLast4) {
      throw new BadRequestException({
        message: 'رقم الهاتف غير متطابق مع بيانات الطلب',
        code: 'PHONE_VERIFICATION_FAILED',
      });
    }

    // 4. إرجاع بيانات التتبع المحدودة (بدون تفاصيل حساسة)
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: this.getStatusLabel(order.status),
      deliveryAddress: {
        city: order.addresses?.city,
        district: order.addresses?.district,
      },
      estimatedDelivery: order.estimatedDelivery,
      lastUpdate: order.updatedAt,
      storeName: order.stores?.name,
      itemsCount: order._count?.order_items || 0,
      total: Number(order.total),
      currency: order.currency,
      createdAt: order.createdAt,
      // لا نُظهر العنوان الكامل أو معلومات أخرى حساسة
    };
  }

  /**
   * الحصول على وصف الحالة بالعربية
   */
  private getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'قيد الانتظار',
      CONFIRMED: 'تم التأكيد',
      PROCESSING: 'قيد التحضير',
      SHIPPED: 'تم الشحن',
      OUT_FOR_DELIVERY: 'في الطريق',
      DELIVERED: 'تم التسليم',
      CANCELLED: 'ملغي',
      REFUNDED: 'مسترد',
    };
    return labels[status] || status;
  }

  /**
   * Format order for response
   */
  private async formatOrder(order: any, includeCustomer = false) {
    const items = order.order_items
      ? await Promise.all(
          order.order_items.map(async (item: any) => {
            let image: string | null =
              item.products?.product_images?.[0]?.imagePath || null;
            if (image && !image.startsWith('http')) {
              try {
                image = await this.s3Service.getPresignedGetUrl(
                  this.bucket,
                  image,
                  3600,
                );
              } catch {
                image = `https://${this.bucket}.s3.${process.env.AWS_REGION || 'eu-north-1'}.amazonaws.com/${image}`;
              }
            }
            return {
              id: item.id,
              productId: item.productId,
              productName: item.productName,
              productNameAr: item.productNameAr,
              price: Number(item.price),
              quantity: item.quantity,
              subtotal: Number(item.subtotal),
              image,
              variantId: item.variantId || null,
              variantAttributes: item.variantAttributes || null,
            };
          }),
        )
      : undefined;

    const formatted: any = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      discount: Number(order.discount),
      total: Number(order.total),
      currency: order.currency,
      customerNote: order.customerNote,
      storeNote: order.storeNote,
      estimatedDelivery: order.estimatedDelivery,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      cancellationReason: order.cancellationReason,
      createdAt: order.createdAt,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      itemsCount: order._count?.order_items || order.order_items?.length || 0,
      store: order.stores,
      address: order.addresses,
      items,
    };

    if (includeCustomer) {
      const customerName =
        order.users?.profile?.name || order.addresses?.fullName || null;

      if (order.users) {
        formatted.customer = {
          id: order.users.id,
          email: order.users.email,
          name: customerName,
          avatar: order.users.profile?.avatar,
        };
        // Keep users in original structure for backward compatibility
        formatted.users = order.users;
      } else if (customerName) {
        // Guest order without linked user — use address name
        formatted.customer = {
          name: customerName,
        };
      }
      formatted.phoneNumber = order.phoneNumber;
    }

    if (order.coupons) {
      formatted.coupon = order.coupons;
    }

    return formatted;
  }

  private isPhysicalCodProduct(product: {
    isDigital: boolean;
    productKind: string;
  }): boolean {
    return !product.isDigital && product.productKind === 'PHYSICAL';
  }

  async resolveCheckoutPaymentOptions(
    productIds: string[],
  ): Promise<{
    card: boolean;
    cashOnDelivery: boolean;
    reason?: string;
    storeId?: string;
    storeName?: string;
  }> {
    if (!productIds.length) {
      return {
        card: true,
        cashOnDelivery: false,
        reason: 'EMPTY_CART',
      };
    }

    const products = await this.prisma.products.findMany({
      where: { id: { in: productIds } },
      include: {
        stores: {
          select: {
            id: true,
            name: true,
            cashOnDeliveryEnabled: true,
          },
        },
      },
    });

    if (products.length !== productIds.length) {
      return {
        card: true,
        cashOnDelivery: false,
        reason: 'PRODUCT_NOT_FOUND',
      };
    }

    let storeId: string | null = null;
    for (const product of products) {
      if (!storeId) {
        storeId = product.storeId;
      } else if (product.storeId !== storeId) {
        return {
          card: true,
          cashOnDelivery: false,
          reason: 'MULTI_STORE',
        };
      }
    }

    const store = products[0]?.stores;
    const allPhysical = products.every((p) => this.isPhysicalCodProduct(p));

    const cashOnDelivery =
      Boolean(store?.cashOnDeliveryEnabled) && allPhysical;

    let reason: string | undefined;
    if (!allPhysical) {
      reason = 'DIGITAL_OR_NON_PHYSICAL';
    } else if (!store?.cashOnDeliveryEnabled) {
      reason = 'STORE_DISABLED';
    }

    return {
      card: true,
      cashOnDelivery,
      reason,
      storeId: store?.id,
      storeName: store?.name,
    };
  }

  async assertCashOnDeliveryAllowed(
    items: Array<{ productId: string; quantity: number; variantId?: string }>,
  ): Promise<void> {
    const productIds = items.map((item) => item.productId);
    const options = await this.resolveCheckoutPaymentOptions(productIds);

    if (!options.cashOnDelivery) {
      const messages: Record<string, string> = {
        EMPTY_CART: 'لا توجد منتجات في الطلب',
        PRODUCT_NOT_FOUND: 'أحد المنتجات غير موجود',
        MULTI_STORE: 'جميع المنتجات يجب أن تكون من نفس المتجر',
        DIGITAL_OR_NON_PHYSICAL:
          'الدفع عند الاستلام غير متاح للمنتجات الرقمية أو الاشتراكات',
        STORE_DISABLED: 'هذا المتجر لا يقبل الدفع عند الاستلام',
      };
      throw new BadRequestException({
        message:
          messages[options.reason || ''] ||
          'الدفع عند الاستلام غير متاح لهذا الطلب',
        code: 'COD_NOT_AVAILABLE',
        reason: options.reason,
      });
    }
  }
}
