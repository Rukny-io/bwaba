import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvitationStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { EmailService } from '../../integrations/email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { WorkspaceAccessService } from './workspace-access.service';
import { WORKSPACE_ROLE_LABELS } from './workspace-roles.config';
import {
  InviteWorkspaceMemberDto,
  UpdateWorkspaceMemberDto,
} from './dto/workspace.dto';

const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
export class WorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: WorkspaceAccessService,
    private readonly emailService: EmailService,
    private readonly notifications: NotificationsService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  private async expireStaleInvitations(workspaceId: string) {
    const cutoff = new Date(Date.now() - INVITATION_TTL_MS);
    await this.prisma.workspaceMember.updateMany({
      where: {
        workspaceId,
        status: InvitationStatus.PENDING,
        invitedAt: { lt: cutoff },
      },
      data: { status: InvitationStatus.EXPIRED },
    });
  }

  private async assertTeamFeature(workspaceId: string) {
    const featureCheck = await this.subscriptions.checkLimit(
      workspaceId,
      'formTeam',
    );
    if (!featureCheck.allowed) {
      throw new ForbiddenException({
        message: 'فريق العمل متاح في باقة Pro أو أعلى',
        code: 'PLAN_REQUIRED',
      });
    }
  }

  private async assertSeatAvailable(workspaceId: string) {
    await this.expireStaleInvitations(workspaceId);
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
  }

  async getQuota(workspaceId: string, requesterId: string) {
    await this.access.assertCanManageTeam(workspaceId, requesterId);
    await this.expireStaleInvitations(workspaceId);

    const [featureCheck, seatCheck, subscription] = await Promise.all([
      this.subscriptions.checkLimit(workspaceId, 'formTeam'),
      this.subscriptions.checkLimit(workspaceId, 'teamMembers'),
      this.subscriptions.getSubscriptionDetails(workspaceId),
    ]);

    return {
      enabled: featureCheck.allowed,
      used: seatCheck.current,
      limit: seatCheck.limit,
      plan: subscription.plan,
    };
  }

  async listMembers(workspaceId: string, requesterId: string) {
    await this.access.assertCanManageTeam(workspaceId, requesterId);
    await this.expireStaleInvitations(workspaceId);

    const owner = await this.prisma.user.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        email: true,
        profile: { select: { name: true, username: true, avatar: true } },
      },
    });

    const members = await this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        status: { not: InvitationStatus.EXPIRED },
      },
      include: memberInclude,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    return {
      owner: owner
        ? {
            id: owner.id,
            email: owner.email,
            profile: owner.profile,
            role: 'OWNER' as const,
            status: 'ACCEPTED' as const,
          }
        : null,
      members,
    };
  }

  async listIncomingInvitations(userId: string) {
    await this.expireStaleInvitationsForUser(userId);

    return this.prisma.workspaceMember.findMany({
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

  private async expireStaleInvitationsForUser(userId: string) {
    const cutoff = new Date(Date.now() - INVITATION_TTL_MS);
    await this.prisma.workspaceMember.updateMany({
      where: {
        userId,
        status: InvitationStatus.PENDING,
        invitedAt: { lt: cutoff },
      },
      data: { status: InvitationStatus.EXPIRED },
    });
  }

  async inviteMember(
    workspaceId: string,
    inviterId: string,
    dto: InviteWorkspaceMemberDto,
  ) {
    await this.access.assertCanManageTeam(
      workspaceId,
      inviterId,
      'فقط مالك الحساب أو المدير يمكنه دعوة أعضاء',
    );
    await this.assertTeamFeature(workspaceId);
    await this.assertSeatAvailable(workspaceId);

    const email = dto.email.trim().toLowerCase();
    const userToInvite = await this.prisma.user.findFirst({
      where: { email },
      include: { profile: { select: { name: true } } },
    });

    if (!userToInvite) {
      throw new NotFoundException(
        'لا يوجد حساب في ركني بهذا البريد. يجب أن يسجّل المستخدم أولاً.',
      );
    }

    if (userToInvite.id === workspaceId) {
      throw new BadRequestException('لا يمكن دعوة مالك الحساب');
    }

    const existing = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: userToInvite.id,
        },
      },
    });

    if (existing) {
      if (
        existing.status === InvitationStatus.PENDING ||
        existing.status === InvitationStatus.ACCEPTED
      ) {
        throw new BadRequestException('المستخدم عضو بالفعل أو لديه دعوة معلّقة');
      }
      if (
        existing.status === InvitationStatus.DECLINED ||
        existing.status === InvitationStatus.CANCELLED ||
        existing.status === InvitationStatus.EXPIRED
      ) {
        await this.prisma.workspaceMember.delete({ where: { id: existing.id } });
      }
    }

    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
      include: { profile: { select: { name: true, username: true } } },
    });

    const member = await this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: userToInvite.id,
        role: dto.role,
        invitedBy: inviterId,
        status: InvitationStatus.PENDING,
      },
      include: memberInclude,
    });

    const inviterName =
      inviter?.profile?.name || inviter?.profile?.username || 'عضو الفريق';
    const workspaceName =
      inviter?.profile?.name || inviter?.profile?.username || inviter?.email || 'فريق ركني';

    await this.emailService.sendAccountTeamInvitation(userToInvite.email, {
      inviterName,
      role: WORKSPACE_ROLE_LABELS[dto.role],
      workspaceName,
    });

    await this.notifications.create({
      userId: userToInvite.id,
      type: 'SYSTEM',
      title: 'دعوة للانضمام لفريق العمل',
      message: `${inviterName} دعاك للانضمام كـ ${WORKSPACE_ROLE_LABELS[dto.role]}`,
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
    dto: UpdateWorkspaceMemberDto,
  ) {
    if (!this.access.isWorkspaceOwner(workspaceId, requesterId)) {
      throw new ForbiddenException('فقط مالك الحساب يمكنه تغيير الأدوار');
    }

    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });
    if (!member) throw new NotFoundException('العضو غير موجود');
    if (member.status !== InvitationStatus.ACCEPTED) {
      throw new BadRequestException('يمكن تعديل دور الأعضاء النشطين فقط');
    }

    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: memberInclude,
    });
  }

  async removeMember(
    workspaceId: string,
    memberId: string,
    requesterId: string,
  ) {
    await this.access.assertCanManageTeam(workspaceId, requesterId);

    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });
    if (!member) throw new NotFoundException('العضو غير موجود');

    await this.prisma.workspaceMember.delete({ where: { id: memberId } });
    return { success: true };
  }

  async cancelInvitation(
    workspaceId: string,
    memberId: string,
    requesterId: string,
  ) {
    await this.access.assertCanManageTeam(workspaceId, requesterId);

    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });
    if (!member) throw new NotFoundException('الدعوة غير موجودة');

    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { status: InvitationStatus.CANCELLED },
      include: memberInclude,
    });
  }

  async acceptInvitation(memberId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, userId },
    });
    if (!member) throw new NotFoundException('الدعوة غير موجودة');
    if (member.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('تمت معالجة هذه الدعوة مسبقاً');
    }

    const invitedAt = member.invitedAt.getTime();
    if (Date.now() - invitedAt > INVITATION_TTL_MS) {
      await this.prisma.workspaceMember.update({
        where: { id: memberId },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('انتهت صلاحية الدعوة');
    }

    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: {
        status: InvitationStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
      include: memberInclude,
    });
  }

  async declineInvitation(memberId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, userId },
    });
    if (!member) throw new NotFoundException('الدعوة غير موجودة');
    if (member.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('تمت معالجة هذه الدعوة مسبقاً');
    }

    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { status: InvitationStatus.DECLINED },
    });
  }
}
