import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MailAppStatus,
  MailMailboxStatus,
  MailMessageDirection,
  MailMessageFolder,
  MailMessageStatus,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { SendMailMessageDto } from './dto/mail-message.dto';
import { MailRealtimeService } from './mail-realtime.service';
import { MailSesService } from './mail-ses.service';

@Injectable()
export class MailMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ses: MailSesService,
    private readonly realtime: MailRealtimeService,
  ) {}

  private snippetFrom(text: string | undefined, html: string | undefined) {
    const raw = (text || html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return raw.slice(0, 200) || null;
  }

  private normalizeEmails(list: string[] | undefined) {
    if (!list?.length) return [] as string[];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of list) {
      const email = raw.trim().toLowerCase();
      if (!email || seen.has(email)) continue;
      seen.add(email);
      out.push(email);
    }
    return out;
  }

  private rfcMessageId(domain: string) {
    return `<${randomUUID()}@${domain}>`;
  }

  private mediaPath(key: string | null | undefined) {
    if (!key) return null;
    const cleaned = key.replace(/^\/+/, '');
    if (!cleaned || cleaned.includes('..')) return null;
    return `/api/media/${cleaned}`;
  }

  /** Absolute URL for images embedded in outbound HTML (Gmail must fetch it). */
  private mediaPublicUrl(key: string | null | undefined) {
    const path = this.mediaPath(key);
    if (!path) return null;
    const base = (
      process.env.API_PUBLIC_URL ||
      process.env.API_URL ||
      process.env.AUTH_BASE_URL ||
      ''
    ).replace(/\/$/, '');
    return base ? `${base}${path}` : path;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private textToHtml(text: string) {
    return this.escapeHtml(text).replace(/\r\n|\r|\n/g, '<br/>');
  }

  /** Sender card + body so recipients (Gmail etc.) see the mailbox photo. */
  private wrapOutboundHtml(input: {
    fromName: string | null;
    fromAddress: string;
    avatarUrl: string | null;
    bodyHtml: string;
  }) {
    const name = this.escapeHtml(
      input.fromName?.trim() || input.fromAddress,
    );
    const email = this.escapeHtml(input.fromAddress);
    const initial = this.escapeHtml(
      (input.fromName?.trim() || input.fromAddress).charAt(0).toUpperCase() ||
        '?',
    );
    const avatar = input.avatarUrl
      ? `<img src="${this.escapeHtml(input.avatarUrl)}" width="48" height="48" alt="" style="border-radius:9999px;display:block;width:48px;height:48px;object-fit:cover;" />`
      : `<div style="width:48px;height:48px;border-radius:9999px;background:#dbeafe;color:#1e40af;font-weight:700;font-size:18px;line-height:48px;text-align:center;">${initial}</div>`;

    return `<!DOCTYPE html><html><body style="margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;background:#ffffff;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;border-collapse:collapse;">
  <tr>
    <td style="padding-right:12px;vertical-align:middle;">${avatar}</td>
    <td style="vertical-align:middle;">
      <div style="font-weight:600;font-size:15px;line-height:1.35;color:#0f172a;">${name}</div>
      <div style="font-size:12px;line-height:1.4;color:#64748b;">${email}</div>
    </td>
  </tr>
</table>
<div style="font-size:15px;line-height:1.65;color:#0f172a;">${input.bodyHtml}</div>
</body></html>`;
  }

  private toView(
    row: {
      id: string;
      mailboxId: string;
      threadId: string;
      messageId: string | null;
      inReplyTo: string | null;
      direction: MailMessageDirection;
      folder: MailMessageFolder;
      status: MailMessageStatus;
      fromAddress: string;
      fromName: string | null;
      toAddresses: string[];
      ccAddresses: string[];
      bccAddresses: string[];
      subject: string;
      bodyText: string | null;
      bodyHtml: string | null;
      snippet: string | null;
      isRead: boolean;
      isStarred: boolean;
      sesMessageId: string | null;
      errorMessage: string | null;
      sentAt: Date | null;
      receivedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      mailbox?: { avatarKey: string | null } | null;
    },
  ) {
    const fromAvatarUrl =
      row.direction === MailMessageDirection.OUTBOUND
        ? this.mediaPath(row.mailbox?.avatarKey)
        : null;

    return {
      id: row.id,
      mailboxId: row.mailboxId,
      threadId: row.threadId,
      messageId: row.messageId,
      inReplyTo: row.inReplyTo,
      direction: row.direction,
      folder: row.folder,
      status: row.status,
      from: row.fromName
        ? { name: row.fromName, email: row.fromAddress }
        : { email: row.fromAddress },
      fromAddress: row.fromAddress,
      fromName: row.fromName,
      fromAvatarUrl,
      to: row.toAddresses,
      cc: row.ccAddresses,
      bcc: row.bccAddresses,
      subject: row.subject,
      bodyText: row.bodyText,
      bodyHtml: row.bodyHtml,
      preview: row.snippet,
      unread: !row.isRead,
      starred: row.isStarred,
      sesMessageId: row.sesMessageId,
      errorMessage: row.errorMessage,
      sentAt: row.sentAt,
      receivedAt: row.receivedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private async requireOwnedMailbox(userId: string, appId: string, mailboxId: string) {
    const app = await this.prisma.mailApp.findFirst({
      where: { appId, userId, status: MailAppStatus.ACTIVE },
    });
    if (!app) throw new NotFoundException('Mail app not found.');

    const mailbox = await this.prisma.mailMailbox.findFirst({
      where: {
        id: mailboxId,
        mailAppId: app.id,
        status: MailMailboxStatus.ACTIVE,
      },
    });
    if (!mailbox) {
      throw new NotFoundException('Mailbox not found or inactive.');
    }
    return { app, mailbox };
  }

  async assertOwnedApp(userId: string, appId: string) {
    const app = await this.prisma.mailApp.findFirst({
      where: { appId, userId, status: MailAppStatus.ACTIVE },
    });
    if (!app) throw new NotFoundException('Mail app not found.');
    return app;
  }

  async list(
    userId: string,
    appId: string,
    opts: {
      mailboxId?: string;
      folder?: MailMessageFolder;
      starred?: boolean;
      take?: number;
      cursor?: string;
    } = {},
  ) {
    const app = await this.prisma.mailApp.findFirst({
      where: { appId, userId, status: MailAppStatus.ACTIVE },
    });
    if (!app) throw new NotFoundException('Mail app not found.');

    const take = Math.min(Math.max(opts.take ?? 50, 1), 100);

    const where: Prisma.MailMessageWhereInput = {
      userId,
      mailbox: {
        mailAppId: app.id,
        status: { not: MailMailboxStatus.DELETED },
        ...(opts.mailboxId ? { id: opts.mailboxId } : {}),
      },
      ...(opts.starred
        ? { isStarred: true }
        : { folder: opts.folder ?? MailMessageFolder.INBOX }),
    };

    const rows = await this.prisma.mailMessage.findMany({
      where,
      include: { mailbox: { select: { avatarKey: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: take + 1,
      ...(opts.cursor
        ? { cursor: { id: opts.cursor }, skip: 1 }
        : {}),
    });

    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;

    return {
      messages: page.map((row) => this.toView(row)),
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    };
  }

  async getOne(userId: string, appId: string, messageId: string) {
    const app = await this.prisma.mailApp.findFirst({
      where: { appId, userId, status: MailAppStatus.ACTIVE },
    });
    if (!app) throw new NotFoundException('Mail app not found.');

    const row = await this.prisma.mailMessage.findFirst({
      where: {
        id: messageId,
        userId,
        mailbox: { mailAppId: app.id },
      },
      include: { mailbox: { select: { avatarKey: true } } },
    });
    if (!row) throw new NotFoundException('Message not found.');

    if (!row.isRead) {
      await this.prisma.mailMessage.update({
        where: { id: row.id },
        data: { isRead: true },
      });
      row.isRead = true;
    }

    return this.toView(row);
  }

  async counts(userId: string, appId: string, mailboxId?: string) {
    const app = await this.prisma.mailApp.findFirst({
      where: { appId, userId, status: MailAppStatus.ACTIVE },
    });
    if (!app) throw new NotFoundException('Mail app not found.');

    const mailboxFilter = {
      mailAppId: app.id,
      status: { not: MailMailboxStatus.DELETED },
      ...(mailboxId ? { id: mailboxId } : {}),
    };

    const [byFolder, starred] = await Promise.all([
      this.prisma.mailMessage.groupBy({
        by: ['folder'],
        where: { userId, mailbox: mailboxFilter },
        _count: { _all: true },
      }),
      this.prisma.mailMessage.count({
        where: { userId, isStarred: true, mailbox: mailboxFilter },
      }),
    ]);

    const folderCounts: Record<MailMessageFolder, number> = {
      INBOX: 0,
      SENT: 0,
      DRAFTS: 0,
      TRASH: 0,
      SPAM: 0,
      ARCHIVE: 0,
    };
    for (const row of byFolder) {
      folderCounts[row.folder] = row._count._all;
    }

    return {
      inbox: folderCounts.INBOX,
      sent: folderCounts.SENT,
      drafts: folderCounts.DRAFTS,
      trash: folderCounts.TRASH,
      spam: folderCounts.SPAM,
      archive: folderCounts.ARCHIVE,
      starred,
    };
  }

  async update(
    userId: string,
    appId: string,
    messageId: string,
    dto: {
      isStarred?: boolean;
      isRead?: boolean;
      folder?: MailMessageFolder;
    },
  ) {
    const app = await this.prisma.mailApp.findFirst({
      where: { appId, userId, status: MailAppStatus.ACTIVE },
    });
    if (!app) throw new NotFoundException('Mail app not found.');

    const row = await this.prisma.mailMessage.findFirst({
      where: {
        id: messageId,
        userId,
        mailbox: { mailAppId: app.id },
      },
    });
    if (!row) throw new NotFoundException('Message not found.');

    if (
      dto.isStarred === undefined &&
      dto.isRead === undefined &&
      dto.folder === undefined
    ) {
      throw new BadRequestException('No updates provided.');
    }

    const updated = await this.prisma.mailMessage.update({
      where: { id: row.id },
      data: {
        ...(dto.isStarred !== undefined ? { isStarred: dto.isStarred } : {}),
        ...(dto.isRead !== undefined ? { isRead: dto.isRead } : {}),
        ...(dto.folder !== undefined ? { folder: dto.folder } : {}),
      },
    });

    return this.toView(updated);
  }

  async send(userId: string, appId: string, dto: SendMailMessageDto) {
    const to = this.normalizeEmails(dto.to);
    const cc = this.normalizeEmails(dto.cc);
    const bcc = this.normalizeEmails(dto.bcc);
    if (to.length === 0) {
      throw new BadRequestException('At least one To recipient is required.');
    }

    const bodyText = dto.bodyText?.trim() || undefined;
    const bodyHtml = dto.bodyHtml?.trim() || undefined;
    if (!bodyText && !bodyHtml) {
      throw new BadRequestException('Message body is required.');
    }

    const { mailbox } = await this.requireOwnedMailbox(
      userId,
      appId,
      dto.mailboxId,
    );

    const fromAddress = `${mailbox.localPart}@${mailbox.domain}`;
    let threadId: string = randomUUID();
    let inReplyTo: string | null = null;

    if (dto.replyToMessageId) {
      const parent = await this.prisma.mailMessage.findFirst({
        where: {
          id: dto.replyToMessageId,
          userId,
          mailboxId: mailbox.id,
        },
      });
      if (!parent) {
        throw new BadRequestException('Reply target message not found.');
      }
      threadId = parent.threadId;
      inReplyTo = parent.messageId;
    }

    const messageIdHeader = this.rfcMessageId(mailbox.domain);
    const plainText =
      bodyText ||
      (bodyHtml
        ? bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        : '');
    const innerHtml = bodyHtml?.trim()
      ? bodyHtml.trim()
      : this.textToHtml(plainText);
    const avatarUrl = this.mediaPublicUrl(mailbox.avatarKey);
    const outboundHtml = this.wrapOutboundHtml({
      fromName: mailbox.displayName,
      fromAddress,
      avatarUrl,
      bodyHtml: innerHtml,
    });
    const snippet = this.snippetFrom(plainText || undefined, outboundHtml);

    const queued = await this.prisma.mailMessage.create({
      data: {
        mailboxId: mailbox.id,
        userId,
        threadId,
        messageId: messageIdHeader,
        inReplyTo,
        direction: MailMessageDirection.OUTBOUND,
        folder: MailMessageFolder.SENT,
        status: MailMessageStatus.QUEUED,
        fromAddress,
        fromName: mailbox.displayName,
        toAddresses: to,
        ccAddresses: cc,
        bccAddresses: bcc,
        replyTo: fromAddress,
        subject: dto.subject.trim(),
        bodyText: plainText || null,
        bodyHtml: outboundHtml,
        snippet,
        isRead: true,
      },
    });

    try {
      const { sesMessageId } = await this.ses.sendEmail({
        from: fromAddress,
        fromName: mailbox.displayName,
        to,
        cc,
        bcc,
        subject: dto.subject.trim(),
        bodyText: plainText || undefined,
        bodyHtml: outboundHtml,
        replyTo: [fromAddress],
        messageIdHeader,
        inReplyTo,
      });

      const sent = await this.prisma.mailMessage.update({
        where: { id: queued.id },
        data: {
          status: MailMessageStatus.SENT,
          sesMessageId,
          sentAt: new Date(),
          errorMessage: null,
        },
      });

      this.realtime.publish({
        type: 'mail.changed',
        appId,
        mailboxId: mailbox.id,
        folder: MailMessageFolder.SENT,
        messageId: sent.id,
        direction: 'OUTBOUND',
      });

      return this.toView({
        ...sent,
        mailbox: { avatarKey: mailbox.avatarKey },
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Send failed.';
      await this.prisma.mailMessage.update({
        where: { id: queued.id },
        data: {
          status: MailMessageStatus.FAILED,
          errorMessage: errorMessage.slice(0, 500),
        },
      });
      throw error;
    }
  }
}
