import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import {
  AuthenticatedUser,
  CurrentUser,
} from '../../core/common/decorators/auth/current-user.decorator';
import { Public } from '../../core/common/decorators/auth/public.decorator';
import { MailMembersService } from './mail-members.service';
import {
  InviteMailAppMemberDto,
  TransferMailAppOwnershipDto,
  UpdateMailAppMemberDto,
} from './dto/mail-member.dto';

@ApiTags('Mail - Team')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'mail', version: '1' })
export class MailMembersController {
  constructor(private readonly members: MailMembersService) {}

  @Get('invitations')
  @ApiOperation({ summary: 'Pending Mail workspace invitations for me' })
  listInvitations(@CurrentUser() user: AuthenticatedUser) {
    return this.members.listMyInvitations(user.id);
  }

  @Post('invitations/:memberId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a Mail workspace invitation' })
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('memberId') memberId: string,
  ) {
    return this.members.acceptInvitation(user.id, memberId);
  }

  @Post('invitations/:memberId/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline a Mail workspace invitation' })
  decline(
    @CurrentUser() user: AuthenticatedUser,
    @Param('memberId') memberId: string,
  ) {
    return this.members.declineInvitation(user.id, memberId);
  }

  @Public()
  @Get('invites/:token')
  @ApiOperation({ summary: 'Preview an email-only Mail workspace invite' })
  previewInvite(@Param('token') token: string) {
    return this.members.getEmailInvitePreview(token);
  }

  @Post('invites/:token/claim')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Claim an email-only invite after signup/login' })
  claimInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('token') token: string,
  ) {
    return this.members.claimEmailInvite(user.id, token);
  }

  @Get('apps/:appId/members')
  @ApiOperation({ summary: 'List team members for a Mail workspace' })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.members.list(user.id, appId);
  }

  @Post('apps/:appId/members')
  @ApiOperation({ summary: 'Invite a teammate (existing or new Rukny email)' })
  invite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: InviteMailAppMemberDto,
  ) {
    return this.members.invite(user.id, appId, dto);
  }

  @Post('apps/:appId/members/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a Mail workspace you joined' })
  leave(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
  ) {
    return this.members.leave(user.id, appId);
  }

  @Post('apps/:appId/transfer-ownership')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer workspace ownership to an accepted member' })
  transferOwnership(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Body() dto: TransferMailAppOwnershipDto,
  ) {
    return this.members.transferOwnership(user.id, appId, dto);
  }

  @Post('apps/:appId/members/:memberId/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend a pending member or email invite' })
  resend(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.members.resend(user.id, appId, memberId);
  }

  @Patch('apps/:appId/members/:memberId')
  @ApiOperation({ summary: 'Update a team member role' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMailAppMemberDto,
  ) {
    return this.members.update(user.id, appId, memberId, dto);
  }

  @Delete('apps/:appId/members/:memberId')
  @ApiOperation({ summary: 'Remove a member or cancel a pending invite' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('appId') appId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.members.remove(user.id, appId, memberId);
  }
}
