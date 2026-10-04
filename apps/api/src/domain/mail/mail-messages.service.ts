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
  MailAuthenticationVerdict,
  MailBrandCertificateType,
  MailDomainTrustStatus,
  MailSenderBrandStatus,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import {
  SaveMailDraftDto,
  SendMailMessageDto,
} from './dto/mail-message.dto';
import { sanitizeMailHtml } from './mail-html-sanitize.util';
import { MailAttachmentsService } from './mail-attachments.service';
import { MailAppAccessService } from './mail-app-access.service';
import { MailMailboxSessionService } from './mail-mailbox-session.service';
import { MailRealtimeService } from './mail-realtime.service';
import { MailSesService } from './mail-ses.service';
import { MailSubscriptionsService } from './mail-subscriptions.service';
import { MailOutboundUsageService } from './mail-outbound-usage.service';
import {
  decrementMailboxStorage,
  incrementMailboxStorage,
  utf8StorageBytes,
} from './mail-storage.util';
import { MailFeatureFlags } from './mail-feature-flags';
import { MailBodyCryptoService } from './crypto/mail-body-crypto.service';
import { MailBodyEncryptionPolicy } from './crypto/mail-body-encryption.policy';
import {
  toBuffer,
  toPrismaBytes,
  type MailMessageBodyRow,
} from './crypto/mail-body-crypto.types';

type SenderIdentity = {
  domain: string;
  logoS3Key: string | null;
  brandStatus: MailSenderBrandStatus | null;
  certificateType: MailBrandCertificateType | null;
  certificateValidTo: Date | null;
  ruknyVerified: boolean;
};

