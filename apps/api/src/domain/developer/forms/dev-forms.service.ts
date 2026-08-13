import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { FormTeamAccessService } from '../../forms/form-team/form-team-access.service';
import {
  buildAllowedEmbedAncestors,
  normalizeEmbedOrigins,
  parseOriginFromUrl,
} from './embed-origins.util';
import { ACTIVE_FORM_FILTER } from '../../forms/utils/forms-deletion.util';
import { DeveloperAppStatus, FormStatus } from '@prisma/client';
import { DevProductsService } from '../products/dev-products.service';
import {
  createFormDeveloperLinkChallenge,
  verifyFormDeveloperLinkChallenge,
} from './form-developer-link-challenge.util';

const FORM_LINK_SELECT = {
  id: true,
  title: true,
  slug: true,
  status: true,
  submissionCount: true,
  viewCount: true,
  webhookEnabled: true,
  webhookUrl: true,
  developerAppId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class DevFormsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly formTeamAccess: FormTeamAccessService,
    private readonly devProducts: DevProductsService,
  ) {}

  private async resolveOwnedApp(userId: string, publicAppId: string) {
    const app = await this.prisma.developerApp.findFirst({
      where: {
        appId: publicAppId,
        userId,
        status: { not: DeveloperAppStatus.DELETED },
      },
      select: {
        id: true,
        appId: true,
        name: true,
        websiteUrl: true,
        embedAllowedOrigins: true,
      },
    });
    if (!app) throw new NotFoundException('App not found');
    return app;
  }

  private async resolveOwnedAppWithForms(userId: string, publicAppId: string) {
    const app = await this.resolveOwnedApp(userId, publicAppId);
    await this.devProducts.assertInstalledForApp(app.id, 'forms');
    return app;
  }

  private async getFormForUser(formId: string, userId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, ...ACTIVE_FORM_FILTER },
      select: {
        id: true,
        userId: true,
        title: true,
        slug: true,
        status: true,
        developerAppId: true,
      },
    });
    if (!form) throw new NotFoundException('Form not found');
    await this.formTeamAccess.assertFormPermission(
      form,
      userId,
      'manage_integrations',
      'Not authorized to manage integrations for this form',
    );
    return form;
  }

  private emptySummary(app: {
    appId: string;
    websiteUrl: string | null;
    embedAllowedOrigins: string[];
  }) {
    return {
      appId: app.appId,
      linkedCount: 0,
      publishedCount: 0,
      totalSubmissions: 0,
      totalViews: 0,
      embedOrigins: buildAllowedEmbedAncestors(app),
      embedAllowedConfigured: app.embedAllowedOrigins,
      websiteOrigin: parseOriginFromUrl(app.websiteUrl),
      formsInstalled: false,
    };
  }

  async getSummary(userId: string, publicAppId: string) {
    const app = await this.resolveOwnedApp(userId, publicAppId);
    const installed = await this.prisma.developerAppProduct.findUnique({
      where: {
        developerAppId_productId: {
          developerAppId: app.id,
          productId: 'forms',
        },
      },
      select: { id: true },
    });
    if (!installed) return this.emptySummary(app);

    const linked = await this.prisma.form.findMany({
      where: { developerAppId: app.id, ...ACTIVE_FORM_FILTER },
      select: {
        submissionCount: true,
        viewCount: true,
        status: true,
      },
    });

    const published = linked.filter((f) => f.status === FormStatus.PUBLISHED);

    return {
      appId: app.appId,
      linkedCount: linked.length,
      publishedCount: published.length,
      totalSubmissions: linked.reduce((sum, f) => sum + f.submissionCount, 0),
      totalViews: linked.reduce((sum, f) => sum + f.viewCount, 0),
      embedOrigins: buildAllowedEmbedAncestors(app),
      embedAllowedConfigured: app.embedAllowedOrigins,
      websiteOrigin: parseOriginFromUrl(app.websiteUrl),
      formsInstalled: true,
    };
  }

  async listLinked(userId: string, publicAppId: string) {
    const app = await this.resolveOwnedApp(userId, publicAppId);
    const installed = await this.prisma.developerAppProduct.findUnique({
      where: {
        developerAppId_productId: {
          developerAppId: app.id,
          productId: 'forms',
        },
      },
      select: { id: true },
    });
    if (!installed) return [];

    const forms = await this.prisma.form.findMany({
      where: { developerAppId: app.id, ...ACTIVE_FORM_FILTER },
      select: FORM_LINK_SELECT,
      orderBy: { updatedAt: 'desc' },
    });

    return forms.map((form) => this.toLinkedFormDto(form, app));
  }

  async listAvailableToLink(userId: string, publicAppId: string) {
    const app = await this.resolveOwnedAppWithForms(userId, publicAppId);
    const ownerIds = await this.formTeamAccess.listAccessibleOwnerIds(userId);

    const forms = await this.prisma.form.findMany({
      where: {
        userId: { in: ownerIds },
        ...ACTIVE_FORM_FILTER,
        OR: [{ developerAppId: null }, { developerAppId: app.id }],
      },
      select: FORM_LINK_SELECT,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    return forms.map((form) => ({
      ...this.toLinkedFormDto(form, app),
      isLinked: form.developerAppId === app.id,
      linkedElsewhere: Boolean(
        form.developerAppId && form.developerAppId !== app.id,
      ),
    }));
  }

  async getLinkedForm(userId: string, publicAppId: string, formId: string) {
    const app = await this.resolveOwnedAppWithForms(userId, publicAppId);
    await this.getFormForUser(formId, userId);

    const form = await this.prisma.form.findFirst({
      where: {
        id: formId,
        developerAppId: app.id,
        ...ACTIVE_FORM_FILTER,
      },
      select: FORM_LINK_SELECT,
    });
    if (!form) throw new NotFoundException('Form is not linked to this app');

    const embedOrigins = buildAllowedEmbedAncestors(app);

    return {
      ...this.toLinkedFormDto(form, app),
      embed: {
        allowedOrigins: embedOrigins,
        embedEnabled: embedOrigins.length > 0 && form.status === FormStatus.PUBLISHED,
        requiresWebsiteOrOrigins: embedOrigins.length === 0,
      },
    };
  }

  async linkForm(userId: string, publicAppId: string, formId: string) {
    const app = await this.resolveOwnedAppWithForms(userId, publicAppId);
    const form = await this.getFormForUser(formId, userId);

    if (form.developerAppId && form.developerAppId !== app.id) {
      throw new ConflictException(
        'This form is already linked to another application',
      );
    }

    const updated = await this.prisma.form.update({
      where: { id: formId },
      data: { developerAppId: app.id },
      select: FORM_LINK_SELECT,
    });

    return this.toLinkedFormDto(updated, app);
  }

  async unlinkForm(userId: string, publicAppId: string, formId: string) {
    const app = await this.resolveOwnedAppWithForms(userId, publicAppId);
    await this.getFormForUser(formId, userId);

    const form = await this.prisma.form.findFirst({
      where: { id: formId, developerAppId: app.id, ...ACTIVE_FORM_FILTER },
      select: { id: true },
    });
    if (!form) throw new NotFoundException('Form is not linked to this app');

    const updated = await this.prisma.form.update({
      where: { id: formId },
      data: { developerAppId: null },
      select: FORM_LINK_SELECT,
    });

    return this.toLinkedFormDto(updated, app);
  }

  async updateEmbedOrigins(
    userId: string,
    publicAppId: string,
    allowedOrigins: string[],
  ) {
    const app = await this.resolveOwnedAppWithForms(userId, publicAppId);
    const normalized = normalizeEmbedOrigins(allowedOrigins);

    const updated = await this.prisma.developerApp.update({
      where: { id: app.id },
      data: { embedAllowedOrigins: normalized },
      select: {
        appId: true,
        websiteUrl: true,
        embedAllowedOrigins: true,
      },
    });

    return {
      appId: updated.appId,
      allowedOrigins: buildAllowedEmbedAncestors(updated),
      configuredOrigins: updated.embedAllowedOrigins,
    };
  }

  private toLinkedFormDto(
    form: {
      id: string;
      title: string;
      slug: string;
      status: FormStatus;
      submissionCount: number;
      viewCount: number;
      webhookEnabled: boolean;
      webhookUrl: string | null;
      developerAppId: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    app: { appId: string; websiteUrl: string | null; embedAllowedOrigins: string[] },
  ) {
    const embedOrigins = buildAllowedEmbedAncestors(app);

    return {
      id: form.id,
      title: form.title,
      slug: form.slug,
      status: form.status,
      submissionCount: form.submissionCount,
      viewCount: form.viewCount,
      webhookEnabled: form.webhookEnabled,
      webhookUrl: form.webhookUrl,
      isLinked: form.developerAppId !== null,
      createdAt: form.createdAt.toISOString(),
      updatedAt: form.updatedAt.toISOString(),
      embedReady:
        embedOrigins.length > 0 && form.status === FormStatus.PUBLISHED,
    };
  }

  /** Embed integration status for the Forms dashboard (تكاملات النموذج). */
  async getFormDeveloperEmbed(userId: string, formId: string) {
    const form = await this.getFormForUser(formId, userId);

    if (!form.developerAppId) {
      return { linked: false as const };
    }

    const app = await this.prisma.developerApp.findFirst({
      where: {
        id: form.developerAppId,
        status: { not: DeveloperAppStatus.DELETED },
      },
      select: {
        appId: true,
        name: true,
        websiteUrl: true,
        embedAllowedOrigins: true,
      },
    });

    if (!app) {
      return { linked: false as const };
    }

    const embedOrigins = buildAllowedEmbedAncestors(app);

    return {
      linked: true as const,
      app: {
        appId: app.appId,
        name: app.name,
      },
      slug: form.slug,
      status: form.status,
      embedReady:
        embedOrigins.length > 0 && form.status === FormStatus.PUBLISHED,
      embed: {
        allowedOrigins: embedOrigins,
        embedEnabled:
          embedOrigins.length > 0 && form.status === FormStatus.PUBLISHED,
        requiresWebsiteOrOrigins: embedOrigins.length === 0,
        websiteOrigin: parseOriginFromUrl(app.websiteUrl),
      },
    };
  }

  /** Apps the form owner may link to — scoped to owned apps with Forms product installed. */
  async listFormLinkTargets(userId: string, formId: string) {
    const form = await this.getFormForUser(formId, userId);

    if (form.developerAppId) {
      const linkedApp = await this.prisma.developerApp.findFirst({
        where: {
          id: form.developerAppId,
          status: { not: DeveloperAppStatus.DELETED },
        },
        select: {
          appId: true,
          name: true,
          websiteUrl: true,
        },
      });

      return {
        canLink: false as const,
        reason: 'already_linked' as const,
        linkedApp: linkedApp
          ? {
              appId: linkedApp.appId,
              name: linkedApp.name,
              websiteOrigin: parseOriginFromUrl(linkedApp.websiteUrl),
            }
          : null,
        targets: [] as const,
      };
    }

    const apps = await this.prisma.developerApp.findMany({
      where: {
        userId,
        status: DeveloperAppStatus.ACTIVE,
      },
      select: {
        id: true,
        appId: true,
        name: true,
        websiteUrl: true,
        installedProducts: {
          where: { productId: 'forms' },
          select: { id: true },
          take: 1,
        },
        _count: {
          select: {
            forms: {
              where: ACTIVE_FORM_FILTER,
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });

    const targets = apps
      .filter((app) => app.installedProducts.length > 0)
      .map((app) => {
        const websiteOrigin = parseOriginFromUrl(app.websiteUrl);
        return {
          appId: app.appId,
          name: app.name,
          websiteOrigin,
          domainConfigured: Boolean(websiteOrigin),
          linkedFormsCount: app._count.forms,
          linkChallenge: createFormDeveloperLinkChallenge({
            formId,
            appInternalId: app.id,
            userId,
          }),
        };
      });

    return {
      canLink: true as const,
      reason: null,
      linkedApp: null,
      targets,
    };
  }

  /** Link form from Forms dashboard — requires a fresh signed challenge from listFormLinkTargets. */
  async linkFormWithChallenge(
    userId: string,
    formId: string,
    publicAppId: string,
    linkChallenge: string,
  ) {
    await this.getFormForUser(formId, userId);

    const verified = verifyFormDeveloperLinkChallenge(linkChallenge, {
      formId,
      userId,
    });
    if (!verified) {
      throw new BadRequestException(
        'رمز التأكيد غير صالح أو منتهٍ — أعد تحميل قائمة التطبيقات وحاول مجدداً',
      );
    }

    const app = await this.prisma.developerApp.findFirst({
      where: {
        id: verified.appInternalId,
        userId,
        appId: publicAppId,
        status: DeveloperAppStatus.ACTIVE,
      },
      select: { id: true, appId: true },
    });

    if (!app) {
      throw new ForbiddenException('التطبيق غير متاح للربط');
    }

    await this.devProducts.assertInstalledForApp(app.id, 'forms');

    return this.linkForm(userId, publicAppId, formId);
  }

  async getPublicEmbedPolicy(slug: string) {
    const form = await this.prisma.form.findFirst({
      where: {
        slug,
        ...ACTIVE_FORM_FILTER,
        status: FormStatus.PUBLISHED,
        developerAppId: { not: null },
      },
      select: {
        developerApp: {
          select: {
            status: true,
            websiteUrl: true,
            embedAllowedOrigins: true,
          },
        },
      },
    });

    if (!form?.developerApp) return null;
    if (form.developerApp.status !== DeveloperAppStatus.ACTIVE) return null;

    const allowedAncestors = buildAllowedEmbedAncestors(form.developerApp);
    if (allowedAncestors.length === 0) return null;

    return { slug, allowedAncestors };
  }
}
