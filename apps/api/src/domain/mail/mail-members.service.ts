import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import {
  InvitationStatus,
  MailAppMemberRole,
  MailAppStatus,
  MailMailboxStatus,
  MailPlan,
  type MailSubscription,
} from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { EmailService } from '../../integrations/email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailAppAccessService } from './mail-app-access.service';
import { MAIL_PLAN_LIMITS } from './mail-plan-limits.config';
import {
  InviteMailAppMemberDto,
  TransferMailAppOwnershipDto,
  UpdateMailAppMemberDto,
} from './dto/mail-member.dto';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60_000;

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
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  private mailAppUrl(path = '/apps'): string {
    const base = (
      this.config.get<string>('NEXT_PUBLIC_MAIL_URL') ||
      this.config.get<string>('MAIL_APP_URL') ||
      'https://mail.rukny.io'
    ).replace(/\/$/, '');
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalized}`;
  }

  private accountsUrl(path = '/login'): string {
    const base = (
      this.config.get<string>('AUTH_FRONTEND_URL') ||
      this.config.get<string>('NEXT_PUBLIC_ACCOUNTS_URL') ||
      'https://accounts.rukny.io'
    ).replace(/\/$/, '');
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalized}`;
  }

  private inviteExpiryDate(from = new Date()): Date {
    return new Date(from.getTime() + INVITE_TTL_MS);
  }

  private newInviteToken(): string {
    return randomBytes(24).toString('hex');
  }

  private toMemberView(
    row: {
      id: string;
      role: MailAppMemberRole;
      status: InvitationStatus;
      invitedAt: Date;
      acceptedAt: Date | null;
      expiresAt?: Date | null;
      slotIndex: number | null;
      user: {
        id: string;
        email: string;
        profile: {
          name: string | null;
          username: string | null;
          avatar: string | null;
        } | null;
      };
      inviter: {
        id: string;
        email: string;
        profile: { name: string | null; username: string | null } | null;
      };
    },
    assignedMailboxes: { id: string; localPart: string; domain: string }[] = [],
  ) {
    return {
      id: row.id,
      role: row.role,
      status: row.status,
      invitedAt: row.invitedAt.toISOString(),
      acceptedAt: row.acceptedAt?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null,
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
      assignedMailboxes,
    };
  }

  private toEmailInviteView(row: {
    id: string;
    email: string;
    role: MailAppMemberRole;
    status: InvitationStatus;
    invitedAt: Date;
    expiresAt: Date;
    inviter: {
      id: string;
      email: string;
      profile: { name: string | null; username: string | null } | null;
    };
  }) {
    return {
      id: row.id,
      kind: 'email_invite' as const,
      email: row.email,
      role: row.role,
      status: row.status,
      invitedAt: row.invitedAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
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

  private async expireStaleMemberInvites(mailAppId?: string) {
    const where = {
      status: InvitationStatus.PENDING,
      expiresAt: { lt: new Date() },
      ...(mailAppId ? { mailAppId } : {}),
    };
    await this.prisma.mailAppMember.updateMany({
      where,
      data: { status: InvitationStatus.EXPIRED },
    });
    await this.prisma.mailAppEmailInvite.updateMany({
      where: {
        status: InvitationStatus.PENDING,
        expiresAt: { lt: new Date() },
        ...(mailAppId ? { mailAppId } : {}),
      },
      data: { status: InvitationStatus.EXPIRED },
    });
  }

  private async countSeatsUsed(mailAppId: string): Promise<number> {
    const [members, emailInvites] = await Promise.all([
      this.prisma.mailAppMember.count({
        where: {
          mailAppId,
          status: {
            in: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED],
          },
        },
      }),
      this.prisma.mailAppEmailInvite.count({
        where: {
          mailAppId,
          status: InvitationStatus.PENDING,
        },
      }),
    ]);
    return members + emailInvites;
  }

  private async assertSeatAvailable(mailAppId: string, limit: number) {
    if (limit <= 0) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAIL_TEAM_PLAN_REQUIRED',
        message:
          'Team invites require Standard or Premium. Upgrade this workspace to invite teammates.',
      });
    }
    const used = await this.countSeatsUsed(mailAppId);
    if (used >= limit) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAIL_TEAM_LIMIT',
        message: `This plan allows ${limit} console members. Remove someone or upgrade.`,
      });
    }
  }

  private async sendExistingUserInviteEmail(opts: {
    to: string;
    inviterName: string;
    role: MailAppMemberRole;
    workspaceName: string;
  }) {
    await this.email.sendMailTeamInvitation(opts.to, {
      inviterName: opts.inviterName,
      role: ROLE_LABELS[opts.role],
      workspaceName: opts.workspaceName,
      inviteUrl: this.mailAppUrl('/apps'),
      needsSignup: false,
    });
  }

  private async sendSignupInviteEmail(opts: {
    to: string;
    inviterName: string;
    role: MailAppMemberRole;
    workspaceName: string;
    token: string;
  }) {
    const claimPath = `/invite/${opts.token}`;
    const inviteUrl = this.accountsUrl(
      `/login?next=${encodeURIComponent(this.mailAppUrl(claimPath))}`,
    );
    await this.email.sendMailTeamInvitation(opts.to, {
      inviterName: opts.inviterName,
      role: ROLE_LABELS[opts.role],
      workspaceName: opts.workspaceName,
      inviteUrl,
      needsSignup: true,
    });
  }

  async list(userId: string, publicAppId: string) {
    const access = await this.access.requireAccess(userId, publicAppId);
    await this.expireStaleMemberInvites(access.app.id);

    const [members, emailInvites, subscription, owner, mailboxes] =
      await Promise.all([
        this.prisma.mailAppMember.findMany({
          where: {
            mailAppId: access.app.id,
            status: {
              in: [InvitationStatus.PENDING, InvitationStatus.ACCEPTED],
            },
          },
          include: memberInclude,
          orderBy: { invitedAt: 'asc' },
        }),
        this.prisma.mailAppEmailInvite.findMany({
          where: {
            mailAppId: access.app.id,
            status: InvitationStatus.PENDING,
          },
          include: {
            inviter: {
              select: {
                id: true,
                email: true,
                profile: { select: { name: true, username: true } },
              },
            },
          },
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
        this.prisma.mailMailbox.findMany({
          where: {
            mailAppId: access.app.id,
            status: MailMailboxStatus.ACTIVE,
          },
          select: {
            id: true,
            localPart: true,
            domain: true,
            assignedUserId: true,
          },
          orderBy: { localPart: 'asc' },
        }),
      ]);

    const limit = this.consoleMemberLimit(subscription);
    const used = await this.countSeatsUsed(access.app.id);

    const mailboxesByUser = new Map<
      string,
      { id: string; localPart: string; domain: string }[]
    >();
    for (const box of mailboxes) {
      if (!box.assignedUserId) continue;
      const list = mailboxesByUser.get(box.assignedUserId) ?? [];
      list.push({
        id: box.id,
        localPart: box.localPart,
        domain: box.domain,
      });
      mailboxesByUser.set(box.assignedUserId, list);
    }

    return {
      canManage: this.access.canManageTeam(access),
      isOwner: access.isOwner,
      consoleMembersIncluded: limit,
      consoleMembersUsed: used,
      owner: owner
        ? {
            id: owner.id,
            email: owner.email,
            name: owner.profile?.name || owner.profile?.username || null,
            avatar: owner.profile?.avatar || null,
            role: 'OWNER' as const,
            assignedMailboxes: mailboxesByUser.get(owner.id) ?? [],
          }
        : null,
      members: members.map((row) =>
        this.toMemberView(row, mailboxesByUser.get(row.userId) ?? []),
      ),
      emailInvites: emailInvites.map((row) => this.toEmailInviteView(row)),
      mailboxes: mailboxes.map((box) => ({
        id: box.id,
        localPart: box.localPart,
        domain: box.domain,
        assignedUserId: box.assignedUserId,
        address: `${box.localPart}@${box.domain}`,
      })),
      workspace: {
        appId: access.app.appId,
        name: access.app.name,
        primaryDomain: access.app.primaryDomain,
      },
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

    await this.expireStaleMemberInvites(access.app.id);

    const subscription = await this.prisma.mailSubscription.findUnique({
      where: { mailAppId: access.app.id },
    });
    const limit = this.consoleMemberLimit(subscription);
    await this.assertSeatAvailable(access.app.id, limit);

    const email = dto.email.trim().toLowerCase();
    const role = dto.role as MailAppMemberRole;
    const inviter = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: { select: { name: true, username: true } } },
    });
    const inviterName =
      inviter?.profile?.name ||
      inviter?.profile?.username ||
      inviter?.email ||
      'A teammate';

    const invitee = await this.prisma.user.findFirst({
      where: { email },
      include: { profile: { select: { name: true } } },
    });

    if (!invitee) {
      return this.inviteByEmailOnly({
        mailAppId: access.app.id,
        publicAppId: access.app.appId,
        workspaceName: access.app.name,
        email,
        role,
        invitedBy: userId,
        inviterName,
      });
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

    const expiresAt = this.inviteExpiryDate();
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
            expiresAt,
            lastResendAt: null,
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
            expiresAt,
          },
          include: memberInclude,
        });

    // Cancel any pending email-only invite for this address.
    await this.prisma.mailAppEmailInvite.updateMany({
      where: {
        mailAppId: access.app.id,
        email,
        status: InvitationStatus.PENDING,
      },
      data: { status: InvitationStatus.CANCELLED },
    });

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

    await this.sendExistingUserInviteEmail({
      to: invitee.email,
      inviterName,
      role,
      workspaceName: access.app.name,
    });

    return {
      kind: 'member' as const,
      member: this.toMemberView(member),
      needsSignup: false,
    };
  }

  private async inviteByEmailOnly(opts: {
    mailAppId: string;
    publicAppId: string;
    workspaceName: string;
    email: string;
    role: MailAppMemberRole;
    invitedBy: string;
    inviterName: string;
  }) {
    const expiresAt = this.inviteExpiryDate();
    const token = this.newInviteToken();
    const existing = await this.prisma.mailAppEmailInvite.findUnique({
      where: {
        mailAppId_email: { mailAppId: opts.mailAppId, email: opts.email },
      },
      include: {
        inviter: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, username: true } },
          },
        },
      },
    });

    if (existing?.status === InvitationStatus.PENDING) {
      throw new BadRequestException(
        'This email already has a pending invite for this workspace.',
      );
    }

    const row = existing
      ? await this.prisma.mailAppEmailInvite.update({
          where: { id: existing.id },
          data: {
            role: opts.role,
            status: InvitationStatus.PENDING,
            invitedBy: opts.invitedBy,
            invitedAt: new Date(),
            token,
            expiresAt,
            lastResendAt: null,
            acceptedAt: null,
          },
          include: {
            inviter: {
              select: {
                id: true,
                email: true,
                profile: { select: { name: true, username: true } },
              },
            },
          },
        })
      : await this.prisma.mailAppEmailInvite.create({
          data: {
            mailAppId: opts.mailAppId,
            email: opts.email,
            role: opts.role,
            status: InvitationStatus.PENDING,
            invitedBy: opts.invitedBy,
            token,
            expiresAt,
          },
          include: {
            inviter: {
              select: {
                id: true,
                email: true,
                profile: { select: { name: true, username: true } },
              },
            },
          },
        });

    await this.sendSignupInviteEmail({
      to: opts.email,
      inviterName: opts.inviterName,
      role: opts.role,
      workspaceName: opts.workspaceName,
      token: row.token,
    });

    return {
      kind: 'email_invite' as const,
      emailInvite: this.toEmailInviteView(row),
      needsSignup: true,
    };
  }

  async resend(
    userId: string,
    publicAppId: string,
    memberId: string,
  ) {
    const access = await this.access.requireAccess(userId, publicAppId);
    if (!this.access.canManageTeam(access)) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAIL_TEAM_MANAGE_REQUIRED',
        message: 'Only the owner or an admin can resend invites.',
      });
    }

    await this.expireStaleMemberInvites(access.app.id);

    const member = await this.prisma.mailAppMember.findFirst({
      where: { id: memberId, mailAppId: access.app.id },
      include: memberInclude,
    });

    if (member) {
      if (member.status !== InvitationStatus.PENDING) {
        throw new BadRequestException('Only pending invites can be resent.');
      }
      if (member.lastResendAt) {
        const elapsed = Date.now() - member.lastResendAt.getTime();
        if (elapsed < RESEND_COOLDOWN_MS) {
          throw new BadRequestException(
            'Please wait a minute before resending this invite.',
          );
        }
      }

      const inviterName =
        member.inviter.profile?.name ||
        member.inviter.profile?.username ||
        member.inviter.email ||
        'A teammate';

      const updated = await this.prisma.mailAppMember.update({
        where: { id: member.id },
        data: {
          expiresAt: this.inviteExpiryDate(),
          lastResendAt: new Date(),
          invitedAt: new Date(),
        },
        include: memberInclude,
      });

      await this.notifications.create({
        userId: member.userId,
        type: 'FORM_SHARED',
        title: 'Mail workspace invitation',
        message: `${inviterName} invited you to ${access.app.name} as ${ROLE_LABELS[member.role]}.`,
        data: {
          kind: 'mail_team_invite',
          memberId: member.id,
          appId: access.app.appId,
          workspaceName: access.app.name,
          role: member.role,
          inviterName,
        },
      });

      await this.sendExistingUserInviteEmail({
        to: member.user.email,
        inviterName,
        role: member.role,
        workspaceName: access.app.name,
      });

      return { kind: 'member' as const, member: this.toMemberView(updated) };
    }

    const emailInvite = await this.prisma.mailAppEmailInvite.findFirst({
      where: { id: memberId, mailAppId: access.app.id },
      include: {
        inviter: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, username: true } },
          },
        },
      },
    });
    if (!emailInvite) {
      throw new NotFoundException('Invite not found.');
    }
    if (emailInvite.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Only pending invites can be resent.');
    }
    if (emailInvite.lastResendAt) {
      const elapsed = Date.now() - emailInvite.lastResendAt.getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        throw new BadRequestException(
          'Please wait a minute before resending this invite.',
        );
      }
    }

    const token = this.newInviteToken();
    const updated = await this.prisma.mailAppEmailInvite.update({
      where: { id: emailInvite.id },
      data: {
        token,
        expiresAt: this.inviteExpiryDate(),
        lastResendAt: new Date(),
        invitedAt: new Date(),
      },
      include: {
        inviter: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, username: true } },
          },
        },
      },
    });

    const inviterName =
      updated.inviter.profile?.name ||
      updated.inviter.profile?.username ||
      updated.inviter.email ||
      'A teammate';

    await this.sendSignupInviteEmail({
      to: updated.email,
      inviterName,
      role: updated.role,
      workspaceName: access.app.name,
      token: updated.token,
    });

    return {
      kind: 'email_invite' as const,
      emailInvite: this.toEmailInviteView(updated),
    };
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
    if (member) {
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
          expiresAt: null,
        },
      });

      return { ok: true as const, kind: 'member' as const };
    }

    const emailInvite = await this.prisma.mailAppEmailInvite.findFirst({
      where: { id: memberId, mailAppId: access.app.id },
    });
    if (!emailInvite) {
      throw new NotFoundException('Team member not found.');
    }

    await this.prisma.mailAppEmailInvite.update({
      where: { id: emailInvite.id },
      data: { status: InvitationStatus.CANCELLED },
    });

    return { ok: true as const, kind: 'email_invite' as const };
  }

  async listMyInvitations(userId: string) {
    await this.expireStaleMemberInvites();

    const rows = await this.prisma.mailAppMember.findMany({
      where: {
        userId,
        status: InvitationStatus.PENDING,
        mailApp: { status: MailAppStatus.ACTIVE },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
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
    await this.expireStaleMemberInvites();

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
    if (member.expiresAt && member.expiresAt.getTime() < Date.now()) {
      await this.prisma.mailAppMember.update({
        where: { id: member.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('This invitation has expired.');
    }

    const slotIndex = await this.allocateMemberSlot(userId);
    const updated = await this.prisma.mailAppMember.update({
      where: { id: member.id },
      data: {
        status: InvitationStatus.ACCEPTED,
        acceptedAt: new Date(),
        slotIndex,
        expiresAt: null,
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

  async getEmailInvitePreview(token: string) {
    await this.expireStaleMemberInvites();
    const invite = await this.prisma.mailAppEmailInvite.findUnique({
      where: { token },
      include: {
        mailApp: {
          select: {
            appId: true,
            name: true,
            primaryDomain: true,
            status: true,
          },
        },
        inviter: {
          select: {
            email: true,
            profile: { select: { name: true, username: true } },
          },
        },
      },
    });
    if (!invite || invite.mailApp.status !== MailAppStatus.ACTIVE) {
      throw new NotFoundException('Invitation not found.');
    }
    if (
      invite.status !== InvitationStatus.PENDING ||
      invite.expiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('This invitation is no longer valid.');
    }

    return {
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt.toISOString(),
      workspace: {
        appId: invite.mailApp.appId,
        name: invite.mailApp.name,
        primaryDomain: invite.mailApp.primaryDomain,
      },
      inviter: {
        email: invite.inviter.email,
        name:
          invite.inviter.profile?.name ||
          invite.inviter.profile?.username ||
          null,
      },
    };
  }

  async claimEmailInvite(userId: string, token: string) {
    await this.expireStaleMemberInvites();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) throw new NotFoundException('User not found.');

    const invite = await this.prisma.mailAppEmailInvite.findUnique({
      where: { token },
      include: {
        mailApp: true,
      },
    });
    if (!invite || invite.mailApp.status !== MailAppStatus.ACTIVE) {
      throw new NotFoundException('Invitation not found.');
    }
    if (
      invite.status !== InvitationStatus.PENDING ||
      invite.expiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('This invitation is no longer valid.');
    }
    if (user.email.trim().toLowerCase() !== invite.email.trim().toLowerCase()) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAIL_INVITE_EMAIL_MISMATCH',
        message: `Sign in with ${invite.email} to accept this invite.`,
      });
    }
    if (user.id === invite.mailApp.userId) {
      throw new BadRequestException('You already own this workspace.');
    }

    const subscription = await this.prisma.mailSubscription.findUnique({
      where: { mailAppId: invite.mailAppId },
    });
    const limit = this.consoleMemberLimit(subscription);

    const existing = await this.prisma.mailAppMember.findUnique({
      where: {
        mailAppId_userId: {
          mailAppId: invite.mailAppId,
          userId: user.id,
        },
      },
    });
    if (existing?.status === InvitationStatus.ACCEPTED) {
      await this.prisma.mailAppEmailInvite.update({
        where: { id: invite.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });
      return {
        workspace: {
          appId: invite.mailApp.appId,
          name: invite.mailApp.name,
          slotIndex: existing.slotIndex ?? invite.mailApp.slotIndex,
        },
      };
    }

    // Claiming converts an email seat into a member seat — net zero if invite still pending.
    if (!existing || existing.status !== InvitationStatus.PENDING) {
      const usedWithoutThisInvite = (await this.countSeatsUsed(invite.mailAppId)) - 1;
      if (usedWithoutThisInvite >= limit) {
        throw new ForbiddenException({
          statusCode: 403,
          code: 'MAIL_TEAM_LIMIT',
          message: `This plan allows ${limit} console members. Ask the owner to free a seat.`,
        });
      }
    }

    const slotIndex = await this.allocateMemberSlot(user.id);

    const member = await this.prisma.$transaction(async (tx) => {
      const saved = existing
        ? await tx.mailAppMember.update({
            where: { id: existing.id },
            data: {
              role: invite.role,
              status: InvitationStatus.ACCEPTED,
              invitedBy: invite.invitedBy,
              invitedAt: invite.invitedAt,
              acceptedAt: new Date(),
              slotIndex,
              expiresAt: null,
            },
            include: memberInclude,
          })
        : await tx.mailAppMember.create({
            data: {
              mailAppId: invite.mailAppId,
              userId: user.id,
              role: invite.role,
              status: InvitationStatus.ACCEPTED,
              invitedBy: invite.invitedBy,
              invitedAt: invite.invitedAt,
              acceptedAt: new Date(),
              slotIndex,
            },
            include: memberInclude,
          });

      await tx.mailAppEmailInvite.update({
        where: { id: invite.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      return saved;
    });

    return {
      member: this.toMemberView(member),
      workspace: {
        appId: invite.mailApp.appId,
        name: invite.mailApp.name,
        slotIndex,
      },
    };
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

  async transferOwnership(
    userId: string,
    publicAppId: string,
    dto: TransferMailAppOwnershipDto,
  ) {
    const access = await this.access.requireOwner(userId, publicAppId);
    const member = await this.prisma.mailAppMember.findFirst({
      where: {
        id: dto.memberId,
        mailAppId: access.app.id,
        status: InvitationStatus.ACCEPTED,
      },
      include: memberInclude,
    });
    if (!member) {
      throw new NotFoundException('Accepted team member not found.');
    }
    if (member.userId === access.app.userId) {
      throw new BadRequestException('That user already owns this workspace.');
    }

    const previousOwner = await this.prisma.user.findUnique({
      where: { id: access.app.userId },
      include: { profile: { select: { name: true, username: true } } },
    });
    if (!previousOwner) {
      throw new NotFoundException('Current owner not found.');
    }

    const previousOwnerSlot = await this.allocateMemberSlot(previousOwner.id);
    // New owner needs a free per-user slot on MailApp (unique [userId, slotIndex]).
    const newOwnerAppSlot = await this.allocateMemberSlot(member.userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.mailApp.update({
        where: { id: access.app.id },
        data: { userId: member.userId, slotIndex: newOwnerAppSlot },
      });

      await tx.mailAppMember.update({
        where: { id: member.id },
        data: {
          status: InvitationStatus.CANCELLED,
          slotIndex: null,
        },
      });

      const previousMembership = await tx.mailAppMember.findUnique({
        where: {
          mailAppId_userId: {
            mailAppId: access.app.id,
            userId: previousOwner.id,
          },
        },
      });

      if (previousMembership) {
        await tx.mailAppMember.update({
          where: { id: previousMembership.id },
          data: {
            role: MailAppMemberRole.ADMIN,
            status: InvitationStatus.ACCEPTED,
            invitedBy: member.userId,
            acceptedAt: new Date(),
            slotIndex: previousOwnerSlot,
            expiresAt: null,
          },
        });
      } else {
        await tx.mailAppMember.create({
          data: {
            mailAppId: access.app.id,
            userId: previousOwner.id,
            role: MailAppMemberRole.ADMIN,
            status: InvitationStatus.ACCEPTED,
            invitedBy: member.userId,
            acceptedAt: new Date(),
            slotIndex: previousOwnerSlot,
          },
        });
      }
    });

    const previousOwnerName =
      previousOwner.profile?.name ||
      previousOwner.profile?.username ||
      previousOwner.email;
    const newOwnerName =
      member.user.profile?.name ||
      member.user.profile?.username ||
      member.user.email;

    await Promise.all([
      this.notifications.create({
        userId: member.userId,
        type: 'FORM_SHARED',
        title: 'You are now the workspace owner',
        message: `${previousOwnerName} transferred ownership of ${access.app.name} to you.`,
        data: {
          kind: 'mail_ownership_transferred',
          appId: access.app.appId,
          workspaceName: access.app.name,
        },
      }),
      this.email.sendMailOwnershipTransferred(member.user.email, {
        workspaceName: access.app.name,
        previousOwnerName,
        newOwnerName,
        appsUrl: this.mailAppUrl('/apps'),
        isNewOwner: true,
      }),
      this.email.sendMailOwnershipTransferred(previousOwner.email, {
        workspaceName: access.app.name,
        previousOwnerName,
        newOwnerName,
        appsUrl: this.mailAppUrl('/apps'),
        isNewOwner: false,
      }),
    ]);

    return {
      ok: true as const,
      workspace: {
        appId: access.app.appId,
        name: access.app.name,
        ownerUserId: member.userId,
      },
    };
  }
}
