import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { DevSubscriptionsService } from '../subscriptions/dev-subscriptions.service';
import { SubmitMetaPortfolioRequestDto } from './dto/submit-meta-portfolio-request.dto';

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'mail.com',
  'yandex.com',
  'yandex.ru',
]);

export const META_PORTFOLIO_FIELD_DEFS = [
  {
    key: 'businessName',
    label: 'Business name',
    labelAr: 'اسم النشاط التجاري',
    requirement:
      'Official name as it appears on the website and will appear in Meta',
    requirementAr: 'الاسم الرسمي كما يظهر على الموقع وكما سيظهر في Meta',
  },
  {
    key: 'domain',
    label: 'Custom domain',
    labelAr: 'النطاق الخاص',
    requirement:
      'A domain named after the business (not a free public mailbox domain)',
    requirementAr:
      'نطاق خاص باسم النشاط (ليس نطاقاً مجانياً عاماً مثل Gmail)',
  },
  {
    key: 'businessEmail',
    label: 'Business email',
    labelAr: 'بريد النشاط',
    requirement: 'Email on the same domain, e.g. info@example.com',
    requirementAr: 'بريد على نفس النطاق، مثل info@example.com',
  },
  {
    key: 'websiteUrl',
    label: 'Website URL',
    labelAr: 'رابط الموقع',
    requirement: 'A live https site that clearly shows the business name',
    requirementAr: 'موقع حي (https) يظهر فيه اسم النشاط بوضوح',
  },
  {
    key: 'businessDescription',
    label: 'Business description',
    labelAr: 'وصف مختصر للنشاط',
    requirement: 'Brief description of what the business does for reviewers',
    requirementAr: 'وصف مختصر لطبيعة العمل لمساعدة المراجعة',
  },
  {
    key: 'appId',
    label: 'Developer app',
    labelAr: 'تطبيق المطوّر المستهدف',
    requirement: 'The app that will later connect WhatsApp',
    requirementAr: 'التطبيق الذي سيُربط به WhatsApp لاحقاً',
  },
] as const;

const OWNERSHIP = 'owned_by_rukny' as const;

