import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import {
  CreateProductCollectionDto,
  UpdateProductCollectionDto,
} from './dto/product-collection.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductCollectionsService {
  private readonly logger = new Logger(ProductCollectionsService.name);

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

  private async verifyCollectionOwnership(collectionId: string, userId: string) {
    const collection = await this.prisma.product_collections.findUnique({
      where: { id: collectionId },
      include: {
        stores: {
          select: { userId: true },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException('لم يتم العثور على المجموعة');
    }

    if (collection.stores.userId !== userId) {
      throw new ForbiddenException('ليس لديك صلاحية لتعديل هذه المجموعة');
    }

    return collection;
  }

  private async generateUniqueSlug(storeId: string, name: string): Promise<string> {
    let baseSlug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40);

    if (!baseSlug) {
      baseSlug = `collection-${uuidv4().slice(0, 8)}`;
    }

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.product_collections.findUnique({
        where: {
          storeId_slug: {
            storeId,
            slug,
          },
        },
      });

      if (!existing) break;

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private formatCollectionResponse(collection: {
    id: string;
    storeId: string;
    name: string;
    nameAr: string | null;
    slug: string;
    description: string | null;
    imagePath: string | null;
    bannerPath: string | null;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count?: { items: number };
    items?: Array<{ productId: string; order: number }>;
  }) {
    if (!collection) return null;

    const productIds = (collection.items ?? [])
      .sort((a, b) => a.order - b.order)
      .map((item) => item.productId);

    return {
      id: collection.id,
      storeId: collection.storeId,
      name: collection.name,
      nameAr: collection.nameAr ?? undefined,
      slug: collection.slug,
      description: collection.description ?? undefined,
      imagePath: collection.imagePath ?? undefined,
      bannerPath: collection.bannerPath ?? undefined,
      order: collection.order,
      isActive: collection.isActive,
      productsCount: collection._count?.items ?? productIds.length,
      productIds,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    };
  }

  private async validateProductIds(storeId: string, productIds: string[]) {
    if (!productIds.length) return;

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
  }

  async create(userId: string, dto: CreateProductCollectionDto) {
    const store = await this.getUserStore(userId);

    if (!dto.name && !dto.nameAr) {
      throw new BadRequestException('يرجى إدخال اسم المجموعة');
    }

    const collectionsCount = await this.prisma.product_collections.count({
      where: { storeId: store.id },
    });

    if (collectionsCount >= 100) {
      throw new BadRequestException('تم الوصول للحد الأقصى من المجموعات (100 مجموعة)');
    }

    const nameForSlug = dto.name || dto.nameAr || 'collection';
    const slug = dto.slug || (await this.generateUniqueSlug(store.id, nameForSlug));

    if (dto.slug) {
      const existing = await this.prisma.product_collections.findUnique({
        where: {
          storeId_slug: {
            storeId: store.id,
            slug: dto.slug,
          },
        },
      });

      if (existing) {
        throw new BadRequestException('الرابط المختصر مستخدم بالفعل');
      }
    }

    const productIds = dto.productIds ?? [];
    await this.validateProductIds(store.id, productIds);

    const maxOrder = await this.prisma.product_collections.aggregate({
      where: { storeId: store.id },
      _max: { order: true },
    });

    const order = dto.order ?? (maxOrder._max.order ?? -1) + 1;

    const collection = await this.prisma.product_collections.create({
      data: {
        id: uuidv4(),
        storeId: store.id,
        name: dto.name || dto.nameAr || 'Unnamed',
        nameAr: dto.nameAr,
        slug,
        description: dto.description,
        imagePath: dto.imagePath,
        bannerPath: dto.bannerPath,
        order,
        isActive: dto.isActive ?? true,
        updatedAt: new Date(),
        items: {
          create: productIds.map((productId, index) => ({
            productId,
            order: index,
          })),
        },
      },
      include: {
        _count: { select: { items: true } },
        items: { select: { productId: true, order: true } },
      },
    });

    this.logger.log(`Collection created: ${collection.id} for store ${store.id}`);

    return this.formatCollectionResponse(collection);
  }

  async findAll(userId: string, includeInactive = false) {
    const store = await this.getUserStore(userId);

    const where: { storeId: string; isActive?: boolean } = { storeId: store.id };
    if (!includeInactive) {
      where.isActive = true;
    }

    const collections = await this.prisma.product_collections.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { items: true } },
        items: { select: { productId: true, order: true } },
      },
    });

    return collections.map((collection) => this.formatCollectionResponse(collection));
  }

  async findOne(userId: string, collectionId: string) {
    await this.verifyCollectionOwnership(collectionId, userId);

    const collection = await this.prisma.product_collections.findUnique({
      where: { id: collectionId },
      include: {
        _count: { select: { items: true } },
        items: { select: { productId: true, order: true } },
      },
    });

    return this.formatCollectionResponse(collection!);
  }

  async update(
    userId: string,
    collectionId: string,
    dto: UpdateProductCollectionDto,
  ) {
    await this.verifyCollectionOwnership(collectionId, userId);
    const store = await this.getUserStore(userId);

    if (dto.slug) {
      const existing = await this.prisma.product_collections.findFirst({
        where: {
          storeId: store.id,
          slug: dto.slug,
          id: { not: collectionId },
        },
      });

      if (existing) {
        throw new BadRequestException('الرابط المختصر مستخدم بالفعل');
      }
    }

    const { productIds, ...rest } = dto;

    if (productIds) {
      await this.validateProductIds(store.id, productIds);
    }

    const collection = await this.prisma.$transaction(async (tx) => {
      if (productIds) {
        await tx.product_collection_items.deleteMany({
          where: { collectionId },
        });

        if (productIds.length > 0) {
          await tx.product_collection_items.createMany({
            data: productIds.map((productId, index) => ({
              collectionId,
              productId,
              order: index,
            })),
          });
        }
      }

      return tx.product_collections.update({
        where: { id: collectionId },
        data: {
          ...rest,
          updatedAt: new Date(),
        },
        include: {
          _count: { select: { items: true } },
          items: { select: { productId: true, order: true } },
        },
      });
    });

    this.logger.log(`Collection updated: ${collectionId}`);

    return this.formatCollectionResponse(collection);
  }

  async remove(userId: string, collectionId: string) {
    await this.verifyCollectionOwnership(collectionId, userId);

    await this.prisma.product_collections.delete({
      where: { id: collectionId },
    });

    this.logger.log(`Collection deleted: ${collectionId}`);

    return { success: true, message: 'تم حذف المجموعة بنجاح' };
  }

  async reorder(userId: string, collectionIds: string[]) {
    const store = await this.getUserStore(userId);

    const collections = await this.prisma.product_collections.findMany({
      where: {
        id: { in: collectionIds },
        storeId: store.id,
      },
      select: { id: true },
    });

    if (collections.length !== collectionIds.length) {
      throw new BadRequestException('بعض المجموعات غير موجودة أو لا تنتمي لمتجرك');
    }

    await this.prisma.$transaction(
      collectionIds.map((id, index) =>
        this.prisma.product_collections.update({
          where: { id },
          data: { order: index, updatedAt: new Date() },
        }),
      ),
    );

    return { success: true };
  }

  async toggleActive(userId: string, collectionId: string) {
    const collection = await this.verifyCollectionOwnership(collectionId, userId);

    const updated = await this.prisma.product_collections.update({
      where: { id: collectionId },
      data: {
        isActive: !collection.isActive,
        updatedAt: new Date(),
      },
      include: {
        _count: { select: { items: true } },
        items: { select: { productId: true, order: true } },
      },
    });

    return this.formatCollectionResponse(updated);
  }
}
