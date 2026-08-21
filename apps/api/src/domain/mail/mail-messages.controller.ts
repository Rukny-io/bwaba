import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import {
  SendMailMessageDto,
  UpdateMailMessageDto,
} from './dto/mail-message.dto';
import { MailInboundService } from './mail-inbound.service';
import { MailMessagesService } from './mail-messages.service';

@ApiTags('Mail - Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'mail/apps/:appId/messages', version: '1' })
export class MailMessagesController {
  constructor(
    private readonly messages: MailMessagesService,
    private readonly inbound: MailInboundService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List messages for a Mail app' })
  @ApiQuery({ name: 'mailboxId', required: false })
  @ApiQuery({
    name: 'folder',
    required: false,
    enum: MailMessageFolder,
  })
  @ApiQuery({ name: 'starred', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'take', required: false })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Query('mailboxId') mailboxId?: string,
    @Query('folder') folder?: MailMessageFolder,
    @Query('starred') starred?: string,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    return this.messages.list(user.id, appId, {
      mailboxId,
      folder,
      starred: starred === '1' || starred === 'true',
      cursor,
      take: take ? Number(take) : undefined,
    });
  }

  @Get('counts')
  @ApiOperation({ summary: 'Folder message counts for a mailbox' })
  @ApiQuery({ name: 'mailboxId', required: false })
  counts(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Query('mailboxId') mailboxId?: string,
  ) {
    return this.messages.counts(user.id, appId, mailboxId);
  }

  @Post('import-inbound')
  @ApiOperation({
    summary: 'Import recent raw SES emails from S3 into the inbox',
  })
  @ApiQuery({ name: 'take', required: false })
  async importInbound(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Query('take') take?: string,
  ) {
    await this.messages.assertOwnedApp(user.id, appId);
    return this.inbound.importRecentRaw(take ? Number(take) : 30);
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

  @Patch(':messageId')
  @ApiOperation({ summary: 'Update message (star, read, move folder)' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMailMessageDto,
  ) {
    return this.messages.update(user.id, appId, messageId, dto);
  }
}
