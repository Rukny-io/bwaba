import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/common/guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../../core/common/guards/roles.guard';
import { Roles } from '../../../core/common/decorators/auth/roles.decorator';
import { Role } from '@prisma/client';
import { AdminFormsService } from './forms.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminFormsController {
  constructor(private readonly formsService: AdminFormsService) {}

  @Get('forms/stats')
  getStats() {
    return this.formsService.getStats();
  }

  @Get('forms/analytics')
  getAnalytics(
    @Query('days', new DefaultValuePipe(7), ParseIntPipe) days: number,
    @Query('staleDays', new DefaultValuePipe(30), ParseIntPipe) staleDays: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.formsService.getAnalytics({
      days: Math.min(days, 90),
      staleDays: Math.min(staleDays, 365),
      limit: Math.min(limit, 25),
    });
  }

  @Get('forms/export')
  exportForms(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('visibility') visibility?: 'active' | 'deleted' | 'all',
  ) {
    return this.formsService.exportForms({
      search,
      status,
      visibility: visibility ?? 'active',
    });
  }

  @Get('forms/deletion-logs')
  listDeletionLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('formId') formId?: string,
    @Query('ownerId') ownerId?: string,
  ) {
    return this.formsService.listDeletionLogs({
      page,
      limit: Math.min(limit, 100),
      formId,
      ownerId,
    });
  }

  @Get('forms')
  listForms(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('visibility') visibility?: 'active' | 'deleted' | 'all',
  ) {
    return this.formsService.listForms({
      page,
      limit: Math.min(limit, 100),
      search,
      status,
      visibility: visibility ?? 'active',
    });
  }

  @Get('forms/:id/webhook-health')
  getWebhookHealth(@Param('id') id: string) {
    return this.formsService.getWebhookHealth(id);
  }

  @Get('forms/:id')
  getForm(@Param('id') id: string) {
    return this.formsService.getFormById(id);
  }
}
