import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  MailAppStatus,
  MailMailboxStatus,
  MailMessageFolder,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import {
  CreateMailForwarderDto,
  UpdateMailForwarderDto,
} from './dto/mail-forwarder.dto';
import { MailRealtimeService } from './mail-realtime.service';
import { MailSesService } from './mail-ses.service';
import {
  decrementMailboxStorage,
  utf8StorageBytes,
} from './mail-storage.util';
import { MailSubscriptionsService } from './mail-subscriptions.service';

export type MailForwardInboundInput = {
  mailboxId: string;
  fromAddress: string;
  inboundRecordId: string;
  inboundMessageId: string | null;
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  autoSubmitted?: string;
  precedence?: string;
  listId?: string;
};

@Injectable()
export class MailForwarderService {
  private readonly logger = new Logger(MailForwarderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ses: MailSesService,
    private readonly subscriptions: MailSubscriptionsService,
    private readonly realtime: MailRealtimeService,
  ) {}

  private async requireOwnedApp(userId: string, appId: string) {
    const app = await this.prisma.mailApp.findFirst({
      where: { appId, userId, status: MailAppStatus.ACTIVE },
    });
    if (!app) throw new NotFoundException('Mail app not found.');
    return app;
  }

  private normalizeAddress(raw: string) {
    return raw.trim().toLowerCase();
  }

  private parseAddress(raw: string) {
    const address = this.normalizeAddress(raw);
    const at = address.lastIndexOf('@');
    if (at <= 0 || at === address.length - 1) return null;
    return {
      address,
      local: address.slice(0, at),
      domain: address.slice(at + 1),
    };
  }

  private async ruleLimit(mailAppUuid: string) {
    const limits = await this.subscriptions.getActiveLimitsForApp(mailAppUuid);
    return Number(limits?.limits?.forwardingRules) || 0;
  }

