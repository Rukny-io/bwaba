import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { MailAppAccessService } from './mail-app-access.service';

export type MailSecurityAuditInput = {
  mailAppId: string;
  actorUserId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
};

/** Best-effort audit writer. Audit failures must never break mailbox access. */
@Injectable()
export class MailSecurityAuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: MailAppAccessService,
  ) {}

  async record(input: MailSecurityAuditInput): Promise<void> {
    try {
      await this.prisma.mailSecurityAuditLog.create({
        data: {
          mailAppId: input.mailAppId,
          actorUserId: input.actorUserId ?? null,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId,
          metadata: input.metadata,
        },
      });
    } catch {
      // Access and authentication must remain available if the audit store is
      // temporarily unavailable; operational monitoring should alert on this.
    }
  }

  async list(userId: string, publicAppId: string, take = 50) {
    const access = await this.access.requireAccess(userId, publicAppId);
    if (!this.access.canManageTeam(access)) {
      throw new ForbiddenException(
        'Only workspace managers can view security audit logs.',
      );
    }
    const rows = await this.prisma.mailSecurityAuditLog.findMany({
      where: { mailAppId: access.app.id },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(Math.floor(take) || 50, 1), 200),
      include: { actor: { select: { id: true, email: true } } },
    });
    return {
      events: rows.map((row) => ({
        id: row.id,
        action: row.action,
        targetType: row.targetType,
        targetId: row.targetId,
        metadata: row.metadata,
        createdAt: row.createdAt.toISOString(),
        actor: row.actor,
      })),
    };
  }
}
