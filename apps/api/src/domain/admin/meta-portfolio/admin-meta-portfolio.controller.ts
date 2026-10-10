import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../core/common/guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../../core/common/guards/roles.guard';
import { Roles } from '../../../core/common/decorators/auth/roles.decorator';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../../core/common/decorators/auth/current-user.decorator';
import { MetaPortfolioService } from '../../developer/meta-portfolio/meta-portfolio.service';
import {
  ApproveMetaPortfolioDto,
  FulfillMetaPortfolioDto,
  RejectMetaPortfolioDto,
} from './dto/admin-meta-portfolio.dto';

@Controller('admin/meta-portfolio')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminMetaPortfolioController {
  constructor(private readonly metaPortfolio: MetaPortfolioService) {}

  @Get('stats')
  getStats() {
    return this.metaPortfolio.getAdminStats();
  }

  @Get()
  list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
  ) {
    return this.metaPortfolio.listForAdmin({ page, limit, status });
  }

  @Patch(':id/approve')
  approve(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Body() body: ApproveMetaPortfolioDto,
  ) {
    return this.metaPortfolio.approve(id, admin.id, body?.metaBusinessId);
  }

  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Body() body: RejectMetaPortfolioDto,
  ) {
    return this.metaPortfolio.reject(id, admin.id, body.reason);
  }

  @Patch(':id/fulfill')
  fulfill(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Body() body: FulfillMetaPortfolioDto,
  ) {
    return this.metaPortfolio.fulfill(id, admin.id, body.metaBusinessId);
  }
}
