import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvitationStatus,
  MailAppMemberRole,
  MailAppStatus,
  MailPlan,
  type MailSubscription,
} from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailAppAccessService } from './mail-app-access.service';
import { MAIL_PLAN_LIMITS } from './mail-plan-limits.config';
import {
  InviteMailAppMemberDto,
  UpdateMailAppMemberDto,
} from './dto/mail-member.dto';

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
  mailApp: {
    select: {
      id: true,
      appId: true,
      name: true,
      primaryDomain: true,
      status: true,
      userId: true,
    },
  },
} as const;

const ROLE_LABELS: Record<MailAppMemberRole, string> = {
  ADMIN: 'Admin',
  BILLING: 'Billing',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
};

@Injectable()
export class MailMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: MailAppAccessService,
    private readonly notifications: NotificationsService,
  ) {}

  private toMemberView(row: {
    id: string;
    role: MailAppMemberRole;
    status: InvitationStatus;
    invitedAt: Date;
    acceptedAt: Date | null;
    slotIndex: number | null;
    user: {
      id: string;
      email: string;
      profile: { name: string | null; username: string | null; avatar: string | null } | null;
    };
    inviter: {
      id: string;
      email: string;
      profile: { name: string | null; username: string | null } | null;
    };
  }) {
    return {
      id: row.id,
      role: row.role,
      status: row.status,
      invitedAt: row.invitedAt.toISOString(),
      acceptedAt: row.acceptedAt?.toISOString() ?? null,
      slotIndex: row.slotIndex,
      user: {
        id: row.user.id,
        email: row.user.email,
        name: row.user.profile?.name || row.user.profile?.username || null,
        avatar: row.user.profile?.avatar || null,
      },
      inviter: {
        id: row.inviter.id,
        email: row.inviter.email,
        name:
          row.inviter.profile?.name || row.inviter.profile?.username || null,
      },
    };
  }

  private consoleMemberLimit(subscription: MailSubscription | null): number {
    if (!subscription || subscription.status !== 'ACTIVE') {
      return MAIL_PLAN_LIMITS.STARTER.consoleMembersIncluded;
    }
    const plan = subscription.plan as MailPlan;
    return MAIL_PLAN_LIMITS[plan]?.consoleMembersIncluded ?? 0;
  }

  async list(userId: string, publicAppId: string) {
    const access = await this.access.requireAccess(userId, publicAppId);
    const [members, subscription, owner] = await Promise.all([
      this.prisma.mailAppMember.findMany({
        where: {
          mailAppId: access.app.id,
          status: { in: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED] },
        },
        include: memberInclude,
        orderBy: { invitedAt: 'asc' },
      }),
      this.prisma.mailSubscription.findUnique({
        where: { mailAppId: access.app.id },
      }),
      this.prisma.user.findUnique({
        where: { id: access.app.userId },
        select: {
          id: true,
          email: true,
          profile: { select: { name: true, username: true, avatar: true } },
        },
      }),
    ]);

    const limit = this.consoleMemberLimit(subscription);
    const used = members.filter(
      (m) =>
        m.status === InvitationStatus.ACCEPTED ||
        m.status === InvitationStatus.PENDING,
    ).length;

    return {
      canManage: this.access.canManageTeam(access),
      consoleMembersIncluded: limit,
      consoleMembersUsed: used,
      owner: owner
        ? {
            id: owner.id,
            email: owner.email,
            name: owner.profile?.name || owner.profile?.username || null,
            avatar: owner.profile?.avatar || null,
            role: 'OWNER' as const,
          }
        : null,
      members: members.map((row) => this.toMemberView(row)),
    };
  }

  async invite(userId: string, publicAppId: string, dto: InviteMailAppMemberDto) {
    const access = await this.access.requireAccess(userId, publicAppId);
    if (!this.access.canManageTeam(access)) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAIL_TEAM_MANAGE_REQUIRED',
        message: 'Only the owner or an admin can invite teammates.',
      });
    }

    const subscription = await this.prisma.mailSubscription.findUnique({
      where: { mailAppId: access.app.id },
    });
    const limit = this.consoleMemberLimit(subscription);
    if (limit <= 0) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAIL_TEAM_PLAN_REQUIRED',
        message:
          'Team invites require Standard or Premium. Upgrade this workspace to invite teammates.',
      });
    }

    const used = await this.prisma.mailAppMember.count({
      where: {
        mailAppId: access.app.id,
        status: { in: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED] },
      },
    });
    if (used >= limit) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAIL_TEAM_LIMIT',
        message: `This plan allows ${limit} console members. Remove someone or upgrade.`,
      });
    }

    const email = dto.email.trim().toLowerCase();
    const invitee = await this.prisma.user.findFirst({
      where: { email },
      include: { profile: { select: { name: true } } },
    });
    if (!invitee) {
      throw new NotFoundException(
        'No Rukny account found with that email. They need to sign up first.',
      );
    }
    if (invitee.id === access.app.userId) {
      throw new BadRequestException('The workspace owner is already on the team.');
    }
    if (invitee.id === userId) {
      throw new BadRequestException('You cannot invite yourself.');
    }

    const existing = await this.prisma.mailAppMember.findUnique({
      where: {
        mailAppId_userId: { mailAppId: access.app.id, userId: invitee.id },
      },
    });
    if (
      existing &&
      (existing.status === InvitationStatus.PENDING ||
        existing.status === InvitationStatus.ACCEPTED)
    ) {
      throw new BadRequestException(
        'This person is already a member or has a pending invite.',
      );
    }

    const role = dto.role as MailAppMemberRole;
    const member = existing
      ? await this.prisma.mailAppMember.update({
          where: { id: existing.id },
          data: {
            role,
            status: InvitationStatus.PENDING,
            invitedBy: userId,
            invitedAt: new Date(),
            acceptedAt: null,
            slotIndex: null,
          },
          include: memberInclude,
        })
      : await this.prisma.mailAppMember.create({
          data: {
            mailAppId: access.app.id,
            userId: invitee.id,
            role,
            status: InvitationStatus.PENDING,
            invitedBy: userId,
          },
          include: memberInclude,
        });

    const inviter = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { select: { name: true, username: true } } },
    });
    const inviterName =
      inviter?.profile?.name ||
      inviter?.profile?.username ||
      inviter?.email ||
      'A teammate';

    await this.notifications.create({
      userId: invitee.id,
      type: 'FORM_SHARED',
      title: 'Mail workspace invitation',
      message: `${inviterName} invited you to ${access.app.name} as ${ROLE_LABELS[role]}.`,
      data: {
        kind: 'mail_team_invite',
        memberId: member.id,
        appId: access.app.appId,
        workspaceName: access.app.name,
        role,
        inviterName,
      },
    });

    return { member: this.toMemberView(member) };
  }

  async update(
    userId: string,
    publicAppId: string,
    memberId: string,
    dto: UpdateMailAppMemberDto,
  ) {
    const access = await this.access.requireAccess(userId, publicAppId);
    if (!this.access.canManageTeam(access)) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAIL_TEAM_MANAGE_REQUIRED',
        message: 'Only the owner or an admin can change roles.',
      });
    }

    const member = await this.prisma.mailAppMember.findFirst({
      where: { id: memberId, mailAppId: access.app.id },
      include: memberInclude,
    });
    if (!member) throw new NotFoundException('Team member not found.');

    if (!dto.role) {
      return { member: this.toMemberView(member) };
    }

    const updated = await this.prisma.mailAppMember.update({
      where: { id: member.id },
      data: { role: dto.role as MailAppMemberRole },
      include: memberInclude,
    });
    return { member: this.toMemberView(updated) };
  }

  async remove(userId: string, publicAppId: string, memberId: string) {
    const access = await this.access.requireAccess(userId, publicAppId);
    if (!this.access.canManageTeam(access)) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAIL_TEAM_MANAGE_REQUIRED',
        message: 'Only the owner or an admin can remove teammates.',
      });
    }

    const member = await this.prisma.mailAppMember.findFirst({
      where: { id: memberId, mailAppId: access.app.id },
    });
    if (!member) throw new NotFoundException('Team member not found.');

    await this.prisma.mailMailbox.updateMany({
      where: {
        mailAppId: access.app.id,
        assignedUserId: member.userId,
      },
      data: { assignedUserId: null },
    });

    await this.prisma.mailAppMember.update({
      where: { id: member.id },
      data: {
        status: InvitationStatus.CANCELLED,
        slotIndex: null,
      },
    });

    return { ok: true as const };
  }

  async listMyInvitations(userId: string) {
    const rows = await this.prisma.mailAppMember.findMany({
      where: {
        userId,
        status: InvitationStatus.PENDING,
        mailApp: { status: MailAppStatus.ACTIVE },
      },
      include: memberInclude,
      orderBy: { invitedAt: 'desc' },
    });

    return {
      invitations: rows.map((row) => ({
        ...this.toMemberView(row),
        workspace: {
          appId: row.mailApp.appId,
          name: row.mailApp.name,
          primaryDomain: row.mailApp.primaryDomain,
        },
      })),
    };
  }

  private async allocateMemberSlot(userId: string): Promise<number> {
    const [owned, memberships] = await Promise.all([
      this.prisma.mailApp.aggregate({
        where: { userId },
        _max: { slotIndex: true },
      }),
      this.prisma.mailAppMember.aggregate({
        where: {
          userId,
          status: InvitationStatus.ACCEPTED,
          slotIndex: { not: null },
        },
        _max: { slotIndex: true },
      }),
    ]);
    const maxOwned = owned._max.slotIndex ?? -1;
    const maxMember = memberships._max.slotIndex ?? -1;
    return Math.max(maxOwned, maxMember) + 1;
  }

  async acceptInvitation(userId: string, memberId: string) {
    const member = await this.prisma.mailAppMember.findFirst({
      where: {
        id: memberId,
        userId,
        status: InvitationStatus.PENDING,
        mailApp: { status: MailAppStatus.ACTIVE },
      },
      include: memberInclude,
    });
    if (!member) {
      throw new NotFoundException('Invitation not found.');
    }

    const slotIndex = await this.allocateMemberSlot(userId);
    const updated = await this.prisma.mailAppMember.update({
      where: { id: member.id },
      data: {
        status: InvitationStatus.ACCEPTED,
        acceptedAt: new Date(),
        slotIndex,
      },
      include: memberInclude,
    });

    return {
      member: this.toMemberView(updated),
      workspace: {
        appId: updated.mailApp.appId,
        name: updated.mailApp.name,
        slotIndex,
      },
    };
  }

  async declineInvitation(userId: string, memberId: string) {
    const member = await this.prisma.mailAppMember.findFirst({
      where: {
        id: memberId,
        userId,
        status: InvitationStatus.PENDING,
      },
    });
    if (!member) {
      throw new NotFoundException('Invitation not found.');
    }

    await this.prisma.mailAppMember.update({
      where: { id: member.id },
      data: { status: InvitationStatus.DECLINED, slotIndex: null },
    });
    return { ok: true as const };
  }

  async leave(userId: string, publicAppId: string) {
    const access = await this.access.requireAccess(userId, publicAppId);
    if (access.isOwner) {
      throw new BadRequestException(
        'Owners cannot leave. Archive the workspace or transfer ownership first.',
      );
    }

    const member = await this.prisma.mailAppMember.findUnique({
      where: {
        mailAppId_userId: { mailAppId: access.app.id, userId },
      },
    });
    if (!member || member.status !== InvitationStatus.ACCEPTED) {
      throw new NotFoundException('You are not a member of this workspace.');
    }

    await this.prisma.mailMailbox.updateMany({
      where: { mailAppId: access.app.id, assignedUserId: userId },
      data: { assignedUserId: null },
    });

    await this.prisma.mailAppMember.update({
      where: { id: member.id },
      data: { status: InvitationStatus.CANCELLED, slotIndex: null },
    });

    return { ok: true as const };
  }
}
