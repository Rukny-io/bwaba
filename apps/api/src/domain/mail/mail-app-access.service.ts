import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvitationStatus,
  MailAppMemberRole,
  MailAppStatus,
  type MailApp,
  type MailAppMember,
} from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';

export type MailAppAccess = {
  app: MailApp;
  isOwner: boolean;
  role: MailAppMemberRole | 'OWNER';
  member: MailAppMember | null;
};

@Injectable()
export class MailAppAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveAccess(
    userId: string,
    publicAppId: string,
  ): Promise<MailAppAccess | null> {
    const app = await this.prisma.mailApp.findFirst({
      where: { appId: publicAppId, status: MailAppStatus.ACTIVE },
    });
    if (!app) return null;

    if (app.userId === userId) {
      return { app, isOwner: true, role: 'OWNER', member: null };
    }

    const member = await this.prisma.mailAppMember.findUnique({
      where: {
        mailAppId_userId: { mailAppId: app.id, userId },
      },
    });

    if (member?.status === InvitationStatus.ACCEPTED) {
      return { app, isOwner: false, role: member.role, member };
    }

    // Assigned mailbox holders can open webmail before/without console roles.
    const assigned = await this.prisma.mailMailbox.findFirst({
      where: { mailAppId: app.id, assignedUserId: userId },
      select: { id: true },
    });
    if (assigned) {
      return {
        app,
        isOwner: false,
        role: MailAppMemberRole.MEMBER,
        member: member ?? null,
      };
    }

    return null;
  }

  async requireAccess(
    userId: string,
    publicAppId: string,
    message = 'Mail app not found.',
  ): Promise<MailAppAccess> {
    const access = await this.resolveAccess(userId, publicAppId);
    if (!access) {
      throw new NotFoundException(message);
    }
    return access;
  }

  async requireOwner(
    userId: string,
    publicAppId: string,
  ): Promise<MailAppAccess> {
    const access = await this.requireAccess(userId, publicAppId);
    if (!access.isOwner) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MAIL_OWNER_REQUIRED',
        message: 'Only the workspace owner can do this.',
      });
    }
    return access;
  }

  canManageTeam(access: MailAppAccess): boolean {
    return (
      access.isOwner ||
      access.role === MailAppMemberRole.ADMIN
    );
  }

  canManageMailboxes(access: MailAppAccess): boolean {
    return (
      access.isOwner ||
      access.role === MailAppMemberRole.ADMIN ||
      access.role === MailAppMemberRole.MEMBER
    );
  }

  /** Owner / admin: any mailbox. Others: only mailboxes assigned to them. */
  canSsoSelectForUser(
    userId: string,
    access: MailAppAccess,
    mailbox: { assignedUserId: string | null },
  ): boolean {
    if (access.isOwner || access.role === MailAppMemberRole.ADMIN) {
      return true;
    }
    return mailbox.assignedUserId === userId;
  }
}
