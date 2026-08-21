import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MailMessageFolder } from '@prisma/client';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import { SendMailMessageDto } from './dto/mail-message.dto';
import { MailMessagesService } from './mail-messages.service';

@ApiTags('Mail - Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'mail/apps/:appId/messages', version: '1' })
export class MailMessagesController {
  constructor(private readonly messages: MailMessagesService) {}

  @Get()
  @ApiOperation({ summary: 'List messages for a Mail app' })
  @ApiQuery({ name: 'mailboxId', required: false })
  @ApiQuery({
    name: 'folder',
    required: false,
    enum: MailMessageFolder,
  })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'take', required: false })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Query('mailboxId') mailboxId?: string,
    @Query('folder') folder?: MailMessageFolder,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    return this.messages.list(user.id, appId, {
      mailboxId,
      folder,
      cursor,
      take: take ? Number(take) : undefined,
    });
  }

  @Post('send')
  @ApiOperation({ summary: 'Send email via Amazon SES from a mailbox' })
  send(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: SendMailMessageDto,
  ) {
    return this.messages.send(user.id, appId, dto);
  }

  @Get(':messageId')
  @ApiOperation({ summary: 'Get one message (marks as read)' })
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.messages.getOne(user.id, appId, messageId);
  }
}