  private toView(row: {
    id: string;
    mailboxId: string;
    toAddress: string;
    keepCopy: boolean;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    mailbox: { localPart: string; domain: string; status: MailMailboxStatus };
  }) {
    return {
      id: row.id,
      mailboxId: row.mailboxId,
      mailboxAddress: `${row.mailbox.localPart}@${row.mailbox.domain}`,
      toAddress: row.toAddress,
      keepCopy: row.keepCopy,
      enabled: row.enabled && row.mailbox.status === MailMailboxStatus.ACTIVE,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async requireActiveMailbox(mailAppId: string, mailboxId: string) {
    const mailbox = await this.prisma.mailMailbox.findFirst({
      where: {
        id: mailboxId,
        mailAppId,
        status: MailMailboxStatus.ACTIVE,
      },
    });
    if (!mailbox) {
      throw new BadRequestException('Mailbox not found or inactive.');
    }
    return mailbox;
  }

  private assertExternalDestination(
    toAddress: string,
    mailboxDomain: string,
    primaryDomain: string | null,
  ) {
    const parsed = this.parseAddress(toAddress);
    if (!parsed) {
      throw new BadRequestException('Enter a valid destination address.');
    }
    const own = new Set(
      [mailboxDomain, primaryDomain].filter(Boolean).map((d) => d!.toLowerCase()),
    );
    if (own.has(parsed.domain)) {
      throw new BadRequestException(
        'Forward to an address outside this domain. Use an alias to keep mail in Rukny.',
      );
    }
    return parsed.address;
  }

  async list(userId: string, appId: string) {
    const app = await this.requireOwnedApp(userId, appId);
    const [limit, rows] = await Promise.all([
      this.ruleLimit(app.id),
      this.prisma.mailForwarder.findMany({
        where: { mailAppId: app.id },
        include: {
          mailbox: {
            select: { localPart: true, domain: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return {
      domain: app.primaryDomain,
      limit,
      used: rows.length,
      forwarders: rows.map((row) => this.toView(row)),
    };
  }

  async create(userId: string, appId: string, dto: CreateMailForwarderDto) {
    const app = await this.requireOwnedApp(userId, appId);
    const limit = await this.ruleLimit(app.id);
    const used = await this.prisma.mailForwarder.count({
      where: { mailAppId: app.id },
    });
    if (used >= limit) {
      throw new BadRequestException(
        `Forwarding limit reached for this app (${limit}). Upgrade your plan for more rules.`,
      );
    }

    const mailbox = await this.requireActiveMailbox(app.id, dto.mailboxId);
    const toAddress = this.assertExternalDestination(
      dto.toAddress,
      mailbox.domain,
      app.primaryDomain,
    );

    try {
      const row = await this.prisma.mailForwarder.create({
        data: {
          mailAppId: app.id,
          mailboxId: mailbox.id,
          toAddress,
          keepCopy: dto.keepCopy !== false,
          enabled: true,
        },
        include: {
          mailbox: {
            select: { localPart: true, domain: true, status: true },
          },
        },
      });
      return { forwarder: this.toView(row) };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          `A forwarder to ${toAddress} already exists for this mailbox.`,
        );
      }
      throw error;
    }
  }

  async update(
    userId: string,
    appId: string,
    forwarderId: string,
    dto: UpdateMailForwarderDto,
  ) {
    const app = await this.requireOwnedApp(userId, appId);
    const existing = await this.prisma.mailForwarder.findFirst({
      where: { id: forwarderId, mailAppId: app.id },
      include: {
        mailbox: { select: { domain: true } },
      },
    });
    if (!existing) throw new NotFoundException('Forwarder not found.');

    let mailboxId = existing.mailboxId;
    let mailboxDomain = existing.mailbox.domain;
    if (dto.mailboxId) {
      const mailbox = await this.requireActiveMailbox(app.id, dto.mailboxId);
      mailboxId = mailbox.id;
      mailboxDomain = mailbox.domain;
    }

    const toAddress = dto.toAddress
      ? this.assertExternalDestination(
          dto.toAddress,
          mailboxDomain,
          app.primaryDomain,
        )
      : existing.toAddress;

    try {
      const row = await this.prisma.mailForwarder.update({
        where: { id: existing.id },
        data: {
          mailboxId,
          toAddress,
          ...(dto.keepCopy === undefined ? {} : { keepCopy: dto.keepCopy }),
          ...(dto.enabled === undefined ? {} : { enabled: dto.enabled }),
        },
        include: {
          mailbox: {
            select: { localPart: true, domain: true, status: true },
          },
        },
      });
      return { forwarder: this.toView(row) };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          `A forwarder to ${toAddress} already exists for this mailbox.`,
        );
      }
      throw error;
    }
  }

  async remove(userId: string, appId: string, forwarderId: string) {
    const app = await this.requireOwnedApp(userId, appId);
    const existing = await this.prisma.mailForwarder.findFirst({
      where: { id: forwarderId, mailAppId: app.id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Forwarder not found.');
    await this.prisma.mailForwarder.delete({ where: { id: existing.id } });
    return { ok: true };
  }

  /**
   * Forward stored inbound mail. Never throws.
   */
  async maybeForward(input: MailForwardInboundInput): Promise<void> {
    try {
      await this.tryForward(input);
    } catch (error) {
      this.logger.warn(
        `Forward failed mailbox=${input.mailboxId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async tryForward(input: MailForwardInboundInput) {
    if (this.shouldSkipHeaders(input)) return;

    const from = this.parseAddress(input.fromAddress);
    if (!from || from.address === 'unknown@unknown') return;

    const mailbox = await this.prisma.mailMailbox.findFirst({
      where: {
        id: input.mailboxId,
        status: MailMailboxStatus.ACTIVE,
      },
      include: {
        mailApp: {
          select: {
            id: true,
            appId: true,
            status: true,
            primaryDomain: true,
          },
        },
      },
    });
    if (!mailbox || mailbox.mailApp.status !== MailAppStatus.ACTIVE) return;

    const rules = await this.prisma.mailForwarder.findMany({
      where: {
        mailboxId: mailbox.id,
        enabled: true,
      },
    });
    if (rules.length === 0) return;

    if (!this.ses.isConfigured()) {
      this.logger.warn(
        `Forward skipped mailbox=${mailbox.id}: SES is not configured.`,
      );
      return;
    }

    const mailboxAddress =
      `${mailbox.localPart}@${mailbox.domain}`.toLowerCase();
    const ownDomains = new Set(
      [mailbox.domain, mailbox.mailApp.primaryDomain]
        .filter(Boolean)
        .map((d) => d!.toLowerCase()),
    );

    let attempted = 0;
    let sent = 0;
    for (const rule of rules) {
      const dest = this.parseAddress(rule.toAddress);
      if (!dest) continue;
      if (dest.address === from.address || dest.address === mailboxAddress) {
        continue;
      }
      if (ownDomains.has(dest.domain)) continue;

      attempted += 1;
      try {
        await this.ses.sendEmail({
          from: mailboxAddress,
          fromName: mailbox.displayName,
          to: [dest.address],
          subject: input.subject,
          bodyText: input.bodyText || undefined,
          bodyHtml: input.bodyHtml || undefined,
          replyTo: [from.address],
          messageIdHeader: `<${randomUUID()}@${mailbox.domain}>`,
          inReplyTo: input.inboundMessageId,
        });
        sent += 1;
      } catch (error) {
        this.logger.warn(
          `Forward SES failed mailbox=${mailbox.id} to=${dest.address}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    const keepCopy = rules.some((rule) => rule.keepCopy);
    if (!keepCopy && attempted > 0 && sent === attempted) {
      await this.discardInboundCopy(
        input.inboundRecordId,
        mailbox.id,
        mailbox.mailApp.appId,
        {
          bodyText: input.bodyText,
          bodyHtml: input.bodyHtml,
        },
      );
    }
  }

  private async discardInboundCopy(
    messageId: string,
    mailboxId: string,
    appId: string,
    body: { bodyText: string | null; bodyHtml: string | null },
  ) {
    const deleted = await this.prisma.mailMessage.deleteMany({
      where: { id: messageId, mailboxId },
    });
    if (deleted.count === 0) return;
    const bytes = utf8StorageBytes(body.bodyText, body.bodyHtml);
    await decrementMailboxStorage(this.prisma, mailboxId, bytes);
    this.realtime.publish({
      type: 'mail.changed',
      appId,
      mailboxId,
      folder: MailMessageFolder.INBOX,
      messageId,
      direction: 'INBOUND',
    });
  }

  private shouldSkipHeaders(input: MailForwardInboundInput) {
    const autoSubmitted = (input.autoSubmitted || '').trim().toLowerCase();
    if (autoSubmitted && autoSubmitted !== 'no') return true;

    const precedence = (input.precedence || '').trim().toLowerCase();
    if (/(^|[,;\s])(list|bulk|junk)([,;\s]|$)/.test(precedence)) return true;

    if ((input.listId || '').trim()) return true;
    return false;
  }
}
