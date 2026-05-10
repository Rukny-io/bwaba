import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
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
    private readonly prisma: PrismaService,
  ) {}

  @Get('stats')
  getStats() {
    return {
      total: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      byStatus: { pending: 0, underReview: 0, approved: 0, rejected: 0 },
      approvalRate: 0,
    };
  }

  @Get('export')
  exportVerification() {
    return { data: [], total: 0 };
  }

  @Get()
  async getVerifications(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.prisma.identityVerification.findMany({
        skip,
        take: limit,
        orderBy: { submittedAt: 'desc' },
        include: { user: { select: { id: true, email: true, profile: { select: { name: true } } } } },
      }),
      this.prisma.identityVerification.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Get(':id')
  async getVerificationById(@Param('id') id: string) {
    const req = await this.prisma.identityVerification.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, verificationLevel: true, profile: { select: { name: true } } } } },
    });
    if (!req) return { message: 'Not found' };
    return req;
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
    return this.identityService.rejectVerification(id, admin.id, body.reason || 'المستندات غير واضحة أو غير صالحة');
  }
}
