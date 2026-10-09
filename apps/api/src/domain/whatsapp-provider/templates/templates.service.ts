import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { MetaApiService } from '../shared/meta-api.service';
import { TokenEncryptionService } from '../shared/token-encryption.service';
import { CreateTemplateDto } from './dto/template.dto';
import {
  CreateTemplateFromLibraryDto,
  TemplateLibraryQueryDto,
} from './dto/template-library.dto';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    private prisma: PrismaService,
    private metaApi: MetaApiService,
    private tokenEncryption: TokenEncryptionService,
  ) {}

  /**
   * Accepts either the public 16-digit appId (JWT portal) or the internal
   * developerApp UUID (API-key public routes).
   */
  private async resolveDeveloperAppId(userId: string, appIdOrUuid: string) {
    const looksLikeUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        appIdOrUuid,
      );

    const app = await this.prisma.developerApp.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        ...(looksLikeUuid ? { id: appIdOrUuid } : { appId: appIdOrUuid }),
      },
      select: { id: true },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    return app.id;
  }

  /**
   * إنشاء قالب جديد
   */
  async create(userId: string, appId: string, dto: CreateTemplateDto) {
    const account = await this.getActiveAccount(userId, appId, dto.accountId);
    const accessToken = this.tokenEncryption.decrypt(
      account.accessTokenEncrypted,
    );

    // إرسال لـ Meta
    try {
      const result = await this.metaApi.createTemplate(
        account.wabaId,
        accessToken,
        {
          name: dto.name,
          language: dto.language,
          category: dto.category,
          components: dto.components,
        },
      );

      // تخزين القالب محلياً
      const template = await this.prisma.developerWhatsappTemplate.create({
        data: {
          accountId: account.id,
          metaTemplateId: result.id,
          name: dto.name,
          language: dto.language,
          category: dto.category as any,
          status: 'PENDING',
          components: dto.components,
          lastSyncedAt: new Date(),
        },
      });

      return template;
    } catch (error) {
      const errorData = error.response?.data?.error || {};
      throw new BadRequestException({
        message: 'Failed to create template',
        error: errorData.message || error.message,
        code: errorData.code,
      });
    }
  }

  /**
   * قائمة القوالب
   */
  async findAll(userId: string, appId: string, accountId?: string) {
    const developerAppId = await this.resolveDeveloperAppId(userId, appId);
    const accounts = await this.prisma.developerWhatsappAccount.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        developerAppId,
      },
      select: { id: true },
    });

    const accountIds = accounts.map((a) => a.id);

    // If a specific account is requested, validate it belongs to this user
    const filterIds =
      accountId && accountIds.includes(accountId) ? [accountId] : accountIds;

    return this.prisma.developerWhatsappTemplate.findMany({
      where: { accountId: { in: filterIds } },
      include: {
        account: {
          select: { id: true, businessName: true, wabaId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * تفاصيل قالب
   */
  async findOne(userId: string, appId: string, templateName: string) {
    const developerAppId = await this.resolveDeveloperAppId(userId, appId);
    const accounts = await this.prisma.developerWhatsappAccount.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        developerAppId,
      },
      select: { id: true },
    });

    const template = await this.prisma.developerWhatsappTemplate.findFirst({
      where: {
        accountId: { in: accounts.map((a) => a.id) },
        name: templateName,
      },
    });

    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  /**
   * حذف قالب
   */
  async remove(userId: string, appId: string, templateName: string) {
    const account = await this.getActiveAccount(userId, appId);
    const accessToken = this.tokenEncryption.decrypt(
      account.accessTokenEncrypted,
    );

    try {
      await this.metaApi.deleteTemplate(
        account.wabaId,
        accessToken,
        templateName,
      );
    } catch (error) {
      this.logger.warn(`Failed to delete template from Meta: ${error.message}`);
    }

    await this.prisma.developerWhatsappTemplate.deleteMany({
      where: { accountId: account.id, name: templateName },
    });

    return { success: true };
  }

  /**
   * Browse Meta Template Library (pre-built templates).
   */
  async browseLibrary(
    userId: string,
    appId: string,
    query: TemplateLibraryQueryDto,
    accountId?: string,
  ) {
    const account = await this.getActiveAccount(userId, appId, accountId);
    const accessToken = this.tokenEncryption.decrypt(
      account.accessTokenEncrypted,
    );

    try {
      const result = await this.metaApi.listTemplateLibrary(accessToken, {
        search: query.search,
        topic: query.topic,
        usecase: query.usecase,
        industry: query.industry,
        language: query.language,
        name: query.name,
        after: query.after,
        limit: query.limit,
      });

      const data = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result)
          ? result
          : [];

      return {
        data,
        paging: result?.paging ?? null,
      };
    } catch (error) {
      const errorData = error.response?.data?.error || {};
      throw new BadRequestException({
        message: 'Failed to load template library',
        error: errorData.message || error.message,
        code: errorData.code,
      });
    }
  }

  /**
   * Create a WABA template from a Meta library template.
   */
  async createFromLibrary(
    userId: string,
    appId: string,
    dto: CreateTemplateFromLibraryDto,
  ) {
    const account = await this.getActiveAccount(userId, appId, dto.accountId);
    const accessToken = this.tokenEncryption.decrypt(
      account.accessTokenEncrypted,
    );

    try {
      const result = await this.metaApi.createTemplateFromLibrary(
        account.wabaId,
        accessToken,
        {
          name: dto.name,
          language: dto.language,
          category: dto.category,
          library_template_name: dto.libraryTemplateName,
          ...(dto.libraryTemplateButtonInputs?.length
            ? {
                library_template_button_inputs: dto.libraryTemplateButtonInputs,
              }
            : {}),
          ...(dto.libraryTemplateBodyInputs
            ? {
                library_template_body_inputs: dto.libraryTemplateBodyInputs,
              }
            : {}),
        },
      );

      const status = this.mapTemplateStatus(result.status || 'PENDING');

      const template = await this.prisma.developerWhatsappTemplate.upsert({
        where: {
          accountId_name_language: {
            accountId: account.id,
            name: dto.name,
            language: dto.language,
          },
        },
        update: {
          metaTemplateId: result.id,
          status,
          category: dto.category as any,
          lastSyncedAt: new Date(),
        },
        create: {
          accountId: account.id,
          metaTemplateId: result.id,
          name: dto.name,
          language: dto.language,
          category: dto.category as any,
          status,
          components: [],
          lastSyncedAt: new Date(),
        },
      });

      return template;
    } catch (error) {
      const errorData = error.response?.data?.error || {};
      throw new BadRequestException({
        message: 'Failed to create template from library',
        error: errorData.message || error.message,
        code: errorData.code,
      });
    }
  }

  /**
   * مزامنة القوالب مع Meta
   */
  async syncTemplates(userId: string, appId: string, accountId?: string) {
    const account = await this.getActiveAccount(userId, appId, accountId);
    const accessToken = this.tokenEncryption.decrypt(
      account.accessTokenEncrypted,
    );

    const metaTemplates = await this.metaApi.listTemplates(
      account.wabaId,
      accessToken,
    );

    for (const mt of metaTemplates.data || []) {
      await this.prisma.developerWhatsappTemplate.upsert({
        where: {
          accountId_name_language: {
            accountId: account.id,
            name: mt.name,
            language: mt.language,
          },
        },
        update: {
          metaTemplateId: mt.id,
          status: this.mapTemplateStatus(mt.status),
          components: mt.components,
          category: mt.category,
          rejectedReason: mt.rejected_reason,
          qualityScore: mt.quality_score,
          lastSyncedAt: new Date(),
        },
        create: {
          accountId: account.id,
          metaTemplateId: mt.id,
          name: mt.name,
          language: mt.language,
          category: mt.category,
          status: this.mapTemplateStatus(mt.status),
          components: mt.components,
          rejectedReason: mt.rejected_reason,
          qualityScore: mt.quality_score,
          lastSyncedAt: new Date(),
        },
      });
    }

    return { synced: metaTemplates.data?.length || 0 };
  }

  /**
   * الحصول على أول حساب WABA نشط
   */
  private async getActiveAccount(
    userId: string,
    appId: string,
    accountId?: string,
  ) {
    const developerAppId = await this.resolveDeveloperAppId(userId, appId);

    const where: any = {
      userId,
      status: 'ACTIVE',
      developerAppId,
    };

    if (accountId) {
      where.id = accountId;
    }

    const account = await this.prisma.developerWhatsappAccount.findFirst({
      where,
    });

    if (!account || !account.accessTokenEncrypted) {
      throw new BadRequestException(
        'No active WhatsApp Business Account found',
      );
    }

    return account;
  }

  private mapTemplateStatus(status: string): any {
    const map: Record<string, string> = {
      APPROVED: 'APPROVED',
      PENDING: 'PENDING',
      REJECTED: 'REJECTED',
      PAUSED: 'PAUSED',
      DISABLED: 'DISABLED',
    };
    return map[status] || 'PENDING';
  }
}
