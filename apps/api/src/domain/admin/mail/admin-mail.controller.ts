import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../core/common/guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../../core/common/guards/roles.guard';
import { Roles } from '../../../core/common/decorators/auth/roles.decorator';
import { AdminMailService } from './admin-mail.service';
import { AdminUpdateMailboxStatusDto } from './dto/admin-mail.dto';

@Controller('admin/mail')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminMailController {
  constructor(private readonly adminMail: AdminMailService) {}

  @Get('stats')
  getStats() {
    return this.adminMail.getStats();
  }

  @Get('analytics')
  getAnalytics(
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
  ) {
    return this.adminMail.getAnalytics(Math.min(days, 90));
  }

  @Get('alerts')
  getAlerts() {
    return this.adminMail.getAlerts();
  }

  @Get('delivery')
  listDelivery(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('appId') appId?: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days?: number,
  ) {
    return this.adminMail.listDelivery({
      page,
      limit: Math.min(limit, 100),
      appId,
      days,
    });
  }

  @Get('domains')
  listDomains() {
    return this.adminMail.listDomains();
  }

  @Get('export')
  exportApps(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('domainStatus') domainStatus?: string,
  ) {
    return this.adminMail.exportApps({ search, status, plan, domainStatus });
  }

  @Get('apps')
  listApps(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('domainStatus') domainStatus?: string,
  ) {
    return this.adminMail.listApps({
      page,
      limit: Math.min(limit, 100),
      search,
      status,
      plan,
      domainStatus,
    });
  }

  @Get('apps/:appId/analytics')
  getAppAnalytics(
    @Param('appId') appId: string,
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
  ) {
    return this.adminMail.getAnalytics(Math.min(days, 90), appId);
  }

  @Get('apps/:appId/mailboxes')
  listMailboxes(@Param('appId') appId: string) {
    return this.adminMail.listMailboxes(appId);
  }

  @Post('apps/:appId/domain/refresh')
  refreshDomain(@Param('appId') appId: string) {
    return this.adminMail.refreshDomain(appId);
  }

  @Get('apps/:appId')
  getApp(@Param('appId') appId: string) {
    return this.adminMail.getApp(appId);
  }

  @Patch('mailboxes/:id/status')
  updateMailboxStatus(
    @Param('id') id: string,
    @Body() dto: AdminUpdateMailboxStatusDto,
  ) {
    return this.adminMail.updateMailboxStatus(id, dto.status);
  }
}
