import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/common/guards/auth/jwt-auth.guard';
import { WorkspaceService } from './workspace.service';
import { WorkspaceAccessService } from './workspace-access.service';
import {
  InviteWorkspaceMemberDto,
  UpdateWorkspaceMemberDto,
} from './dto/workspace.dto';

@ApiTags('Workspace Team')
@Controller('workspace')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkspaceController {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Get('accessible')
  @ApiOperation({ summary: 'قائمة مساحات العمل التي يستطيع المستخدم الوصول إليها' })
  listAccessible(@Request() req: { user: { id: string } }) {
    return this.workspaceAccess.listAccessibleWorkspaces(req.user.id);
  }

  @Get('quota')
  @ApiOperation({ summary: 'حصة أعضاء الفريق حسب الباقة' })
  getQuota(@Request() req: { user: { id: string } }) {
    return this.workspaceService.getQuota(req.user.id, req.user.id);
  }

  @Get('members')
  @ApiOperation({ summary: 'قائمة أعضاء فريق الحساب' })
  listMembers(@Request() req: { user: { id: string } }) {
    return this.workspaceService.listMembers(req.user.id, req.user.id);
  }

  @Post('invitations')
  @ApiOperation({ summary: 'دعوة عضو بالبريد الإلكتروني' })
  invite(
    @Request() req: { user: { id: string } },
    @Body() dto: InviteWorkspaceMemberDto,
  ) {
    return this.workspaceService.inviteMember(req.user.id, req.user.id, dto);
  }

  @Get('invitations/incoming')
  @ApiOperation({ summary: 'الدعوات الواردة للمستخدم' })
  listIncoming(@Request() req: { user: { id: string } }) {
    return this.workspaceService.listIncomingInvitations(req.user.id);
  }

  @Post('invitations/:id/accept')
  @ApiOperation({ summary: 'قبول دعوة الفريق' })
  accept(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.workspaceService.acceptInvitation(id, req.user.id);
  }

  @Post('invitations/:id/decline')
  @ApiOperation({ summary: 'رفض دعوة الفريق' })
  decline(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.workspaceService.declineInvitation(id, req.user.id);
  }

  @Delete('invitations/:id')
  @ApiOperation({ summary: 'إلغاء دعوة معلّقة' })
  cancelInvitation(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.workspaceService.cancelInvitation(req.user.id, id, req.user.id);
  }

  @Patch('members/:id')
  @ApiOperation({ summary: 'تغيير دور عضو' })
  updateMember(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceMemberDto,
  ) {
    return this.workspaceService.updateMember(
      req.user.id,
      id,
      req.user.id,
      dto,
    );
  }

  @Delete('members/:id')
  @ApiOperation({ summary: 'إزالة عضو من الفريق' })
  removeMember(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
  ) {
    return this.workspaceService.removeMember(req.user.id, id, req.user.id);
  }
}
