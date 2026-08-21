import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import { MailMailboxesService } from './mail-mailboxes.service';
import {
  ChangeMailMailboxPasswordDto,
  CreateMailMailboxDto,
  SetMailMailbox2faDto,
  UpdateMailMailboxDto,
} from './dto/mail-mailbox.dto';

@ApiTags('Mail - Mailboxes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'mail/apps/:appId/mailboxes', version: '1' })
export class MailMailboxesController {
  constructor(private readonly mailboxes: MailMailboxesService) {}

  @Get()
  @ApiOperation({ summary: 'List mailboxes for a Mail app' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.mailboxes.list(user.id, appId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a mailbox (password required, 2FA optional)',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: CreateMailMailboxDto,
  ) {
    return this.mailboxes.create(user.id, appId, dto);
  }

  @Patch(':mailboxId')
  @ApiOperation({ summary: 'Update mailbox display name or status' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('mailboxId') mailboxId: string,
    @Body() dto: UpdateMailMailboxDto,
  ) {
    return this.mailboxes.update(user.id, appId, mailboxId, dto);
  }

  @Post(':mailboxId/avatar')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Upload mailbox avatar (JPEG/PNG/WebP/GIF, max 5MB; re-encoded to WebP)',
  })
  uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('mailboxId') mailboxId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    return this.mailboxes.uploadAvatar(user.id, appId, mailboxId, file);
  }

  @Delete(':mailboxId/avatar')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Remove mailbox avatar' })
  removeAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('mailboxId') mailboxId: string,
  ) {
    return this.mailboxes.removeAvatar(user.id, appId, mailboxId);
  }

  @Post(':mailboxId/password')
  @ApiOperation({ summary: 'Change mailbox password' })
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('mailboxId') mailboxId: string,
    @Body() dto: ChangeMailMailboxPasswordDto,
  ) {
    return this.mailboxes.changePassword(user.id, appId, mailboxId, dto);
  }

  @Post(':mailboxId/2fa')
  @ApiOperation({ summary: 'Enable or disable mailbox 2FA' })
  set2fa(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('mailboxId') mailboxId: string,
    @Body() dto: SetMailMailbox2faDto,
  ) {
    return this.mailboxes.set2fa(user.id, appId, mailboxId, dto);
  }

  @Delete(':mailboxId')
  @ApiOperation({ summary: 'Soft-delete a mailbox' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('mailboxId') mailboxId: string,
  ) {
    return this.mailboxes.remove(user.id, appId, mailboxId);
  }
}
