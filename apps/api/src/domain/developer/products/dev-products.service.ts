import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { DeveloperAppStatus } from '@prisma/client';
import {
  isInstallableProductId,
  type DeveloperProductId,
} from './developer-product-catalog';

export interface InstalledProductDto {
  productId: DeveloperProductId;
  installedAt: string;
}

@Injectable()
export class DevProductsService {
  private static readonly APP_ID_PATTERN = /^\d{16}$/;

  constructor(private readonly prisma: PrismaService) {}

  private assertValidPublicAppId(publicAppId: string): void {
    if (!DevProductsService.APP_ID_PATTERN.test(publicAppId)) {
      throw new NotFoundException('App not found');
    }
  }

  async resolveOwnedApp(userId: string, publicAppId: string) {
    this.assertValidPublicAppId(publicAppId);
    const app = await this.prisma.developerApp.findFirst({
      where: {
        appId: publicAppId,
        userId,
        status: { not: DeveloperAppStatus.DELETED },
      },
      select: { id: true, appId: true, userId: true },
    });
    if (!app) throw new NotFoundException('App not found');
    return app;
  }

  async listInstalled(
    userId: string,
    publicAppId: string,
  ): Promise<InstalledProductDto[]> {
    const app = await this.resolveOwnedApp(userId, publicAppId);
    const rows = await this.prisma.developerAppProduct.findMany({
      where: { developerAppId: app.id },
      orderBy: { installedAt: 'asc' },
      select: { productId: true, installedAt: true },
    });
    return rows.map((row) => ({
      productId: row.productId as DeveloperProductId,
      installedAt: row.installedAt.toISOString(),
    }));
  }

  async isInstalled(
    userId: string,
    publicAppId: string,
    productId: DeveloperProductId,
  ): Promise<boolean> {
    const app = await this.resolveOwnedApp(userId, publicAppId);
    const row = await this.prisma.developerAppProduct.findUnique({
      where: {
        developerAppId_productId: {
          developerAppId: app.id,
          productId,
        },
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  async assertInstalledForApp(
    developerAppInternalId: string,
    productId: DeveloperProductId,
  ): Promise<void> {
    const row = await this.prisma.developerAppProduct.findUnique({
      where: {
        developerAppId_productId: {
          developerAppId: developerAppInternalId,
          productId,
        },
      },
      select: { id: true },
    });
    if (!row) {
      throw new ForbiddenException(
        `Product "${productId}" is not installed on this app`,
      );
    }
  }

  async install(
    userId: string,
    publicAppId: string,
    productId: string,
  ): Promise<InstalledProductDto> {
    if (!isInstallableProductId(productId)) {
      throw new BadRequestException('Product is not available for installation');
    }

    const app = await this.resolveOwnedApp(userId, publicAppId);

    const existing = await this.prisma.developerAppProduct.findUnique({
      where: {
        developerAppId_productId: {
          developerAppId: app.id,
          productId,
        },
      },
      select: { productId: true, installedAt: true },
    });

    if (existing) {
      return {
        productId: existing.productId as DeveloperProductId,
        installedAt: existing.installedAt.toISOString(),
      };
    }

    const created = await this.prisma.developerAppProduct.create({
      data: {
        developerAppId: app.id,
        productId,
        installedBy: userId,
      },
      select: { productId: true, installedAt: true },
    });

    if (productId === 'whatsapp') {
      await this.prisma.developerAppProduct.upsert({
        where: {
          developerAppId_productId: {
            developerAppId: app.id,
            productId: 'whatsappApi',
          },
        },
        create: {
          developerAppId: app.id,
          productId: 'whatsappApi',
          installedBy: userId,
        },
        update: {},
      });
    }

    return {
      productId: created.productId as DeveloperProductId,
      installedAt: created.installedAt.toISOString(),
    };
  }
}