@Injectable()
export class MetaPortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: DevSubscriptionsService,
  ) {}

  private normalizeDomain(raw: string): string {
    return raw
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/\.$/, '');
  }

  private emailDomain(email: string): string {
    const at = email.lastIndexOf('@');
    if (at < 0) return '';
    return email.slice(at + 1).trim().toLowerCase();
  }

  private assertDomainEmailMatch(domain: string, email: string) {
    const normalizedDomain = this.normalizeDomain(domain);
    const mailDomain = this.emailDomain(email);

    if (!normalizedDomain || !mailDomain) {
      throw new BadRequestException('Domain and business email are required');
    }

    if (FREE_EMAIL_DOMAINS.has(normalizedDomain)) {
      throw new BadRequestException(
        'Use a custom business domain, not a free public email domain',
      );
    }

    if (FREE_EMAIL_DOMAINS.has(mailDomain)) {
      throw new BadRequestException(
        'Business email must use your custom domain, not a free mailbox provider',
      );
    }

    const domainMatches =
      mailDomain === normalizedDomain ||
      mailDomain.endsWith(`.${normalizedDomain}`);

    if (!domainMatches) {
      throw new BadRequestException(
        'Business email must be on the same domain you submitted',
      );
    }

    return normalizedDomain;
  }

  private serializeRequest(
    request: {
      id: string;
      developerAppId: string;
      businessName: string;
      domain: string;
      businessEmail: string;
      websiteUrl: string;
      businessDescription: string;
      status: string;
      rejectionReason: string | null;
      metaBusinessId: string | null;
      submittedAt: Date;
      reviewedAt: Date | null;
      developerApp?: { appId: string; name: string } | null;
    } | null,
  ) {
    if (!request) return null;
    return {
      id: request.id,
      developerAppId: request.developerAppId,
      appId: request.developerApp?.appId ?? null,
      appName: request.developerApp?.name ?? null,
      businessName: request.businessName,
      domain: request.domain,
      businessEmail: request.businessEmail,
      websiteUrl: request.websiteUrl,
      businessDescription: request.businessDescription,
      status: request.status,
      rejectionReason: request.rejectionReason,
      metaBusinessId:
        request.status === 'fulfilled' || request.status === 'approved'
          ? request.metaBusinessId
          : null,
      submittedAt: request.submittedAt,
      reviewedAt: request.reviewedAt,
      ownership: OWNERSHIP,
    };
  }

  async getStatus(userId: string) {
    const effectivePlan = await this.subscriptions.resolveEffectivePlan(userId);
    const isPro = effectivePlan === 'PRO';

    const [latest, apps] = await Promise.all([
      this.prisma.metaBusinessPortfolioRequest.findFirst({
        where: { userId },
        orderBy: { submittedAt: 'desc' },
        include: {
          developerApp: { select: { appId: true, name: true } },
        },
      }),
      this.prisma.developerApp.findMany({
        where: { userId, status: 'ACTIVE' },
        select: { appId: true, name: true, id: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const openRequests = await this.prisma.metaBusinessPortfolioRequest.findMany({
      where: {
        userId,
        status: { in: ['pending', 'approved', 'fulfilled'] },
      },
      select: { developerAppId: true, status: true },
    });
    const pendingAppIds = new Set(
      openRequests
        .filter((r) => r.status === 'pending')
        .map((r) => r.developerAppId),
    );
    const assignedAppIds = new Set(
      openRequests
        .filter((r) => r.status === 'approved' || r.status === 'fulfilled')
        .map((r) => r.developerAppId),
    );

    const appSummaries = apps.map((app) => ({
      appId: app.appId,
      name: app.name,
      hasPendingRequest: pendingAppIds.has(app.id),
      hasAssignedPortfolio: assignedAppIds.has(app.id),
      canRequest:
        !pendingAppIds.has(app.id) && !assignedAppIds.has(app.id),
    }));

    return {
      ownership: OWNERSHIP,
      reviewSlaNote:
        'Review time is estimated and may take more than 5 days depending on Meta and operations.',
      reviewSlaNoteAr:
        'مدة المراجعة تقديرية وقد تتجاوز 5 أيام حسب Meta والتشغيل.',
      effectivePlan,
      isPro,
      canApply: isPro && appSummaries.some((a) => a.canRequest),
      fields: META_PORTFOLIO_FIELD_DEFS,
      eligibility: {
        proActive: isPro,
        hasApp: apps.length > 0,
        ownershipUnderstood: true,
        variableReviewTime: true,
      },
      apps: appSummaries,
      latestRequest: this.serializeRequest(latest),
    };
  }

  async submit(userId: string, dto: SubmitMetaPortfolioRequestDto) {
    const effectivePlan = await this.subscriptions.resolveEffectivePlan(userId);
    if (effectivePlan !== 'PRO') {
      throw new ForbiddenException({
        message: 'Meta Business Portfolio requests require an active Pro plan',
        code: 'PRO_REQUIRED',
      });
    }

    const domain = this.assertDomainEmailMatch(dto.domain, dto.businessEmail);
    const businessEmail = dto.businessEmail.trim().toLowerCase();
    const websiteUrl = dto.websiteUrl.trim();
    const businessName = dto.businessName.trim();
    const businessDescription = dto.businessDescription.trim();

    const app = await this.prisma.developerApp.findFirst({
      where: { userId, appId: dto.appId.trim(), status: 'ACTIVE' },
      select: { id: true, appId: true, name: true },
    });

    if (!app) {
      throw new NotFoundException('Developer app not found');
    }

    const pending = await this.prisma.metaBusinessPortfolioRequest.findFirst({
      where: { developerAppId: app.id, status: 'pending' },
    });

    if (pending) {
      throw new BadRequestException(
        'This app already has a Meta portfolio request pending review',
      );
    }

    const fulfilled = await this.prisma.metaBusinessPortfolioRequest.findFirst({
      where: {
        developerAppId: app.id,
        status: { in: ['approved', 'fulfilled'] },
      },
    });

    if (fulfilled) {
      throw new BadRequestException(
        'This app already has an approved or fulfilled Meta portfolio request',
      );
    }

    const request = await this.prisma.metaBusinessPortfolioRequest.create({
      data: {
        userId,
        developerAppId: app.id,
        businessName,
        domain,
        businessEmail,
        websiteUrl,
        businessDescription,
        status: 'pending',
      },
      include: {
        developerApp: { select: { appId: true, name: true } },
      },
    });

    return {
      success: true,
      message:
        'Request received. Review may take more than 5 days. The portfolio stays owned by Rukny; you can link and send messages after fulfillment.',
      request: this.serializeRequest(request),
    };
  }

  async listForAdmin(params: {
    page: number;
    limit: number;
    status?: string;
  }) {
    const page = Math.max(1, params.page);
    const limit = Math.min(100, Math.max(1, params.limit));
    const where =
      params.status && params.status !== 'all'
        ? { status: params.status }
        : {};

    const [total, rows] = await Promise.all([
      this.prisma.metaBusinessPortfolioRequest.count({ where }),
      this.prisma.metaBusinessPortfolioRequest.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          developerApp: { select: { appId: true, name: true } },
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { name: true, username: true } },
            },
          },
        },
      }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        status: row.status,
        businessName: row.businessName,
        domain: row.domain,
        businessEmail: row.businessEmail,
        websiteUrl: row.websiteUrl,
        businessDescription: row.businessDescription,
        metaBusinessId: row.metaBusinessId,
        rejectionReason: row.rejectionReason,
        submittedAt: row.submittedAt,
        reviewedAt: row.reviewedAt,
        reviewedBy: row.reviewedBy,
        ownership: OWNERSHIP,
        app: row.developerApp,
        user: {
          id: row.user.id,
          email: row.user.email,
          name: row.user.profile?.name ?? null,
          username: row.user.profile?.username ?? null,
        },
        checklist: {
          domainPresent: Boolean(row.domain),
          emailOnDomain: this.emailDomain(row.businessEmail) === row.domain
            || this.emailDomain(row.businessEmail).endsWith(`.${row.domain}`),
          websiteShowsName: null as boolean | null,
        },
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getAdminStats() {
    const [pending, approved, rejected, fulfilled] = await Promise.all([
      this.prisma.metaBusinessPortfolioRequest.count({
        where: { status: 'pending' },
      }),
      this.prisma.metaBusinessPortfolioRequest.count({
        where: { status: 'approved' },
      }),
      this.prisma.metaBusinessPortfolioRequest.count({
        where: { status: 'rejected' },
      }),
      this.prisma.metaBusinessPortfolioRequest.count({
        where: { status: 'fulfilled' },
      }),
    ]);

    return { pending, approved, rejected, fulfilled };
  }

  async approve(requestId: string, adminId: string, metaBusinessId?: string) {
    const request = await this.prisma.metaBusinessPortfolioRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException(
        `Cannot approve a request with status: ${request.status}`,
      );
    }

    const updated = await this.prisma.metaBusinessPortfolioRequest.update({
      where: { id: requestId },
      data: {
        status: 'approved',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        metaBusinessId: metaBusinessId?.trim() || null,
        rejectionReason: null,
      },
      include: {
        developerApp: { select: { appId: true, name: true } },
      },
    });

    return {
      success: true,
      message: 'Meta portfolio request approved',
      request: this.serializeRequest(updated),
    };
  }

  async reject(requestId: string, adminId: string, reason: string) {
    const request = await this.prisma.metaBusinessPortfolioRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException(
        `Cannot reject a request with status: ${request.status}`,
      );
    }

    const trimmed = reason?.trim();
    if (!trimmed || trimmed.length < 5) {
      throw new BadRequestException('Rejection reason is required');
    }

    const updated = await this.prisma.metaBusinessPortfolioRequest.update({
      where: { id: requestId },
      data: {
        status: 'rejected',
        rejectionReason: trimmed,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      include: {
        developerApp: { select: { appId: true, name: true } },
      },
    });

    return {
      success: true,
      message: 'Meta portfolio request rejected',
      request: this.serializeRequest(updated),
    };
  }

  async fulfill(requestId: string, adminId: string, metaBusinessId: string) {
    const request = await this.prisma.metaBusinessPortfolioRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    if (request.status !== 'approved' && request.status !== 'pending') {
      throw new BadRequestException(
        `Cannot fulfill a request with status: ${request.status}`,
      );
    }

    const id = metaBusinessId?.trim() || request.metaBusinessId;
    if (!id) {
      throw new BadRequestException('Meta Business ID is required to fulfill');
    }

    const updated = await this.prisma.metaBusinessPortfolioRequest.update({
      where: { id: requestId },
      data: {
        status: 'fulfilled',
        metaBusinessId: id,
        reviewedBy: request.reviewedBy ?? adminId,
        reviewedAt: request.reviewedAt ?? new Date(),
        rejectionReason: null,
      },
      include: {
        developerApp: { select: { appId: true, name: true } },
      },
    });

    return {
      success: true,
      message: 'Meta portfolio marked fulfilled (owned by Rukny)',
      request: this.serializeRequest(updated),
    };
  }
}
