import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import { BulkQuarantineActionDto } from './dto/mail-filter-rule.dto';
import { MailQuarantineService } from './mail-quarantine.service';

@ApiTags('Mail - Quarantine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'mail/apps/:appId/quarantine', version: '1' })
export class MailQuarantineController {
  constructor(private readonly quarantine: MailQuarantineService) {}

  @Get()
  @ApiOperation({ summary: 'List quarantined messages across workspace mailboxes' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
    @Query('mailboxId') mailboxId?: string,
  ) {
    return this.quarantine.list(user.id, appId, {
      take: take ? Number(take) : undefined,
      cursor,
      mailboxId,
    });
  }

  @Get('count')
  @ApiOperation({ summary: 'Count quarantined messages' })
  count(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.quarantine.count(user.id, appId);
  }

  @Get('audit')
  @ApiOperation({ summary: 'List quarantine review audit logs' })
  audit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Query('take') take?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.quarantine.listAuditLogs(user.id, appId, {
      take: take ? Number(take) : undefined,
      cursor,
    });
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk release, spam, or delete quarantined messages' })
  bulk(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: BulkQuarantineActionDto,
  ) {
    return this.quarantine.bulkAction(user.id, appId, dto);
  }

  @Post(':messageId/release')
  @ApiOperation({ summary: 'Release a quarantined message to inbox' })
  release(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.quarantine.release(user.id, appId, messageId);
  }

  @Post(':messageId/spam')
  @ApiOperation({ summary: 'Move a quarantined message to spam' })
  spam(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.quarantine.markSpam(user.id, appId, messageId);
  }

  @Delete(':messageId')
  @ApiOperation({ summary: 'Delete a quarantined message' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.quarantine.deleteMessage(user.id, appId, messageId);
  }
}
