import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/common/guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../../core/common/guards/roles.guard';
import { Roles } from '../../../core/common/decorators/auth/roles.decorator';
import { Role } from '@prisma/client';

import { CurrentUser } from '../../../core/common/decorators/auth/current-user.decorator';
import { AuthenticatedUser } from '../../../core/common/decorators/auth/current-user.decorator';
import { IdentityVerificationService } from '../../auth/identity-verification.service';
import { RuknyVerifiedService } from '../../auth/rukny-verified.service';
import { PrismaService } from '../../../core/database/prisma/prisma.service';

/**
 * Admin controller for verification endpoints.
 */
@Controller('admin/verification')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class VerificationController {
  constructor(
    private readonly identityService: IdentityVerificationService,
    private readonly ruknyVerifiedService: RuknyVerifiedService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('stats')
  async getStats() {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, pending, approved, rejected, today, thisWeek, thisMonth] =
      await Promise.all([
        this.prisma.identityVerification.count(),
        this.prisma.identityVerification.count({ where: { status: 'pending' } }),
        this.prisma.identityVerification.count({ where: { status: 'approved' } }),
        this.prisma.identityVerification.count({ where: { status: 'rejected' } }),
        this.prisma.identityVerification.count({
          where: { submittedAt: { gte: todayStart } },
        }),
        this.prisma.identityVerification.count({
          where: { submittedAt: { gte: weekStart } },
        }),
        this.prisma.identityVerification.count({
          where: { submittedAt: { gte: monthStart } },
        }),
      ]);

    const decided = approved + rejected;
    return {
      total,
      today,
      thisWeek,
      thisMonth,
      byStatus: {
        pending,
        underReview: 0,
        approved,
        rejected,
      },
      approvalRate: decided > 0 ? Math.round((approved / decided) * 100) : 0,
    };
  }

  @Get('export')
  exportVerification() {
    return { data: [], total: 0 };
  }

  @Get('rukny-verified/list')
  async listRuknyVerified(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.ruknyVerifiedService.listApplications(page, limit, status);
  }

  @Patch('rukny-verified/:id/approve')
  async approveRuknyVerified(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.ruknyVerifiedService.approveApplication(id, admin.id);
  }

  @Patch('rukny-verified/:id/reject')
  async rejectRuknyVerified(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.ruknyVerifiedService.rejectApplication(
      id,
      admin.id,
      body.reason || 'لم يستوفِ متطلبات التوثيق',
    );
  }

  @Get('user/:userId')
  async getUserVerification(@Param('userId') userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        verificationLevel: true,
        isRuknyVerified: true,
        ruknyVerifiedAt: true,
        verifiedCategory: true,
        verifiedDisplayName: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    if (!user) {
      return { message: 'Not found' };
    }

    const [identityRequests, ruknyApplications] = await Promise.all([
      this.prisma.identityVerification.findMany({
        where: { userId },
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          documentType: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          rejectionReason: true,
          documentsDeletedAt: true,
          documentsPurgeAt: true,
          documentFrontUrl: true,
          documentBackUrl: true,
          residenceFrontKey: true,
          residenceBackKey: true,
          selfieUrl: true,
        },
      }),
      this.prisma.ruknyVerifiedApplication.findMany({
        where: { userId },
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          category: true,
          displayName: true,
          publicBio: true,
          websiteUrl: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          rejectionReason: true,
        },
      }),
    ]);

    return {
      user: {
        ...user,
        ruknyVerifiedAt: user.ruknyVerifiedAt?.toISOString() ?? null,
      },
      identityRequests: identityRequests.map((request) => ({
        id: request.id,
        documentType: request.documentType,
        status: request.status,
        submittedAt: request.submittedAt.toISOString(),
        reviewedAt: request.reviewedAt?.toISOString() ?? null,
        rejectionReason: request.rejectionReason,
        documentsDeletedAt: request.documentsDeletedAt?.toISOString() ?? null,
        documentsPurgeAt: request.documentsPurgeAt?.toISOString() ?? null,
        documents: request.documentsDeletedAt
          ? null
          : {
              primary_front: Boolean(request.documentFrontUrl),
              primary_back: Boolean(request.documentBackUrl),
              residence_front: Boolean(request.residenceFrontKey),
              residence_back: Boolean(request.residenceBackKey),
              selfie: Boolean(request.selfieUrl),
            },
      })),
      ruknyApplications: ruknyApplications.map((application) => ({
        ...application,
        submittedAt: application.submittedAt.toISOString(),
        reviewedAt: application.reviewedAt?.toISOString() ?? null,
      })),
    };
  }

  @Patch('user/:userId/revoke')
  async revokeUserVerification(
    @Param('userId') userId: string,
    @Body() body: { reason?: string },
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.identityService.revokeUserVerification(
      userId,
      admin.id,
      body.reason,
    );
  }

  @Patch('user/:userId/grant-identity')
  async grantUserIdentity(
    @Param('userId') userId: string,
    @Body() body: { note?: string },
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.identityService.grantUserVerification(
      userId,
      admin.id,
      body.note,
    );
  }

  @Patch('user/:userId/grant-rukny-verified')
  async grantUserRuknyVerified(
    @Param('userId') userId: string,
    @Body()
    body: {
      category: 'personal' | 'business' | 'creator';
      displayName: string;
      publicBio?: string;
      note?: string;
    },
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.ruknyVerifiedService.grantVerifiedStatus(userId, admin.id, body);
  }

  @Patch('user/:userId/revoke-rukny-verified')
  async revokeUserRuknyVerified(
    @Param('userId') userId: string,
    @Body() body: { reason?: string },
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.ruknyVerifiedService.revokeVerifiedStatus(
      userId,
      admin.id,
      body.reason,
    );
  }

  @Get()
  async getVerifications(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('documentType') documentType?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (documentType) where.documentType = documentType;
    if (search?.trim()) {
      where.OR = [
        { user: { email: { contains: search.trim(), mode: 'insensitive' } } },
        {
          user: {
            profile: { name: { contains: search.trim(), mode: 'insensitive' } },
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.identityVerification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        select: {
          id: true,
          userId: true,
          documentType: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          rejectionReason: true,
          documentsDeletedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              verificationLevel: true,
              profile: { select: { name: true, avatar: true } },
            },
          },
        },
      }),
      this.prisma.identityVerification.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get(':id/document')
  async getIdentityDocument(
    @Param('id') id: string,
    @Query('slot') slot: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: import('express').Request,
  ) {
    return this.identityService.getAdminDocumentViewUrl(
      id,
      slot as any,
      admin.id,
      req.ip || req.socket.remoteAddress,
      req.headers['user-agent'],
    );
  }

  @Get(':id')
  async getVerificationById(@Param('id') id: string) {
    const req = await this.prisma.identityVerification.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        documentType: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        rejectionReason: true,
        documentsDeletedAt: true,
        documentsPurgeAt: true,
        user: {
          select: {
            id: true,
            email: true,
            verificationLevel: true,
            profile: { select: { name: true } },
          },
        },
      },
    });
    if (!req) return { message: 'Not found' };
    const full = await this.prisma.identityVerification.findUnique({
      where: { id },
      select: {
        documentFrontUrl: true,
        documentBackUrl: true,
        residenceFrontKey: true,
        residenceBackKey: true,
        selfieUrl: true,
        documentsDeletedAt: true,
      },
    });
    return {
      ...req,
      documents: full?.documentsDeletedAt
        ? null
        : {
            primary_front: Boolean(full?.documentFrontUrl),
            primary_back: Boolean(full?.documentBackUrl),
            residence_front: Boolean(full?.residenceFrontKey),
            residence_back: Boolean(full?.residenceBackKey),
            selfie: Boolean(full?.selfieUrl),
          },
    };
  }

  @Patch(':id/approve')
  async approveVerification(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.identityService.approveVerification(id, admin.id);
  }

  @Patch(':id/reject')
  async rejectVerification(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.identityService.rejectVerification(
      id,
      admin.id,
      body.reason || 'المستندات غير واضحة أو غير صالحة',
    );
  }
}
