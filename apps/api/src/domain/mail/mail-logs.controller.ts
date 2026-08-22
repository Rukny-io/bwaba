import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MailMessageDirection, MailMessageStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import { MailMessagesService } from './mail-messages.service';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseDirection(raw?: string): MailMessageDirection | undefined {
  if (!raw) return undefined;
  if (raw === MailMessageDirection.INBOUND || raw === MailMessageDirection.OUTBOUND) {
    return raw;
  }
  throw new BadRequestException('Invalid direction.');
}

function parseStatus(raw?: string): MailMessageStatus | undefined {
  if (!raw) return undefined;
  if (
    raw === MailMessageStatus.QUEUED ||
    raw === MailMessageStatus.SENT ||
    raw === MailMessageStatus.FAILED ||
    raw === MailMessageStatus.RECEIVED
  ) {
    return raw;
  }
  throw new BadRequestException('Invalid status.');
}

function parseMailboxId(raw?: string): string | undefined {
  if (!raw) return undefined;
  if (!UUID_RE.test(raw)) {
    throw new BadRequestException('Invalid mailbox id.');
  }
  return raw;
}

@ApiTags('Mail - Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'mail/apps/:appId/logs', version: '1' })
export class MailLogsController {
  constructor(private readonly messages: MailMessagesService) {}

  @Get()
  @ApiOperation({
    summary: 'List delivery logs for a Mail app (metadata only, no bodies)',
  })
  @ApiQuery({ name: 'mailboxId', required: false })
  @ApiQuery({ name: 'direction', required: false, enum: MailMessageDirection })
  @ApiQuery({ name: 'status', required: false, enum: MailMessageStatus })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'days', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'take', required: false })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Query('mailboxId') mailboxId?: string,
    @Query('direction') direction?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
    @Query('days') days?: string,
    @Query('cursor') cursor?: string,
    @Query('take') take?: string,
  ) {
    return this.messages.listLogs(user.id, appId, {
      mailboxId: parseMailboxId(mailboxId),
      direction: parseDirection(direction),
      status: parseStatus(status),
      q,
      days: days ? Number(days) : undefined,
      cursor,
      take: take ? Number(take) : undefined,
    });
  }
}
