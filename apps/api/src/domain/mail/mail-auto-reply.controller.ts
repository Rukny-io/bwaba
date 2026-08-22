import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import { UpsertMailAutoReplyDto } from './dto/mail-auto-reply.dto';
import { MailAutoReplyService } from './mail-auto-reply.service';

@ApiTags('Mail - Automatic replies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'mail/apps/:appId/auto-replies', version: '1' })
export class MailAutoReplyController {
  constructor(private readonly autoReplies: MailAutoReplyService) {}

  @Get()
  @ApiOperation({ summary: 'List automatic reply settings for each mailbox' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.autoReplies.list(user.id, appId);
  }

  @Put(':mailboxId')
  @ApiOperation({ summary: 'Save automatic reply settings for a mailbox' })
  upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('mailboxId') mailboxId: string,
    @Body() dto: UpsertMailAutoReplyDto,
  ) {
    return this.autoReplies.upsert(user.id, appId, mailboxId, dto);
  }
}
