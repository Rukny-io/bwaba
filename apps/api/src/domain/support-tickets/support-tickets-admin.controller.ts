import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { RolesGuard } from '../../core/common/guards/roles.guard';
import { Roles } from '../../core/common/decorators/auth/roles.decorator';
import { CurrentUser } from '../../core/common/decorators/auth/current-user.decorator';
import { SupportTicketsService } from './support-tickets.service';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import {
  AdminListTicketsQueryDto,
  CreateInternalNoteDto,
} from './dto/admin-support-tickets.dto';
import {
  AssignTicketDto,
  UpdateTicketStatusDto,
} from './dto/update-ticket-status.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Controller('admin/support-tickets')
@UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
@Roles(Role.ADMIN)
export class SupportTicketsAdminController {
  constructor(private readonly supportTicketsService: SupportTicketsService) {}

  @Get()
  listTickets(@Query() query: AdminListTicketsQueryDto) {
    return this.supportTicketsService.listAllTickets(query);
  }

  @Get('stats')
  getStats() {
    return this.supportTicketsService.getAdminStats();
  }

  @Get('canned-responses')
  getCannedResponses(@Query('locale') locale?: 'en' | 'ar') {
    return this.supportTicketsService.getCannedResponses(locale);
  }

  @Get(':id')
  getTicket(@Param('id', ParseUUIDPipe) ticketId: string) {
    return this.supportTicketsService.getAdminTicket(ticketId);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) ticketId: string,
    @Body() dto: UpdateTicketStatusDto,
  ) {
    return this.supportTicketsService.updateTicketStatus(ticketId, dto, adminId);
  }

  @Patch(':id/assign')
  assignTicket(
    @Param('id', ParseUUIDPipe) ticketId: string,
    @Body() dto: AssignTicketDto,
  ) {
    return this.supportTicketsService.assignTicket(ticketId, dto);
  }

  @Post(':id/start')
  startWork(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) ticketId: string,
  ) {
    return this.supportTicketsService.startTicketWork(adminId, ticketId);
  }

  @Post(':id/reply')
  reply(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) ticketId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.supportTicketsService.addStaffReply(adminId, ticketId, dto);
  }

  @Post(':id/internal-notes')
  addInternalNote(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) ticketId: string,
    @Body() dto: CreateInternalNoteDto,
  ) {
    return this.supportTicketsService.addInternalNote(
      adminId,
      ticketId,
      dto.body,
    );
  }

  @Post(':id/attachments')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  uploadAttachment(
    @CurrentUser('id') adminId: string,
    @Param('id', ParseUUIDPipe) ticketId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('messageId') messageId?: string,
  ) {
    return this.supportTicketsService.uploadAttachment(adminId, ticketId, file, {
      messageId,
      isAdmin: true,
    });
  }
}