@Injectable()
export class MailMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ses: MailSesService,
    private readonly realtime: MailRealtimeService,
    private readonly subscriptions: MailSubscriptionsService,
    private readonly outboundUsage: MailOutboundUsageService,
    private readonly mailboxSessions: MailMailboxSessionService,
    private readonly flags: MailFeatureFlags,
    private readonly access: MailAppAccessService,
    private readonly bodyCrypto: MailBodyCryptoService,
    private readonly bodyEncryption: MailBodyEncryptionPolicy,
    private readonly attachments: MailAttachmentsService,
  ) {}

  private asBodyRow(row: {
    id: string;
    mailboxId: string;
    messageId: string | null;
    bodyText: string | null;
    bodyHtml: string | null;
    bodyCryptoStatus: MailMessageBodyRow['bodyCryptoStatus'];
    bodyCryptoVersion: number | null;
    bodyKmsKeyId: string | null;
    bodyEncryptedDek: Uint8Array | Buffer | null;
    bodyTextCiphertext: Uint8Array | Buffer | null;
    bodyHtmlCiphertext: Uint8Array | Buffer | null;
  }): MailMessageBodyRow {
    return {
      id: row.id,
      mailboxId: row.mailboxId,
      messageId: row.messageId,
      bodyText: row.bodyText,
      bodyHtml: row.bodyHtml,
      bodyCryptoStatus: row.bodyCryptoStatus,
      bodyCryptoVersion: row.bodyCryptoVersion,
      bodyKmsKeyId: row.bodyKmsKeyId,
      bodyEncryptedDek: toBuffer(row.bodyEncryptedDek),
      bodyTextCiphertext: toBuffer(row.bodyTextCiphertext),
      bodyHtmlCiphertext: toBuffer(row.bodyHtmlCiphertext),
    };
  }

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
      senderDomain: string | null;
      spfVerdict: MailAuthenticationVerdict | null;
      dkimVerdict: MailAuthenticationVerdict | null;
      dmarcVerdict: MailAuthenticationVerdict | null;
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
      scheduledAt?: Date | null;
      createdAt: Date;
      updatedAt: Date;
      mailbox?: { avatarKey: string | null } | null;
    },
    senderIdentity?: SenderIdentity,
    options?: {
      bodyText?: string | null;
      bodyHtml?: string | null;
      omitBodies?: boolean;
      attachments?: Array<{
        id: string;
        filename: string;
        contentType: string;
        sizeBytes: number;
        contentId: string | null;
        createdAt: string;
      }>;
    },
  ) {
    const authenticationPassed =
      row.dmarcVerdict === MailAuthenticationVerdict.PASS;
    const usableBrand =
      row.direction === MailMessageDirection.INBOUND &&
      authenticationPassed &&
      this.flags.resolveBimi() &&
      senderIdentity?.brandStatus === MailSenderBrandStatus.READY
        ? senderIdentity
        : null;
    const fromAvatarUrl =
      row.direction === MailMessageDirection.OUTBOUND
        ? this.mediaPath(row.mailbox?.avatarKey)
        : this.flags.showBimiLogos()
          ? this.mediaPath(usableBrand?.logoS3Key)
          : null;
    const hasCurrentVmc =
      this.flags.showBimiLogos() &&
      usableBrand?.certificateType === MailBrandCertificateType.VMC &&
      Boolean(
        usableBrand.certificateValidTo &&
          usableBrand.certificateValidTo.getTime() > Date.now(),
      );
    const verificationType = hasCurrentVmc
      ? 'BIMI_VMC'
      : authenticationPassed &&
          this.flags.ruknyVerification() &&
          senderIdentity?.ruknyVerified
        ? 'RUKNY'
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
      senderDomain: row.senderDomain,
      authentication: {
        spf: row.spfVerdict,
        dkim: row.dkimVerdict,
        dmarc: row.dmarcVerdict,
      },
      senderBrand: senderIdentity
        ? {
            domain: senderIdentity.domain,
            status: senderIdentity.brandStatus,
            logoUrl: fromAvatarUrl,
            certificateType: senderIdentity.certificateType,
            ruknyVerified: senderIdentity.ruknyVerified,
          }
        : null,
      verificationType,
      to: row.toAddresses,
      cc: row.ccAddresses,
      bcc: row.bccAddresses,
      subject: row.subject,
      bodyText: options?.omitBodies
        ? null
        : (options?.bodyText ?? row.bodyText),
      bodyHtml: options?.omitBodies
        ? null
        : (options?.bodyHtml ?? row.bodyHtml),
      preview: row.snippet,
      unread: !row.isRead,
      starred: row.isStarred,
      sesMessageId: row.sesMessageId,
      errorMessage: row.errorMessage,
      sentAt: row.sentAt,
      receivedAt: row.receivedAt,
      scheduledAt: row.scheduledAt ?? null,
      attachments: options?.attachments ?? [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private async requireOwnedMailbox(userId: string, appId: string, mailboxId: string) {
    const access = await this.access.requireAccess(userId, appId);

    const mailbox = await this.prisma.mailMailbox.findFirst({
      where: {
        id: mailboxId,
        mailAppId: access.app.id,
        status: MailMailboxStatus.ACTIVE,
      },
    });
    if (!mailbox) {
      throw new NotFoundException('Mailbox not found or inactive.');
    }
    return { app: access.app, mailbox };
  }

  private async requireUnlockedMailbox(
    userId: string,
    appId: string,
    mailboxId: string | undefined,
    sessionToken: string | undefined,
  ) {
    if (!mailboxId) {
      throw new BadRequestException('mailboxId is required.');
    }
    await this.mailboxSessions.assertAsync(sessionToken, {
      userId,
      appId,
      mailboxId,
    });
    return this.requireOwnedMailbox(userId, appId, mailboxId);
  }

  async assertOwnedApp(userId: string, appId: string) {
    const access = await this.access.requireAccess(userId, appId);
    return access.app;
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
      sessionToken?: string;
      q?: string;
      scheduled?: boolean;
    } = {},
  ) {
    const { app } = await this.requireUnlockedMailbox(
      userId,
      appId,
      opts.mailboxId,
      opts.sessionToken,
    );

    const take = Math.min(Math.max(opts.take ?? 50, 1), 100);
    const needle = opts.q?.trim().slice(0, 200) || '';

    const where: Prisma.MailMessageWhereInput = {
      // Messages are stored under the workspace owner; access is via unlocked session.
      userId: app.userId,
      mailbox: {
        mailAppId: app.id,
        status: { not: MailMailboxStatus.DELETED },
        ...(opts.mailboxId ? { id: opts.mailboxId } : {}),
      },
      ...(opts.scheduled
        ? {
            folder: MailMessageFolder.DRAFTS,
            scheduledAt: { gt: new Date() },
          }
        : opts.starred
          ? { isStarred: true }
          : opts.folder === MailMessageFolder.DRAFTS
            ? {
                folder: MailMessageFolder.DRAFTS,
                OR: [{ scheduledAt: null }, { scheduledAt: { lte: new Date() } }],
              }
            : opts.folder === MailMessageFolder.INBOX || opts.folder === undefined
              ? {
                  folder: {
                    in: [
                      MailMessageFolder.INBOX,
                      MailMessageFolder.SOCIAL,
                      MailMessageFolder.PROMOTIONS,
                    ],
                  },
                }
              : { folder: opts.folder }),
    };

    if (needle) {
      where.AND = [
        {
          OR: [
            { subject: { contains: needle, mode: 'insensitive' } },
            { fromAddress: { contains: needle, mode: 'insensitive' } },
            { snippet: { contains: needle, mode: 'insensitive' } },
          ],
        },
      ];
    }

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
    const identities = await this.loadSenderIdentities(
      page.map((row) => row.senderDomain),
    );

    return {
      messages: page.map((row) =>
        this.toView(
          row,
          row.senderDomain ? identities.get(row.senderDomain) : undefined,
          { omitBodies: true },
        ),
      ),
      nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null,
    };
  }

  private toLogView(row: {
    id: string;
    mailboxId: string;
    direction: MailMessageDirection;
    folder: MailMessageFolder;
    status: MailMessageStatus;
    fromAddress: string;
    toAddresses: string[];
    subject: string;
    sesMessageId: string | null;
    errorMessage: string | null;
    sentAt: Date | null;
    receivedAt: Date | null;
    createdAt: Date;
    mailbox: { localPart: string; domain: string };
  }) {
    return {
      id: row.id,
      mailboxId: row.mailboxId,
      mailboxAddress: `${row.mailbox.localPart}@${row.mailbox.domain}`,
      direction: row.direction,
      folder: row.folder,
      status: row.status,
      fromAddress: row.fromAddress,
      toAddresses: row.toAddresses,
      subject: row.subject,
      sesMessageId: row.sesMessageId,
      errorMessage: row.errorMessage,
      sentAt: row.sentAt?.toISOString() ?? null,
      receivedAt: row.receivedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listLogs(
    userId: string,
    appId: string,
    opts: {
      mailboxId?: string;
      direction?: MailMessageDirection;
      status?: MailMessageStatus;
      q?: string;
      days?: number;
      take?: number;
      page?: number;
      cursor?: string;
    } = {},
  ) {
    const app = await this.assertOwnedApp(userId, appId);
    const days = opts.days === 1 || opts.days === 30 ? opts.days : 7;
    const parsedTake = Number(opts.take);
    const take = Number.isFinite(parsedTake)
      ? Math.min(Math.max(parsedTake, 1), 100)
      : 50;
    const parsedPage = Number(opts.page);
    const page = Number.isFinite(parsedPage)
      ? Math.min(Math.max(Math.floor(parsedPage), 1), 10_000)
      : 1;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const needle = opts.q?.trim().slice(0, 200) || '';

    const where: Prisma.MailMessageWhereInput = {
      userId: app.userId,
      folder: { not: MailMessageFolder.DRAFTS },
      createdAt: { gte: since },
      mailbox: {
        mailAppId: app.id,
        status: { not: MailMailboxStatus.DELETED },
        ...(opts.mailboxId ? { id: opts.mailboxId } : {}),
      },
      ...(opts.direction ? { direction: opts.direction } : {}),
      ...(opts.status ? { status: opts.status } : {}),
    };

    if (needle) {
      const emailNeedle = needle.toLowerCase();
      where.AND = [
        {
          OR: [
            { fromAddress: { contains: needle, mode: 'insensitive' } },
            { subject: { contains: needle, mode: 'insensitive' } },
            {
              mailbox: {
                localPart: { contains: needle, mode: 'insensitive' },
              },
            },
            {
              mailbox: { domain: { contains: needle, mode: 'insensitive' } },
            },
            { toAddresses: { has: emailNeedle } },
          ],
        },
      ];
    }

    const select = {
      id: true,
      mailboxId: true,
      direction: true,
      folder: true,
      status: true,
      fromAddress: true,
      toAddresses: true,
      subject: true,
      sesMessageId: true,
      errorMessage: true,
      sentAt: true,
      receivedAt: true,
      createdAt: true,
      mailbox: { select: { localPart: true, domain: true } },
    } as const;
    const orderBy = [{ createdAt: 'desc' as const }, { id: 'desc' as const }];

    if (opts.cursor) {
      const rows = await this.prisma.mailMessage.findMany({
        where,
        select,
        orderBy,
        take: take + 1,
        cursor: { id: opts.cursor },
        skip: 1,
      });
      const hasMore = rows.length > take;
      const slice = hasMore ? rows.slice(0, take) : rows;
      return {
        logs: slice.map((row) => this.toLogView(row)),
        nextCursor: hasMore ? slice[slice.length - 1]?.id ?? null : null,
        total: slice.length,
        page: 1,
        take,
        days,
      };
    }

    const total = await this.prisma.mailMessage.count({ where });
    const pageCount = Math.max(1, Math.ceil(total / take) || 1);
    const safePage = Math.min(page, pageCount);
    const rows = await this.prisma.mailMessage.findMany({
      where,
      select,
      orderBy,
      skip: (safePage - 1) * take,
      take,
    });

    return {
      logs: rows.map((row) => this.toLogView(row)),
      nextCursor:
        safePage * take < total ? rows[rows.length - 1]?.id ?? null : null,
      total,
      page: safePage,
      take,
      days,
    };
  }

  async getOne(
    userId: string,
    appId: string,
    messageId: string,
    sessionToken?: string,
  ) {
    const app = await this.assertOwnedApp(userId, appId);

    const row = await this.prisma.mailMessage.findFirst({
      where: {
        id: messageId,
        userId: app.userId,
        mailbox: { mailAppId: app.id },
      },
      include: { mailbox: { select: { avatarKey: true } } },
    });
    if (!row) throw new NotFoundException('Message not found.');

    await this.mailboxSessions.assertAsync(sessionToken, {
      userId,
      appId,
      mailboxId: row.mailboxId,
    });

    if (!row.isRead) {
      await this.prisma.mailMessage.update({
        where: { id: row.id },
        data: { isRead: true },
      });
      row.isRead = true;
    }

    const identities = await this.loadSenderIdentities([row.senderDomain]);
    const bodies = await this.bodyCrypto.resolveBodies(this.asBodyRow(row));
    const attachmentRows = await this.attachments.listForMessage(row.id);
    return this.toView(
      row,
      row.senderDomain ? identities.get(row.senderDomain) : undefined,
      {
        bodyText: bodies.bodyText,
        bodyHtml: bodies.bodyHtml,
        attachments: attachmentRows,
      },
    );
  }

  async counts(
    userId: string,
    appId: string,
    mailboxId: string | undefined,
    sessionToken?: string,
  ) {
    const { app } = await this.requireUnlockedMailbox(
      userId,
      appId,
      mailboxId,
      sessionToken,
    );

    const mailboxFilter = {
      mailAppId: app.id,
      status: { not: MailMailboxStatus.DELETED },
      ...(mailboxId ? { id: mailboxId } : {}),
    };

    const [byFolder, starred, scheduled] = await Promise.all([
      this.prisma.mailMessage.groupBy({
        by: ['folder'],
        where: { userId: app.userId, mailbox: mailboxFilter },
        _count: { _all: true },
      }),
      this.prisma.mailMessage.count({
        where: {
          userId: app.userId,
          isStarred: true,
          mailbox: mailboxFilter,
        },
      }),
      this.prisma.mailMessage.count({
        where: {
          userId: app.userId,
          mailbox: mailboxFilter,
          folder: MailMessageFolder.DRAFTS,
          scheduledAt: { gt: new Date() },
        },
      }),
    ]);

    const folderCounts: Record<MailMessageFolder, number> = {
      INBOX: 0,
      SENT: 0,
      DRAFTS: 0,
      TRASH: 0,
      SPAM: 0,
      QUARANTINE: 0,
      ARCHIVE: 0,
      PROMOTIONS: 0,
      SOCIAL: 0,
    };
    for (const row of byFolder) {
      folderCounts[row.folder] = row._count._all;
    }

    return {
      // Inbox badge covers primary + social + promotions (spam stays separate).
      inbox:
        folderCounts.INBOX +
        folderCounts.SOCIAL +
        folderCounts.PROMOTIONS,
      sent: folderCounts.SENT,
      drafts: folderCounts.DRAFTS,
      trash: folderCounts.TRASH,
      spam: folderCounts.SPAM,
      quarantine: folderCounts.QUARANTINE,
      archive: folderCounts.ARCHIVE,
      promotions: folderCounts.PROMOTIONS,
      social: folderCounts.SOCIAL,
      starred,
      scheduled,
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
    sessionToken?: string,
  ) {
    const app = await this.assertOwnedApp(userId, appId);

    const row = await this.prisma.mailMessage.findFirst({
      where: {
        id: messageId,
        userId: app.userId,
        mailbox: { mailAppId: app.id },
      },
    });
    if (!row) throw new NotFoundException('Message not found.');

    await this.mailboxSessions.assertAsync(sessionToken, {
      userId,
      appId,
      mailboxId: row.mailboxId,
    });

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

    if (dto.folder !== undefined && dto.folder !== row.folder) {
      this.realtime.publish({
        type: 'mail.changed',
        appId,
        mailboxId: row.mailboxId,
        folder: dto.folder,
        messageId: updated.id,
      });
    }

    const bodies = await this.bodyCrypto.resolveBodies(this.asBodyRow(row));
    return this.toView(updated, undefined, {
      bodyText: bodies.bodyText,
      bodyHtml: bodies.bodyHtml,
    });
  }

  async remove(
    userId: string,
    appId: string,
    messageId: string,
    sessionToken?: string,
  ) {
    const app = await this.assertOwnedApp(userId, appId);

    const row = await this.prisma.mailMessage.findFirst({
      where: {
        id: messageId,
        userId: app.userId,
        mailbox: { mailAppId: app.id },
      },
    });
    if (!row) throw new NotFoundException('Message not found.');

    await this.mailboxSessions.assertAsync(sessionToken, {
      userId,
      appId,
      mailboxId: row.mailboxId,
    });

    const bodies = await this.bodyCrypto.resolveBodies(this.asBodyRow(row));
    await decrementMailboxStorage(
      this.prisma,
      row.mailboxId,
      utf8StorageBytes(bodies.bodyText, bodies.bodyHtml),
    );
    await this.prisma.mailMessage.delete({ where: { id: row.id } });

    this.realtime.publish({
      type: 'mail.changed',
      appId,
      mailboxId: row.mailboxId,
      folder: row.folder,
      messageId: row.id,
    });

    return { ok: true as const };
  }

  async sendViaSmtp(input: {
    mailboxId: string;
    userId: string;
    appId: string;
    from: string;
    fromName?: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    bodyText?: string;
    bodyHtml?: string;
  }) {
    const to = this.normalizeEmails(input.to);
    const cc = this.normalizeEmails(input.cc);
    const bcc = this.normalizeEmails(input.bcc);
    if (to.length === 0) {
      throw new BadRequestException('At least one To recipient is required.');
    }

    const bodyText = input.bodyText?.trim() || undefined;
    const bodyHtml = input.bodyHtml?.trim() || undefined;
    if (!bodyText && !bodyHtml) {
      throw new BadRequestException('Message body is required.');
    }

    const mailbox = await this.prisma.mailMailbox.findFirst({
      where: {
        id: input.mailboxId,
        status: MailMailboxStatus.ACTIVE,
        mailApp: { appId: input.appId, userId: input.userId, status: MailAppStatus.ACTIVE },
      },
      include: { mailApp: { select: { userId: true, appId: true } } },
    });
    if (!mailbox) {
      throw new NotFoundException('Mailbox not found.');
    }

    const fromAddress = input.from.trim().toLowerCase();
    const limits = await this.subscriptions.getActiveLimitsForApp(mailbox.mailAppId);
    if (!limits) {
      throw new BadRequestException(
        'This Mail app needs an active plan before you can send mail.',
      );
    }

    const recipientCount = to.length + cc.length + bcc.length;
    await this.outboundUsage.reserveOutbound(mailbox.mailAppId, recipientCount);

    const plainText =
      bodyText ||
      (bodyHtml
        ? bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        : '');
    const outboundHtml = bodyHtml?.trim() || undefined;
    const incomingBytes = utf8StorageBytes(plainText, outboundHtml);
    const usedBytes = Number(mailbox.storageUsedBytes ?? 0);
    if (usedBytes + incomingBytes > limits.storageQuotaBytesPerMailbox) {
      throw new BadRequestException(
        'Mailbox storage quota reached for this app’s plan. Request more storage or delete mail.',
      );
    }

    const messageIdHeader = this.rfcMessageId(mailbox.domain);
    const snippet = this.snippetFrom(plainText || undefined, outboundHtml);
    const encryptionEnabled = await this.bodyEncryption.isEnabledForMailApp(
      mailbox.mailAppId,
    );
    const bodyFields = await this.bodyCrypto.buildCreateFields({
      encryptionEnabled,
      mailboxId: mailbox.id,
      messageId: messageIdHeader,
      bodyText: plainText || null,
      bodyHtml: outboundHtml ?? null,
      dualWritePlaintext: this.bodyEncryption.dualWritePlaintext(),
    });

    const queued = await this.prisma.mailMessage.create({
      data: {
        mailboxId: mailbox.id,
        userId: input.userId,
        threadId: randomUUID(),
        messageId: messageIdHeader,
        direction: MailMessageDirection.OUTBOUND,
        folder: MailMessageFolder.SENT,
        status: MailMessageStatus.QUEUED,
        fromAddress,
        fromName: input.fromName?.trim() || mailbox.displayName,
        senderDomain: mailbox.domain.toLowerCase(),
        toAddresses: to,
        ccAddresses: cc,
        bccAddresses: bcc,
        replyTo: fromAddress,
        subject: input.subject.trim(),
        bodyText: bodyFields.bodyText,
        bodyHtml: bodyFields.bodyHtml,
        bodyCryptoStatus: bodyFields.bodyCryptoStatus,
        bodyCryptoVersion: bodyFields.bodyCryptoVersion,
        bodyKmsKeyId: bodyFields.bodyKmsKeyId,
        bodyEncryptedDek: toPrismaBytes(bodyFields.bodyEncryptedDek),
        bodyTextCiphertext: toPrismaBytes(bodyFields.bodyTextCiphertext),
        bodyHtmlCiphertext: toPrismaBytes(bodyFields.bodyHtmlCiphertext),
        snippet,
        isRead: true,
        clientSource: 'smtp',
      },
    });

    await incrementMailboxStorage(
      this.prisma,
      mailbox.id,
      utf8StorageBytes(plainText, outboundHtml),
    );

    try {
      const { sesMessageId } = await this.ses.sendEmail({
        from: fromAddress,
        fromName: input.fromName?.trim() || mailbox.displayName,
        to,
        cc,
        bcc,
        subject: input.subject.trim(),
        bodyText: plainText || undefined,
        bodyHtml: outboundHtml,
        replyTo: [fromAddress],
        messageIdHeader,
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
        appId: input.appId,
        mailboxId: mailbox.id,
        folder: MailMessageFolder.SENT,
        messageId: sent.id,
        direction: 'OUTBOUND',
      });

      return {
        ok: true as const,
        messageId: sent.id,
        sesMessageId,
      };
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

  async send(
    userId: string,
    appId: string,
    dto: SendMailMessageDto,
    sessionToken?: string,
  ) {
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    if (scheduledAt && scheduledAt.getTime() > Date.now()) {
      const draft = await this.createDraft(userId, appId, {
        mailboxId: dto.mailboxId,
        to: dto.to,
        cc: dto.cc,
        bcc: dto.bcc,
        subject: dto.subject,
        bodyText: dto.bodyText,
        bodyHtml: dto.bodyHtml,
        replyToMessageId: dto.replyToMessageId,
        attachmentIds: dto.attachmentIds,
        scheduledAt: dto.scheduledAt,
      }, sessionToken);
      return draft;
    }

    if (dto.draftId) {
      await this.updateDraft(userId, appId, dto.draftId, {
        mailboxId: dto.mailboxId,
        to: dto.to,
        cc: dto.cc,
        bcc: dto.bcc,
        subject: dto.subject,
        bodyText: dto.bodyText,
        bodyHtml: dto.bodyHtml,
        replyToMessageId: dto.replyToMessageId,
        attachmentIds: dto.attachmentIds,
        scheduledAt: null,
      }, sessionToken);
      return this.sendDraft(userId, appId, dto.draftId, sessionToken);
    }

    const to = this.normalizeEmails(dto.to);
    const cc = this.normalizeEmails(dto.cc);
    const bcc = this.normalizeEmails(dto.bcc);
    if (to.length === 0) {
      throw new BadRequestException('At least one To recipient is required.');
    }

    const bodyText = dto.bodyText?.trim() || undefined;
    const bodyHtml = sanitizeMailHtml(dto.bodyHtml);
    if (!bodyText && !bodyHtml) {
      throw new BadRequestException('Message body is required.');
    }

    const { app, mailbox } = await this.requireUnlockedMailbox(
      userId,
      appId,
      dto.mailboxId,
      sessionToken,
    );

    const attachmentIds = dto.attachmentIds ?? [];
    await this.attachments.assertOwned(
      userId,
      appId,
      attachmentIds,
      mailbox.id,
    );
    const mimeAttachments = await this.attachments.loadBuffers(attachmentIds);

    const limits = await this.subscriptions.getActiveLimitsForApp(
      mailbox.mailAppId,
    );
    if (!limits) {
      throw new BadRequestException(
        'This Mail app needs an active plan before you can send mail.',
      );
    }

    const recipientCount = to.length + cc.length + bcc.length;
    await this.outboundUsage.reserveOutbound(mailbox.mailAppId, recipientCount);

    const incomingBytes = utf8StorageBytes(bodyText, bodyHtml);
    const usedBytes = Number(mailbox.storageUsedBytes ?? 0);
    if (usedBytes + incomingBytes > limits.storageQuotaBytesPerMailbox) {
      throw new BadRequestException(
        'Mailbox storage quota reached for this app’s plan. Request more storage or delete mail.',
      );
    }

    const fromAddress = `${mailbox.localPart}@${mailbox.domain}`;
    let threadId: string = randomUUID();
    let inReplyTo: string | null = null;

    if (dto.replyToMessageId) {
      const parent = await this.prisma.mailMessage.findFirst({
        where: {
          id: dto.replyToMessageId,
          userId: app.userId,
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
    const outboundHtml = bodyHtml?.trim() || undefined;
    const snippet = this.snippetFrom(plainText || undefined, outboundHtml);

    const encryptionEnabled = await this.bodyEncryption.isEnabledForMailApp(
      mailbox.mailAppId,
    );
    const bodyFields = await this.bodyCrypto.buildCreateFields({
      encryptionEnabled,
      mailboxId: mailbox.id,
      messageId: messageIdHeader,
      bodyText: plainText || null,
      bodyHtml: outboundHtml ?? null,
      dualWritePlaintext: this.bodyEncryption.dualWritePlaintext(),
    });

    const queued = await this.prisma.mailMessage.create({
      data: {
        mailboxId: mailbox.id,
        userId: app.userId,
        threadId,
        messageId: messageIdHeader,
        inReplyTo,
        direction: MailMessageDirection.OUTBOUND,
        folder: MailMessageFolder.SENT,
        status: MailMessageStatus.QUEUED,
        fromAddress,
        fromName: mailbox.displayName,
        senderDomain: mailbox.domain.toLowerCase(),
        toAddresses: to,
        ccAddresses: cc,
        bccAddresses: bcc,
        replyTo: fromAddress,
        subject: dto.subject.trim(),
        bodyText: bodyFields.bodyText,
        bodyHtml: bodyFields.bodyHtml,
        bodyCryptoStatus: bodyFields.bodyCryptoStatus,
        bodyCryptoVersion: bodyFields.bodyCryptoVersion,
        bodyKmsKeyId: bodyFields.bodyKmsKeyId,
        bodyEncryptedDek: toPrismaBytes(bodyFields.bodyEncryptedDek),
        bodyTextCiphertext: toPrismaBytes(bodyFields.bodyTextCiphertext),
        bodyHtmlCiphertext: toPrismaBytes(bodyFields.bodyHtmlCiphertext),
        snippet,
        isRead: true,
        clientSource: 'webmail',
      },
    });

    await incrementMailboxStorage(
      this.prisma,
      mailbox.id,
      utf8StorageBytes(plainText, outboundHtml),
    );

    if (attachmentIds.length) {
      await this.attachments.linkToMessage(queued.id, attachmentIds);
    }

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
        attachments: mimeAttachments,
      });

      const sent = await this.prisma.mailMessage.update({
        where: { id: queued.id },
        data: {
          status: MailMessageStatus.SENT,
          sesMessageId,
          sentAt: new Date(),
          errorMessage: null,
          scheduledAt: null,
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

      const attachmentRows = await this.attachments.listForMessage(sent.id);
      return this.toView(
        {
          ...sent,
          mailbox: { avatarKey: mailbox.avatarKey },
        },
        undefined,
        {
          bodyText: plainText || null,
          bodyHtml: outboundHtml ?? null,
          attachments: attachmentRows,
        },
      );
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

  async createDraft(
    userId: string,
    appId: string,
    dto: SaveMailDraftDto,
    sessionToken?: string,
  ) {
    const { app, mailbox } = await this.requireUnlockedMailbox(
      userId,
      appId,
      dto.mailboxId,
      sessionToken,
    );
    const to = this.normalizeEmails(dto.to);
    const cc = this.normalizeEmails(dto.cc);
    const bcc = this.normalizeEmails(dto.bcc);
    const bodyText = dto.bodyText?.trim() || null;
    const bodyHtml = sanitizeMailHtml(dto.bodyHtml) ?? null;
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    const fromAddress = `${mailbox.localPart}@${mailbox.domain}`;
    const messageIdHeader = this.rfcMessageId(mailbox.domain);
    const snippet = this.snippetFrom(bodyText || undefined, bodyHtml || undefined);

    const encryptionEnabled = await this.bodyEncryption.isEnabledForMailApp(
      mailbox.mailAppId,
    );
    const bodyFields = await this.bodyCrypto.buildCreateFields({
      encryptionEnabled,
      mailboxId: mailbox.id,
      messageId: messageIdHeader,
      bodyText,
      bodyHtml,
      dualWritePlaintext: this.bodyEncryption.dualWritePlaintext(),
    });

    const draft = await this.prisma.mailMessage.create({
      data: {
        mailboxId: mailbox.id,
        userId: app.userId,
        threadId: randomUUID(),
        messageId: messageIdHeader,
        direction: MailMessageDirection.OUTBOUND,
        folder: MailMessageFolder.DRAFTS,
        status: MailMessageStatus.QUEUED,
        fromAddress,
        fromName: mailbox.displayName,
        senderDomain: mailbox.domain.toLowerCase(),
        toAddresses: to,
        ccAddresses: cc,
        bccAddresses: bcc,
        replyTo: fromAddress,
        subject: dto.subject?.trim() || '',
        bodyText: bodyFields.bodyText,
        bodyHtml: bodyFields.bodyHtml,
        bodyCryptoStatus: bodyFields.bodyCryptoStatus,
        bodyCryptoVersion: bodyFields.bodyCryptoVersion,
        bodyKmsKeyId: bodyFields.bodyKmsKeyId,
        bodyEncryptedDek: toPrismaBytes(bodyFields.bodyEncryptedDek),
        bodyTextCiphertext: toPrismaBytes(bodyFields.bodyTextCiphertext),
        bodyHtmlCiphertext: toPrismaBytes(bodyFields.bodyHtmlCiphertext),
        snippet,
        isRead: true,
        clientSource: 'webmail',
        scheduledAt,
      },
    });

    const attachmentIds = dto.attachmentIds ?? [];
    if (attachmentIds.length) {
      await this.attachments.assertOwned(
        userId,
        appId,
        attachmentIds,
        mailbox.id,
      );
      await this.attachments.linkToMessage(draft.id, attachmentIds);
    }

    const attachmentRows = await this.attachments.listForMessage(draft.id);
    return this.toView(
      { ...draft, mailbox: { avatarKey: mailbox.avatarKey } },
      undefined,
      {
        bodyText,
        bodyHtml,
        attachments: attachmentRows,
      },
    );
  }

  async updateDraft(
    userId: string,
    appId: string,
    draftId: string,
    dto: SaveMailDraftDto,
    sessionToken?: string,
  ) {
    const app = await this.assertOwnedApp(userId, appId);
    const existing = await this.prisma.mailMessage.findFirst({
      where: {
        id: draftId,
        userId: app.userId,
        folder: MailMessageFolder.DRAFTS,
        mailbox: { mailAppId: app.id },
      },
      include: { mailbox: true },
    });
    if (!existing) throw new NotFoundException('Draft not found.');

    await this.mailboxSessions.assertAsync(sessionToken, {
      userId,
      appId,
      mailboxId: existing.mailboxId,
    });

    const to = this.normalizeEmails(dto.to);
    const cc = this.normalizeEmails(dto.cc);
    const bcc = this.normalizeEmails(dto.bcc);
    const bodyText = dto.bodyText?.trim() || null;
    const bodyHtml = sanitizeMailHtml(dto.bodyHtml) ?? null;
    const scheduledAt =
      dto.scheduledAt === null
        ? null
        : dto.scheduledAt
          ? new Date(dto.scheduledAt)
          : existing.scheduledAt;

    const encryptionEnabled = await this.bodyEncryption.isEnabledForMailApp(
      existing.mailbox.mailAppId,
    );
    const bodyFields = await this.bodyCrypto.buildCreateFields({
      encryptionEnabled,
      mailboxId: existing.mailboxId,
      messageId: existing.messageId ?? this.rfcMessageId(existing.mailbox.domain),
      bodyText,
      bodyHtml,
      dualWritePlaintext: this.bodyEncryption.dualWritePlaintext(),
    });

    const updated = await this.prisma.mailMessage.update({
      where: { id: existing.id },
      data: {
        toAddresses: to,
        ccAddresses: cc,
        bccAddresses: bcc,
        subject: dto.subject?.trim() ?? existing.subject,
        bodyText: bodyFields.bodyText,
        bodyHtml: bodyFields.bodyHtml,
        bodyCryptoStatus: bodyFields.bodyCryptoStatus,
        bodyCryptoVersion: bodyFields.bodyCryptoVersion,
        bodyKmsKeyId: bodyFields.bodyKmsKeyId,
        bodyEncryptedDek: toPrismaBytes(bodyFields.bodyEncryptedDek),
        bodyTextCiphertext: toPrismaBytes(bodyFields.bodyTextCiphertext),
        bodyHtmlCiphertext: toPrismaBytes(bodyFields.bodyHtmlCiphertext),
        snippet: this.snippetFrom(bodyText || undefined, bodyHtml || undefined),
        scheduledAt,
      },
    });

    if (dto.attachmentIds) {
      await this.attachments.assertOwned(
        userId,
        appId,
        dto.attachmentIds,
        existing.mailboxId,
      );
      await this.attachments.linkToMessage(updated.id, dto.attachmentIds);
    }

    const attachmentRows = await this.attachments.listForMessage(updated.id);
    return this.toView(
      {
        ...updated,
        mailbox: { avatarKey: existing.mailbox.avatarKey },
      },
      undefined,
      { bodyText, bodyHtml, attachments: attachmentRows },
    );
  }

  async sendDraft(
    userId: string,
    appId: string,
    draftId: string,
    sessionToken?: string,
  ) {
    const app = await this.assertOwnedApp(userId, appId);
    const draft = await this.prisma.mailMessage.findFirst({
      where: {
        id: draftId,
        userId: app.userId,
        folder: MailMessageFolder.DRAFTS,
        mailbox: { mailAppId: app.id },
      },
      include: { mailbox: true, attachments: true },
    });
    if (!draft) throw new NotFoundException('Draft not found.');

    if (sessionToken) {
      await this.mailboxSessions.assertAsync(sessionToken, {
        userId,
        appId,
        mailboxId: draft.mailboxId,
      });
    }

    if (draft.scheduledAt && draft.scheduledAt.getTime() > Date.now()) {
      throw new BadRequestException('This message is scheduled for later.');
    }

    const to = draft.toAddresses;
    if (!to.length) {
      throw new BadRequestException('Add at least one recipient before sending.');
    }
    if (!draft.subject.trim()) {
      throw new BadRequestException('Subject is required.');
    }

    const bodies = await this.bodyCrypto.resolveBodies(this.asBodyRow(draft));
    const bodyText = bodies.bodyText?.trim() || undefined;
    const bodyHtml = sanitizeMailHtml(bodies.bodyHtml);
    if (!bodyText && !bodyHtml) {
      throw new BadRequestException('Message body is required.');
    }

    const mailbox = draft.mailbox;
    const limits = await this.subscriptions.getActiveLimitsForApp(
      mailbox.mailAppId,
    );
    if (!limits) {
      throw new BadRequestException(
        'This Mail app needs an active plan before you can send mail.',
      );
    }

    const recipientCount =
      draft.toAddresses.length +
      draft.ccAddresses.length +
      draft.bccAddresses.length;
    await this.outboundUsage.reserveOutbound(mailbox.mailAppId, recipientCount);

    const plainText =
      bodyText ||
      (bodyHtml
        ? bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        : '');
    const outboundHtml = bodyHtml?.trim() || undefined;
    const fromAddress = `${mailbox.localPart}@${mailbox.domain}`;
    const messageIdHeader =
      draft.messageId ?? this.rfcMessageId(mailbox.domain);
    const mimeAttachments = await this.attachments.loadBuffers(
      draft.attachments.map((row) => row.id),
    );

    try {
      const { sesMessageId } = await this.ses.sendEmail({
        from: fromAddress,
        fromName: mailbox.displayName,
        to: draft.toAddresses,
        cc: draft.ccAddresses,
        bcc: draft.bccAddresses,
        subject: draft.subject.trim(),
        bodyText: plainText || undefined,
        bodyHtml: outboundHtml,
        replyTo: [fromAddress],
        messageIdHeader,
        inReplyTo: draft.inReplyTo,
        attachments: mimeAttachments,
      });

      const sent = await this.prisma.mailMessage.update({
        where: { id: draft.id },
        data: {
          folder: MailMessageFolder.SENT,
          status: MailMessageStatus.SENT,
          sesMessageId,
          sentAt: new Date(),
          errorMessage: null,
          scheduledAt: null,
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

      const attachmentRows = await this.attachments.listForMessage(sent.id);
      return this.toView(
        { ...sent, mailbox: { avatarKey: mailbox.avatarKey } },
        undefined,
        {
          bodyText: plainText || null,
          bodyHtml: outboundHtml ?? null,
          attachments: attachmentRows,
        },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Send failed.';
      await this.prisma.mailMessage.update({
        where: { id: draft.id },
        data: {
          status: MailMessageStatus.FAILED,
          errorMessage: errorMessage.slice(0, 500),
        },
      });
      throw error;
    }
  }

  async sendScheduledDraft(userId: string, appId: string, draftId: string) {
    return this.sendDraft(userId, appId, draftId);
  }

  private sentCountCache: { at: number; value: number } | null = null;

  async countPlatformEmailsSent(): Promise<number> {
    const now = Date.now();
    if (this.sentCountCache && now - this.sentCountCache.at < 30_000) {
      return this.sentCountCache.value;
    }
    const value = await this.prisma.mailMessage.count({
      where: {
        direction: MailMessageDirection.OUTBOUND,
        status: MailMessageStatus.SENT,
      },
    });
    this.sentCountCache = { at: now, value };
    return value;
  }

  private async loadSenderIdentities(
    values: Array<string | null | undefined>,
  ): Promise<Map<string, SenderIdentity>> {
    const domains = [
      ...new Set(values.filter((value): value is string => Boolean(value))),
    ];
    const identities = new Map<string, SenderIdentity>();
    if (!domains.length) return identities;

    const [brands, trustedApps] = await Promise.all([
      this.flags.resolveBimi()
        ? this.prisma.mailSenderBrand.findMany({
            where: { domain: { in: domains } },
            select: {
              domain: true,
              status: true,
              logoS3Key: true,
              certificateType: true,
              certificateValidTo: true,
            },
          })
        : Promise.resolve([]),
      this.flags.ruknyVerification()
        ? this.prisma.mailApp.findMany({
            where: {
              primaryDomain: { in: domains },
              domainTrustStatus: MailDomainTrustStatus.VERIFIED,
            },
            select: { primaryDomain: true },
          })
        : Promise.resolve([]),
    ]);
    const trusted = new Set(
      trustedApps
        .map((app) => app.primaryDomain?.toLowerCase())
        .filter((domain): domain is string => Boolean(domain)),
    );
    const brandByDomain = new Map(brands.map((brand) => [brand.domain, brand]));
    for (const domain of domains) {
      const brand = brandByDomain.get(domain);
      identities.set(domain, {
        domain,
        logoS3Key: brand?.logoS3Key ?? null,
        brandStatus: brand?.status ?? null,
        certificateType: brand?.certificateType ?? null,
        certificateValidTo: brand?.certificateValidTo ?? null,
        ruknyVerified: trusted.has(domain),
      });
    }
    return identities;
  }
}
