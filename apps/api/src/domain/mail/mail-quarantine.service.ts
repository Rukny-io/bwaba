import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MailAppStatus,
  MailMailboxStatus,
  MailMessageFolder,
  MailQuarantineAction,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { BulkQuarantineActionDto } from './dto/mail-filter-rule.dto';
import { MailRealtimeService } from './mail-realtime.service';

@Injectable()
export class MailQuarantineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: MailRealtimeService,
  ) {}

  private async requireOwnedApp(userId: string, appId: string) {
    const app = await this.prisma.mailApp.findFirst({
      where: { appId, userId, status: MailAppStatus.ACTIVE },
    });
    if (!app) throw new NotFoundException('Mail app not found.');
    return app;
  }

  private toView(row: {
    id: string;
    mailboxId: string;
    fromAddress: string;
    fromName: string | null;
    subject: string;
    snippet: string | null;
    quarantineReason: string | null;
    quarantineExpiresAt: Date | null;
    receivedAt: Date | null;
    createdAt: Date;
    mailbox: { localPart: string; domain: string };
  }) {
    return {
      id: row.id,
      mailboxId: row.mailboxId,
      mailboxAddress: `${row.mailbox.localPart}@${row.mailbox.domain}`,
      fromAddress: row.fromAddress,
      fromName: row.fromName,
      subject: row.subject,
      snippet: row.snippet,
      quarantineReason: row.quarantineReason,
      quarantineExpiresAt: row.quarantineExpiresAt?.toISOString() ?? null,
      receivedAt: (row.receivedAt ?? row.createdAt).toISOString(),
    };
  }

  private async auditAction(
    mailAppUuid: string,
    actorUserId: string,
    action: MailQuarantineAction,
    row: {
      id: string;
      fromAddress: string;
      subject: string;
      mailbox: { localPart: string; domain: string };
    },
  ) {
    await this.prisma.mailQuarantineActionLog.create({
      data: {
        mailAppId: mailAppUuid,
        messageId: row.id,
        actorUserId,
        action,
        fromAddress: row.fromAddress,
        subject: row.subject,
        mailboxAddress: `${row.mailbox.localPart}@${row.mailbox.domain}`,
      },
    });
  }

  async list(
    userId: string,
    appId: string,
    opts: { take?: number; cursor?: string; mailboxId?: string } = {},
  ) {
    const app = await this.requireOwnedApp(userId, appId);
    const take = Math.min(Math.max(opts.take ?? 50, 1), 100);

    const where: Prisma.MailMessageWhereInput = {
      userId: app.userId,
      folder: MailMessageFolder.QUARANTINE,
      mailbox: {
        mailAppId: app.id,
        status: { not: MailMailboxStatus.DELETED },
        ...(opts.mailboxId ? { id: opts.mailboxId } : {}),
      },
    };

    const rows = await this.prisma.mailMessage.findMany({
      where,
      include: {
        mailbox: { select: { localPart: true, domain: true } },
      },
      orderBy: [{ receivedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;

    const total = await this.prisma.mailMessage.count({ where });

    return {
      total,
      messages: page.map((row) => this.toView(row)),
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    };
  }

  async listAuditLogs(
    userId: string,
    appId: string,
    opts: { take?: number; cursor?: string } = {},
  ) {
    const app = await this.requireOwnedApp(userId, appId);
    const take = Math.min(Math.max(opts.take ?? 50, 1), 100);

    const rows = await this.prisma.mailQuarantineActionLog.findMany({
      where: { mailAppId: app.id },
      include: {
        actor: { select: { id: true, email: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;

    return {
      logs: page.map((row) => ({
        id: row.id,
        messageId: row.messageId,
        action: row.action,
        fromAddress: row.fromAddress,
        subject: row.subject,
        mailboxAddress: row.mailboxAddress,
        actor: {
          id: row.actor.id,
          email: row.actor.email,
          name: null,
        },
        createdAt: row.createdAt.toISOString(),
      })),
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    };
  }

  private async requireQuarantinedMessage(
    appId: string,
    userId: string,
    messageId: string,
  ) {
    const app = await this.prisma.mailApp.findFirst({
      where: { appId, userId, status: MailAppStatus.ACTIVE },
    });
    if (!app) throw new NotFoundException('Mail app not found.');

    const row = await this.prisma.mailMessage.findFirst({
      where: {
        id: messageId,
        userId: app.userId,
        folder: MailMessageFolder.QUARANTINE,
        mailbox: { mailAppId: app.id },
      },
      include: {
        mailbox: { select: { localPart: true, domain: true } },
      },
    });
    if (!row) throw new NotFoundException('Quarantined message not found.');
    return { app, row };
  }

  async release(userId: string, appId: string, messageId: string) {
    const { app, row } = await this.requireQuarantinedMessage(
      appId,
      userId,
      messageId,
    );

    const updated = await this.prisma.mailMessage.update({
      where: { id: row.id },
      data: {
        folder: MailMessageFolder.INBOX,
        quarantineReason: null,
        quarantineExpiresAt: null,
      },
      include: {
        mailbox: { select: { localPart: true, domain: true } },
      },
    });

    await this.auditAction(app.id, userId, MailQuarantineAction.RELEASE, row);

    this.realtime.publish({
      type: 'mail.changed',
      appId: app.appId,
      mailboxId: updated.mailboxId,
      folder: MailMessageFolder.INBOX,
      messageId: updated.id,
      direction: 'INBOUND',
    });

    return { message: this.toView(updated) };
  }

  async markSpam(userId: string, appId: string, messageId: string) {
    const { app, row } = await this.requireQuarantinedMessage(
      appId,
      userId,
      messageId,
    );

    const updated = await this.prisma.mailMessage.update({
      where: { id: row.id },
      data: {
        folder: MailMessageFolder.SPAM,
        quarantineReason: null,
        quarantineExpiresAt: null,
      },
      include: {
        mailbox: { select: { localPart: true, domain: true } },
      },
    });

    await this.auditAction(app.id, userId, MailQuarantineAction.SPAM, row);

    this.realtime.publish({
      type: 'mail.changed',
      appId: app.appId,
      mailboxId: updated.mailboxId,
      folder: MailMessageFolder.SPAM,
      messageId: updated.id,
      direction: 'INBOUND',
    });

    return { message: this.toView(updated) };
  }

  async deleteMessage(userId: string, appId: string, messageId: string) {
    const { app, row } = await this.requireQuarantinedMessage(
      appId,
      userId,
      messageId,
    );

    await this.auditAction(app.id, userId, MailQuarantineAction.DELETE, row);
    await this.prisma.mailMessage.delete({ where: { id: row.id } });

    this.realtime.publish({
      type: 'mail.changed',
      appId: app.appId,
      mailboxId: row.mailboxId,
      folder: MailMessageFolder.TRASH,
      messageId: row.id,
      direction: 'INBOUND',
    });

    return { ok: true };
  }

  async bulkAction(
    userId: string,
    appId: string,
    dto: BulkQuarantineActionDto,
  ) {
    if (!dto.messageIds.length) {
      throw new BadRequestException('Select at least one message.');
    }

    const results = [];
    for (const messageId of dto.messageIds) {
      try {
        if (dto.action === 'release') {
          results.push(await this.release(userId, appId, messageId));
        } else if (dto.action === 'spam') {
          results.push(await this.markSpam(userId, appId, messageId));
        } else {
          results.push(await this.deleteMessage(userId, appId, messageId));
        }
      } catch {
        // Continue processing remaining messages.
      }
    }

    return {
      ok: true,
      processed: results.length,
      requested: dto.messageIds.length,
    };
  }

  async count(userId: string, appId: string) {
    const app = await this.requireOwnedApp(userId, appId);
    const total = await this.prisma.mailMessage.count({
      where: {
        userId: app.userId,
        folder: MailMessageFolder.QUARANTINE,
        mailbox: {
          mailAppId: app.id,
          status: { not: MailMailboxStatus.DELETED },
        },
      },
    });
    return { total };
  }
}
