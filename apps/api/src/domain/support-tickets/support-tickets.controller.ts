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
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import { SupportTicketsService } from './support-tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';

@Controller('support-tickets')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class SupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketsService) {}

  @Get('me/open-count')
  getOpenCount(@CurrentUser('id') userId: string) {
    return this.supportTicketsService.getOpenTicketCount(userId);
  }

  @Get('me')
  listTickets(
    @CurrentUser('id') userId: string,
    @Query() query: ListTicketsQueryDto,
  ) {
    return this.supportTicketsService.listUserTickets(userId, query);
  }

  @Post('me')
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  createTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTicketDto,
  ) {
    return this.supportTicketsService.createTicket(user.id, dto);
  }

  @Post(':id/attachments')
  @Throttle({ default: { limit: 12, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  uploadAttachment(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) ticketId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('messageId') messageId?: string,
  ) {
    return this.supportTicketsService.uploadAttachment(userId, ticketId, file, {
      messageId,
    });
  }

  @Get(':id')
  getTicket(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) ticketId: string,
  ) {
    return this.supportTicketsService.getUserTicket(userId, ticketId);
  }

  @Post(':id/messages')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  addMessage(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) ticketId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.supportTicketsService.addUserMessage(userId, ticketId, dto);
  }

  @Patch(':id/close')
  closeTicket(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) ticketId: string,
  ) {
    return this.supportTicketsService.closeTicket(userId, ticketId);
  }

  @Patch(':id/reopen')
  reopenTicket(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) ticketId: string,
  ) {
    return this.supportTicketsService.reopenTicket(userId, ticketId);
  }
}
