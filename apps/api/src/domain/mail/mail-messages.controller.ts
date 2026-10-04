import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  MessageEvent,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Sse,
  HttpException,
  HttpStatus,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { MailMessageFolder } from '@prisma/client';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import { extractMailboxSessionToken } from '../auth/cookie.config';
import {
  SaveMailDraftDto,
  SendMailMessageDto,
  UpdateMailMessageDto,
} from './dto/mail-message.dto';
import { MailAttachmentsService } from './mail-attachments.service';
import { MailInboundService } from './mail-inbound.service';
import { MailMessagesService } from './mail-messages.service';
import { MailRealtimeService } from './mail-realtime.service';

@ApiTags('Mail - Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'mail/apps/:appId/messages', version: '1' })
export class MailMessagesController {
  constructor(
    private readonly messages: MailMessagesService,
    private readonly inbound: MailInboundService,
    private readonly realtime: MailRealtimeService,
    private readonly attachments: MailAttachmentsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List messages for a Mail app',
    description:
      'folder=INBOX returns primary inbox plus Social and Promotions (excludes Spam). Other folders filter exactly.',
  })
  @ApiQuery({ name: 'mailboxId', required: false })
  @ApiQuery({
    name: 'folder',
    required: false,
    enum: MailMessageFolder,
  })
  @ApiQuery({ name: 'starred', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'take', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'scheduled', required: false })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Req() req: Request,
    @Query('mailboxId') mailboxId?: string,
    @Query('folder') folder?: MailMessageFolder,
    @Query('starred') starred?: string,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
    @Query('q') q?: string,
    @Query('scheduled') scheduled?: string,
  ) {
    return this.messages.list(user.id, appId, {
      mailboxId,
      folder,
      starred: starred === '1' || starred === 'true',
      scheduled: scheduled === '1' || scheduled === 'true',
      cursor,
      take: take ? Number(take) : undefined,
      q,
      sessionToken: extractMailboxSessionToken(req),
    });
  }

  @Get('counts')
  @ApiOperation({ summary: 'Folder message counts for a mailbox' })
  @ApiQuery({ name: 'mailboxId', required: false })
  counts(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Req() req: Request,
    @Query('mailboxId') mailboxId?: string,
  ) {
    return this.messages.counts(
      user.id,
      appId,
      mailboxId,
      extractMailboxSessionToken(req),
    );
  }

  @Sse('stream')
  @ApiOperation({ summary: 'Realtime mail change stream (SSE)' })
  async stream(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ): Promise<Observable<MessageEvent>> {
    await this.messages.assertOwnedApp(user.id, appId);
    return new Observable<MessageEvent>((subscriber) => {
      let streamSubscription: ReturnType<MailRealtimeService['subscribeStream']>;
      try {
        streamSubscription = this.realtime.subscribeStream(
          appId,
          user.id,
          (event) => {
            if (event.type === 'expired') {
              subscriber.complete();
              return;
            }
            if (event.type === 'connected') {
              subscriber.next({
                data: { type: 'connected', appId },
              } as MessageEvent);
              return;
            }
            subscriber.next({ data: event } as MessageEvent);
          },
        );
      } catch {
        subscriber.error(
          new HttpException(
            'Too many active mail stream connections. Close an existing tab and try again.',
            HttpStatus.TOO_MANY_REQUESTS,
          ),
        );
        return;
      }

      const heartbeat = setInterval(() => {
        subscriber.next({ data: { type: 'ping' } } as MessageEvent);
      }, 25_000);

      return () => {
        clearInterval(heartbeat);
        streamSubscription.unsubscribe();
      };
    });
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

  @Post('attachments')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a message attachment' })
  @ApiQuery({ name: 'mailboxId', required: true })
  @ApiQuery({ name: 'messageId', required: false })
  uploadAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Query('mailboxId') mailboxId?: string,
    @Query('messageId') messageId?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded.');
    if (!mailboxId) throw new BadRequestException('mailboxId is required.');
    return this.attachments.upload(
      user.id,
      appId,
      mailboxId,
      file,
      extractMailboxSessionToken(req),
      messageId,
    );
  }

  @Post('drafts')
  @ApiOperation({ summary: 'Create a draft message' })
  createDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Req() req: Request,
    @Body() dto: SaveMailDraftDto,
  ) {
    return this.messages.createDraft(
      user.id,
      appId,
      dto,
      extractMailboxSessionToken(req),
    );
  }

  @Post('send')
  @ApiOperation({ summary: 'Send email via Amazon SES from a mailbox' })
  send(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Req() req: Request,
    @Body() dto: SendMailMessageDto,
  ) {
    return this.messages.send(
      user.id,
      appId,
      dto,
      extractMailboxSessionToken(req),
    );
  }

  @Patch(':messageId/draft')
  @ApiOperation({ summary: 'Update a draft message' })
  updateDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('messageId') messageId: string,
    @Req() req: Request,
    @Body() dto: SaveMailDraftDto,
  ) {
    return this.messages.updateDraft(
      user.id,
      appId,
      messageId,
      dto,
      extractMailboxSessionToken(req),
    );
  }

  @Post(':messageId/send')
  @ApiOperation({ summary: 'Send an existing draft' })
  sendDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('messageId') messageId: string,
    @Req() req: Request,
  ) {
    return this.messages.sendDraft(
      user.id,
      appId,
      messageId,
      extractMailboxSessionToken(req),
    );
  }

  @Get(':messageId/attachments/:attachmentId')
  @ApiOperation({ summary: 'Get a signed download URL for an attachment' })
  downloadAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('messageId') messageId: string,
    @Param('attachmentId') attachmentId: string,
    @Req() req: Request,
  ) {
    return this.attachments.getDownloadUrl(
      user.id,
      appId,
      messageId,
      attachmentId,
      extractMailboxSessionToken(req),
    );
  }

  @Get(':messageId')
  @ApiOperation({ summary: 'Get one message (marks as read)' })
  getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('messageId') messageId: string,
    @Req() req: Request,
  ) {
    return this.messages.getOne(
      user.id,
      appId,
      messageId,
      extractMailboxSessionToken(req),
    );
  }

  @Patch(':messageId')
  @ApiOperation({ summary: 'Update message (star, read, move folder)' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('messageId') messageId: string,
    @Req() req: Request,
    @Body() dto: UpdateMailMessageDto,
  ) {
    return this.messages.update(
      user.id,
      appId,
      messageId,
      dto,
      extractMailboxSessionToken(req),
    );
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Permanently delete a message' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('messageId') messageId: string,
    @Req() req: Request,
  ) {
    return this.messages.remove(
      user.id,
      appId,
      messageId,
      extractMailboxSessionToken(req),
    );
  }
}
