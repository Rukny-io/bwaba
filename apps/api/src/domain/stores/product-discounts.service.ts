import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import {
  CreateProductDiscountDto,
  UpdateProductDiscountDto,
} from './dto/product-discount.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductDiscountsService {
  private readonly logger = new Logger(ProductDiscountsService.name);

  constructor(private prisma: PrismaService) {}

  private async getUserStore(userId: string) {
    const store = await this.prisma.store.findFirst({
      where: { userId },
      select: { id: true, userId: true },
    });

    if (!store) {
      throw new NotFoundException(
        'لم يتم العثور على متجر. يرجى إنشاء متجر أولاً',
      );
    }

    return store;
  }

  private calculateSalePrice(price: Prisma.Decimal | number, percentage: number) {
    const base = Number(price);
    const discounted = base * (1 - percentage / 100);
    return Math.max(0, Math.round(discounted));
  }

  private formatDiscountResponse(discount: {
    id: string;
    storeId: string;
    percentage: Prisma.Decimal;
    isActive: boolean;
    startDate: Date;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    _count?: { items: number };
    items?: Array<{ productId: string }>;
  }) {
    const productIds =
      discount.items?.map((item) => item.productId) ?? [];

    return {
      id: discount.id,
      storeId: discount.storeId,
      percentage: Number(discount.percentage),
      isActive: discount.isActive,
      productsCount: discount._count?.items ?? productIds.length,
      productIds,
      startDate: discount.startDate,
      endDate: discount.endDate ?? undefined,
      createdAt: discount.createdAt,
      updatedAt: discount.updatedAt,
    };
  }

  private async verifyDiscountOwnership(discountId: string, userId: string) {
    const discount = await this.prisma.product_discounts.findUnique({
      where: { id: discountId },
      include: {
        stores: { select: { userId: true } },
        items: { select: { productId: true } },
      },
    });

    if (!discount) {
      throw new NotFoundException('لم يتم العثور على الخصم');
    }

    if (discount.stores.userId !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية لتعديل هذا الخصم');
    }

    return discount;
  }

  private async validateProductIds(
    storeId: string,
    productIds: string[],
    excludeDiscountId?: string,
  ) {
    if (!productIds.length) {
      throw new BadRequestException('اختر منتجاً واحداً على الأقل');
    }

    const uniqueIds = [...new Set(productIds)];
    const products = await this.prisma.products.findMany({
      where: {
        id: { in: uniqueIds },
        storeId,
      },
      select: { id: true },
    });

    if (products.length !== uniqueIds.length) {
      throw new BadRequestException('بعض المنتجات غير موجودة أو لا تنتمي لمتجرك');
    }

    const conflicts = await this.prisma.product_discount_items.findMany({
      where: {
        productId: { in: uniqueIds },
        discount: {
          storeId,
          ...(excludeDiscountId ? { id: { not: excludeDiscountId } } : {}),
        },
      },
      select: { productId: true },
    });

    if (conflicts.length) {
      throw new BadRequestException(
        'بعض المنتجات المحددة مشمولة بخصم آخر بالفعل',
      );
    }

    return uniqueIds;
  }

  private async applyDiscountToProducts(
    productIds: string[],
    percentage: number,
    isActive: boolean,
  ) {
    if (!isActive) {
      await this.clearDiscountFromProducts(productIds);
      return;
    }

    const products = await this.prisma.products.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true },
    });

    await Promise.all(
      products.map((product) =>
        this.prisma.products.update({
          where: { id: product.id },
          data: {
            salePrice: this.calculateSalePrice(product.price, percentage),
            updatedAt: new Date(),
          },
        }),
      ),
    );
  }

  private async clearDiscountFromProducts(productIds: string[]) {
    if (!productIds.length) return;

    await this.prisma.products.updateMany({
      where: { id: { in: productIds } },
      data: {
        salePrice: null,
        updatedAt: new Date(),
      },
    });
  }

  async create(userId: string, dto: CreateProductDiscountDto) {
    const store = await this.getUserStore(userId);
    const productIds = await this.validateProductIds(store.id, dto.productIds);

    const discountsCount = await this.prisma.product_discounts.count({
      where: { storeId: store.id },
    });

    if (discountsCount >= 100) {
      throw new BadRequestException('تم الوصول للحد الأقصى من الخصومات (100 خصم)');
    }

    const isActive = dto.isActive ?? true;

    const discount = await this.prisma.$transaction(async (tx) => {
      const created = await tx.product_discounts.create({
        data: {
          id: uuidv4(),
          storeId: store.id,
          percentage: dto.percentage,
          isActive,
          startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          updatedAt: new Date(),
          items: {
            create: productIds.map((productId) => ({ productId })),
          },
        },
        include: {
          _count: { select: { items: true } },
          items: { select: { productId: true } },
        },
      });

      if (isActive) {
        const products = await tx.products.findMany({
          where: { id: { in: productIds } },
          select: { id: true, price: true },
        });

        await Promise.all(
          products.map((product) =>
            tx.products.update({
              where: { id: product.id },
              data: {
                salePrice: this.calculateSalePrice(product.price, dto.percentage),
                updatedAt: new Date(),
              },
            }),
          ),
        );
      }

      return created;
    });

    this.logger.log(`Product discount created: ${discount.id} for store ${store.id}`);

    return this.formatDiscountResponse(discount);
  }

  async findAll(userId: string, includeInactive = false) {
    const store = await this.getUserStore(userId);

    const discounts = await this.prisma.product_discounts.findMany({
      where: {
        storeId: store.id,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        _count: { select: { items: true } },
        items: { select: { productId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return discounts.map((discount) => this.formatDiscountResponse(discount));
  }

  async findOne(userId: string, id: string) {
    const discount = await this.verifyDiscountOwnership(id, userId);

    return this.formatDiscountResponse({
      ...discount,
      _count: { items: discount.items.length },
    });
  }

  async update(userId: string, id: string, dto: UpdateProductDiscountDto) {
    const existing = await this.verifyDiscountOwnership(id, userId);
    const previousProductIds = existing.items.map((item) => item.productId);

    const nextPercentage =
      dto.percentage !== undefined ? dto.percentage : Number(existing.percentage);
    const nextIsActive =
      dto.isActive !== undefined ? dto.isActive : existing.isActive;
    const nextProductIds =
      dto.productIds !== undefined
        ? await this.validateProductIds(existing.storeId, dto.productIds, id)
        : previousProductIds;

    const removedProductIds = previousProductIds.filter(
      (productId) => !nextProductIds.includes(productId),
    );

    const discount = await this.prisma.$transaction(async (tx) => {
      if (dto.productIds !== undefined) {
        await tx.product_discount_items.deleteMany({
          where: { discountId: id },
        });

        if (nextProductIds.length) {
          await tx.product_discount_items.createMany({
            data: nextProductIds.map((productId) => ({
              discountId: id,
              productId,
            })),
          });
        }
      }

      const updated = await tx.product_discounts.update({
        where: { id },
        data: {
          percentage: dto.percentage,
          isActive: dto.isActive,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate:
            dto.endDate === undefined
              ? undefined
              : dto.endDate
                ? new Date(dto.endDate)
                : null,
          updatedAt: new Date(),
        },
        include: {
          _count: { select: { items: true } },
          items: { select: { productId: true } },
        },
      });

      if (removedProductIds.length) {
        await tx.products.updateMany({
          where: { id: { in: removedProductIds } },
          data: { salePrice: null, updatedAt: new Date() },
        });
      }

      if (!nextIsActive) {
        await tx.products.updateMany({
          where: { id: { in: nextProductIds } },
          data: { salePrice: null, updatedAt: new Date() },
        });
      } else {
        const products = await tx.products.findMany({
          where: { id: { in: nextProductIds } },
          select: { id: true, price: true },
        });

        await Promise.all(
          products.map((product) =>
            tx.products.update({
              where: { id: product.id },
              data: {
                salePrice: this.calculateSalePrice(product.price, nextPercentage),
                updatedAt: new Date(),
              },
            }),
          ),
        );
      }

      return updated;
    });

    return this.formatDiscountResponse(discount);
  }

  async remove(userId: string, id: string) {
    const discount = await this.verifyDiscountOwnership(id, userId);
    const productIds = discount.items.map((item) => item.productId);

    await this.prisma.$transaction(async (tx) => {
      await tx.product_discounts.delete({ where: { id } });

      if (productIds.length) {
        await tx.products.updateMany({
          where: { id: { in: productIds } },
          data: { salePrice: null, updatedAt: new Date() },
        });
      }
    });

    return { message: 'تم حذف الخصم بنجاح' };
  }

  async toggleActive(userId: string, id: string) {
    const discount = await this.verifyDiscountOwnership(id, userId);
    const productIds = discount.items.map((item) => item.productId);
    const nextIsActive = !discount.isActive;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.product_discounts.update({
        where: { id },
        data: {
          isActive: nextIsActive,
          updatedAt: new Date(),
        },
        include: {
          _count: { select: { items: true } },
          items: { select: { productId: true } },
        },
      });

      if (nextIsActive) {
        const products = await tx.products.findMany({
          where: { id: { in: productIds } },
          select: { id: true, price: true },
        });

        await Promise.all(
          products.map((product) =>
            tx.products.update({
              where: { id: product.id },
              data: {
                salePrice: this.calculateSalePrice(
                  product.price,
                  Number(discount.percentage),
                ),
                updatedAt: new Date(),
              },
            }),
          ),
        );
      } else if (productIds.length) {
        await tx.products.updateMany({
          where: { id: { in: productIds } },
          data: { salePrice: null, updatedAt: new Date() },
        });
      }

      return row;
    });

    return this.formatDiscountResponse(updated);
  }
}
