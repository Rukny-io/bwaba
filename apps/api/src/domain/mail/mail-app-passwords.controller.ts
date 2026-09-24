import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import { CreateMailAppPasswordDto } from './dto/mail-app-password.dto';
import { MailAppPasswordsService } from './mail-app-passwords.service';

@ApiTags('Mail - App passwords')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'mail/apps/:appId/mailboxes/:mailboxId/app-passwords', version: '1' })
export class MailAppPasswordsController {
  constructor(private readonly appPasswords: MailAppPasswordsService) {}

  @Get()
  @ApiOperation({ summary: 'List active app passwords for a mailbox' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('mailboxId') mailboxId: string,
  ) {
    return this.appPasswords.list(user.id, appId, mailboxId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an app password (shown once)' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('mailboxId') mailboxId: string,
    @Body() dto: CreateMailAppPasswordDto,
  ) {
    return this.appPasswords.create(user.id, appId, mailboxId, dto);
  }

  @Delete(':passwordId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke an app password' })
  revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('mailboxId') mailboxId: string,
    @Param('passwordId') passwordId: string,
  ) {
    return this.appPasswords.revoke(user.id, appId, mailboxId, passwordId);
  }
}
