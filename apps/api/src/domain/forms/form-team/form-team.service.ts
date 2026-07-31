import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FormTeamRole, InvitationStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { EmailService } from '../../../integrations/email/email.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { FormTeamAccessService } from './form-team-access.service';
import {
  FORM_TEAM_ROLE_LABELS,
  getDefaultPermissionsForRole,
} from './form-team-permissions';
import {
  InviteFormTeamMemberDto,
  UpdateFormTeamMemberDto,
} from './dto/form-team.dto';

const memberInclude = {
  user: {
    select: {
      id: true,
      email: true,
      profile: { select: { name: true, username: true, avatar: true } },
    },
  },
  inviter: {
    select: {
      id: true,
      email: true,
      profile: { select: { name: true, username: true } },
    },
  },
} as const;

@Injectable()
export class FormTeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: FormTeamAccessService,
    private readonly emailService: EmailService,
    private readonly notifications: NotificationsService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async listMembers(workspaceId: string, requesterId: string) {
    await this.access.assertWorkspacePermission(
      workspaceId,
      requesterId,
      'manage_team',
      'Only workspace owner or team admins can view members',
    );

    return this.prisma.formTeamMember.findMany({
      where: { workspaceId },
      include: memberInclude,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async listMyInvitations(userId: string) {
    return this.prisma.formTeamMember.findMany({
      where: { userId, status: InvitationStatus.PENDING },
      include: {
        workspace: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, username: true, avatar: true } },
          },
        },
        inviter: {
          select: {
            profile: { select: { name: true, username: true } },
          },
        },
      },
      orderBy: { invitedAt: 'desc' },
    });
  }

  async listMyWorkspaces(userId: string) {
    const memberships = await this.prisma.formTeamMember.findMany({
      where: { userId, status: InvitationStatus.ACCEPTED },
      include: {
        workspace: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, username: true, avatar: true } },
          },
        },
      },
      orderBy: { acceptedAt: 'desc' },
    });

    return memberships.map((m) => ({
      memberId: m.id,
      workspaceId: m.workspaceId,
      role: m.role,
      permissions: m.permissions,
      workspace: m.workspace,
      acceptedAt: m.acceptedAt,
    }));
  }

  async inviteMember(
    workspaceId: string,
    inviterId: string,
    dto: InviteFormTeamMemberDto,
  ) {
    await this.access.assertWorkspacePermission(
      workspaceId,
      inviterId,
      'manage_team',
      'Only workspace owner or team admins can invite members',
    );

    const featureCheck = await this.subscriptions.checkLimit(
      workspaceId,
      'formTeam',
    );
    if (!featureCheck.allowed) {
      throw new ForbiddenException({
        message: 'ميزة الفريق متاحة في باقة بلس أو أعلى',
        code: 'PLAN_REQUIRED',
      });
    }

    const seatCheck = await this.subscriptions.checkLimit(
      workspaceId,
      'teamMembers',
    );
    if (!seatCheck.allowed) {
      throw new ForbiddenException({
        message: `وصلت للحد الأقصى من أعضاء الفريق (${seatCheck.limit})`,
        code: 'LIMIT_REACHED',
        current: seatCheck.current,
        limit: seatCheck.limit,
      });
    }

    const email = dto.email.trim().toLowerCase();
    const userToInvite = await this.prisma.user.findFirst({
      where: { email },
      include: { profile: { select: { name: true } } },
    });

    if (!userToInvite) {
      throw new NotFoundException('لا يوجد مستخدم مسجّل بهذا البريد');
    }

    if (userToInvite.id === workspaceId) {
      throw new BadRequestException('لا يمكن دعوة مالك مساحة العمل');
    }

    const existing = await this.prisma.formTeamMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: userToInvite.id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('المستخدم عضو بالفعل أو لديه دعوة معلّقة');
    }

    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
      include: { profile: { select: { name: true, username: true } } },
    });

    const permissions = this.access.resolvePermissions(
      dto.role,
      dto.permissions,
    );

    const member = await this.prisma.formTeamMember.create({
      data: {
        workspaceId,
        userId: userToInvite.id,
        role: dto.role,
        permissions,
        invitedBy: inviterId,
        status: InvitationStatus.PENDING,
      },
      include: memberInclude,
    });

    const inviterName =
      inviter?.profile?.name || inviter?.profile?.username || 'عضو الفريق';

    await this.emailService.sendFormTeamInvitation(userToInvite.email, {
      inviterName,
      role: FORM_TEAM_ROLE_LABELS[dto.role],
      workspaceName: inviter?.profile?.name || inviter?.email || 'مساحة عمل',
    });

    await this.notifications.create({
      userId: userToInvite.id,
      type: 'FORM_SHARED',
      title: 'دعوة للانضمام لفريق النماذج',
      message: `${inviterName} دعاك للانضمام كـ ${FORM_TEAM_ROLE_LABELS[dto.role]}`,
      data: {
        memberId: member.id,
        workspaceId,
        role: dto.role,
        inviterName,
      },
    });

    return member;
  }

  async updateMember(
    workspaceId: string,
    memberId: string,
    requesterId: string,
    dto: UpdateFormTeamMemberDto,
  ) {
    await this.access.assertWorkspacePermission(
      workspaceId,
      requesterId,
      'manage_team',
    );

    const member = await this.prisma.formTeamMember.findFirst({
      where: { id: memberId, workspaceId },
    });
    if (!member) throw new NotFoundException('العضو غير موجود');

    const role = dto.role ?? member.role;
    const permissions = dto.permissions?.length
      ? dto.permissions
      : dto.role
        ? getDefaultPermissionsForRole(dto.role)
        : member.permissions;

    return this.prisma.formTeamMember.update({
      where: { id: memberId },
      data: { role, permissions },
      include: memberInclude,
    });
  }

  async removeMember(
    workspaceId: string,
    memberId: string,
    requesterId: string,
  ) {
    await this.access.assertWorkspacePermission(
      workspaceId,
      requesterId,
      'manage_team',
    );

    const member = await this.prisma.formTeamMember.findFirst({
      where: { id: memberId, workspaceId },
    });
    if (!member) throw new NotFoundException('العضو غير موجود');

    await this.prisma.formTeamMember.delete({ where: { id: memberId } });
    return { success: true };
  }

  async leaveWorkspace(workspaceId: string, userId: string) {
    if (workspaceId === userId) {
      throw new BadRequestException('لا يمكن مغادرة مساحة عملك الخاصة');
    }

    const member = await this.prisma.formTeamMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      include: {
        user: {
          select: {
            profile: { select: { name: true, username: true } },
          },
        },
        workspace: {
          select: {
            profile: { select: { name: true, username: true } },
            email: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('أنت لست عضواً في هذا الفريق');
    }
    if (member.status !== InvitationStatus.ACCEPTED) {
      throw new BadRequestException('لا يمكن مغادرة فريق لم تنضم إليه بعد');
    }

    await this.prisma.formTeamMember.delete({ where: { id: member.id } });

    const memberName =
      member.user.profile?.name ||
      member.user.profile?.username ||
      'عضو';
    const workspaceName =
      member.workspace.profile?.name ||
      member.workspace.profile?.username ||
      member.workspace.email;

    await this.notifications.create({
      userId: workspaceId,
      type: 'FORM_SHARED',
      title: 'مغادرة عضو من الفريق',
      message: `${memberName} غادر فريق النماذج`,
      data: { userId, workspaceId, workspaceName },
    });

    return { success: true };
  }

  async acceptInvitation(memberId: string, userId: string) {
    const member = await this.prisma.formTeamMember.findFirst({
      where: { id: memberId, userId },
      include: {
        workspace: {
          select: {
            profile: { select: { name: true, username: true } },
          },
        },
      },
    });

    if (!member) throw new NotFoundException('الدعوة غير موجودة');
    if (member.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('تمت معالجة هذه الدعوة مسبقاً');
    }

    const updated = await this.prisma.formTeamMember.update({
      where: { id: memberId },
      data: {
        status: InvitationStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
      include: memberInclude,
    });

    const memberName =
      updated.user.profile?.name || updated.user.profile?.username || 'عضو';

    await this.notifications.create({
      userId: member.workspaceId,
      type: 'FORM_SHARED',
      title: 'انضمام عضو جديد للفريق',
      message: `${memberName} قبل الدعوة وانضم للفريق`,
      data: { memberId: updated.id, userId },
    });

    return updated;
  }

  async declineInvitation(memberId: string, userId: string) {
    const member = await this.prisma.formTeamMember.findFirst({
      where: { id: memberId, userId },
    });
    if (!member) throw new NotFoundException('الدعوة غير موجودة');
    if (member.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('تمت معالجة هذه الدعوة مسبقاً');
    }

    return this.prisma.formTeamMember.update({
      where: { id: memberId },
      data: { status: InvitationStatus.DECLINED },
    });
  }

  async cancelInvitation(
    workspaceId: string,
    memberId: string,
    requesterId: string,
  ) {
    await this.access.assertWorkspacePermission(
      workspaceId,
      requesterId,
      'manage_team',
    );

    const member = await this.prisma.formTeamMember.findFirst({
      where: { id: memberId, workspaceId },
    });
    if (!member) throw new NotFoundException('الدعوة غير موجودة');

    return this.prisma.formTeamMember.update({
      where: { id: memberId },
      data: { status: InvitationStatus.CANCELLED },
    });
  }
}
