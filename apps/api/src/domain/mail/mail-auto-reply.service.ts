import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MailAppStatus, MailMailboxStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { UpsertMailAutoReplyDto } from './dto/mail-auto-reply.dto';
import { MailSesService } from './mail-ses.service';
import { MailSubscriptionsService } from './mail-subscriptions.service';

const REPLY_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const NO_REPLY_LOCAL =
  /^(no-?reply|do-?not-?reply|donotreply|mailer-daemon|postmaster|bounce|notifications?|automated?)$/i;

export type MailAutoReplyInboundInput = {
  mailboxId: string;
  fromAddress: string;
  inboundMessageId: string | null;
  autoSubmitted?: string;
  precedence?: string;
  listId?: string;
  autoResponseSuppress?: string;
};

@Injectable()
export class MailAutoReplyService {
  private readonly logger = new Logger(MailAutoReplyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ses: MailSesService,
    private readonly subscriptions: MailSubscriptionsService,
  ) {}

  private async requireOwnedApp(userId: string, appId: string) {
    const app = await this.prisma.mailApp.findFirst({
      where: { appId, userId, status: MailAppStatus.ACTIVE },
    });
    if (!app) throw new NotFoundException('Mail app not found.');
    return app;
  }

  private async planAllows(mailAppUuid: string) {
    const limits = await this.subscriptions.getActiveLimitsForApp(mailAppUuid);
    return Boolean(limits?.limits?.automaticReplies);
  }

  private toView(box: {
    id: string;
    localPart: string;
    domain: string;
    autoReply: {
      enabled: boolean;
      subject: string;
      bodyText: string;
      startsAt: Date | null;
      endsAt: Date | null;
      updatedAt: Date;
    } | null;
  }) {
    const row = box.autoReply;
    return {
      mailboxId: box.id,
      mailboxAddress: `${box.localPart}@${box.domain}`,
      enabled: row?.enabled ?? false,
      subject: row?.subject ?? '',
      bodyText: row?.bodyText ?? '',
      startsAt: row?.startsAt?.toISOString() ?? null,
      endsAt: row?.endsAt?.toISOString() ?? null,
      updatedAt: row?.updatedAt?.toISOString() ?? null,
    };
  }

  async list(userId: string, appId: string) {
    const app = await this.requireOwnedApp(userId, appId);
    const allowed = await this.planAllows(app.id);
    const mailboxes = await this.prisma.mailMailbox.findMany({
      where: {
        mailAppId: app.id,
        status: MailMailboxStatus.ACTIVE,
      },
      include: { autoReply: true },
      orderBy: { createdAt: 'asc' },
    });
    return {
      allowed,
      replies: mailboxes.map((box) => this.toView(box)),
    };
  }

  async upsert(
    userId: string,
    appId: string,
    mailboxId: string,
    dto: UpsertMailAutoReplyDto,
  ) {
    const app = await this.requireOwnedApp(userId, appId);
    const allowed = await this.planAllows(app.id);
    if (dto.enabled && !allowed) {
      throw new ForbiddenException(
        'Automatic replies require a Standard or Premium plan.',
      );
    }

    const mailbox = await this.prisma.mailMailbox.findFirst({
      where: {
        id: mailboxId,
        mailAppId: app.id,
        status: MailMailboxStatus.ACTIVE,
      },
      include: { autoReply: true },
    });
    if (!mailbox) {
      throw new BadRequestException('Mailbox not found or inactive.');
    }

    const subject = (dto.subject ?? mailbox.autoReply?.subject ?? '').trim();
    const bodyText = (dto.bodyText ?? mailbox.autoReply?.bodyText ?? '').trim();
    if (dto.enabled) {
      if (!subject) {
        throw new BadRequestException('Subject is required to enable automatic replies.');
      }
      if (!bodyText) {
        throw new BadRequestException('Message is required to enable automatic replies.');
      }
    }

    const startsAt = this.parseOptionalDate(
      dto.startsAt,
      false,
      mailbox.autoReply?.startsAt ?? null,
    );
    const endsAt = this.parseOptionalDate(
      dto.endsAt,
      true,
      mailbox.autoReply?.endsAt ?? null,
    );
    if (startsAt && endsAt && endsAt.getTime() < startsAt.getTime()) {
      throw new BadRequestException('End date must be on or after the start date.');
    }

    const row = await this.prisma.mailAutoReply.upsert({
      where: { mailboxId: mailbox.id },
      create: {
        mailAppId: app.id,
        mailboxId: mailbox.id,
        enabled: dto.enabled,
        subject,
        bodyText,
        startsAt,
        endsAt,
      },
      update: {
        enabled: dto.enabled,
        subject,
        bodyText,
        startsAt,
        endsAt,
      },
    });

    return {
      allowed,
      reply: this.toView({
        id: mailbox.id,
        localPart: mailbox.localPart,
        domain: mailbox.domain,
        autoReply: row,
      }),
    };
  }

  /**
   * Send a vacation reply after inbound mail is stored. Never throws.
   */
  async maybeReply(input: MailAutoReplyInboundInput): Promise<void> {
    try {
      await this.tryReply(input);
    } catch (error) {
      this.logger.warn(
        `Auto-reply failed mailbox=${input.mailboxId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async tryReply(input: MailAutoReplyInboundInput) {
    if (this.shouldSkipHeaders(input)) return;

    const from = this.parseAddress(input.fromAddress);
    if (!from || from.address === 'unknown@unknown') return;
    if (NO_REPLY_LOCAL.test(from.local)) return;

    const mailbox = await this.prisma.mailMailbox.findFirst({
      where: {
        id: input.mailboxId,
        status: MailMailboxStatus.ACTIVE,
      },
      include: {
        autoReply: true,
        mailApp: { select: { id: true, status: true } },
      },
    });
    const rule = mailbox?.autoReply;
    if (
      !mailbox ||
      mailbox.mailApp.status !== MailAppStatus.ACTIVE ||
      !rule?.enabled
    ) {
      return;
    }

    const mailboxAddress =
      `${mailbox.localPart}@${mailbox.domain}`.toLowerCase();
    if (from.address === mailboxAddress) return;

    const now = new Date();
    if (rule.startsAt && now < rule.startsAt) return;
    if (rule.endsAt && now > rule.endsAt) return;

    const subject = rule.subject.trim();
    const bodyText = rule.bodyText.trim();
    if (!subject || !bodyText) return;

    const allowed = await this.planAllows(mailbox.mailApp.id);
    if (!allowed) return;

    const cutoff = new Date(Date.now() - REPLY_COOLDOWN_MS);
    const existingReceipt = await this.prisma.mailAutoReplyReceipt.findUnique({
      where: {
        autoReplyId_toAddress: {
          autoReplyId: rule.id,
          toAddress: from.address,
        },
      },
    });
    if (existingReceipt && existingReceipt.sentAt > cutoff) return;

    if (!this.ses.isConfigured()) {
      this.logger.warn(
        `Auto-reply skipped mailbox=${mailbox.id}: SES is not configured.`,
      );
      return;
    }

    const messageIdHeader = `<${randomUUID()}@${mailbox.domain}>`;
    await this.ses.sendEmail({
      from: mailboxAddress,
      fromName: mailbox.displayName,
      to: [from.address],
      subject,
      bodyText,
      replyTo: [mailboxAddress],
      messageIdHeader,
      inReplyTo: input.inboundMessageId,
    });

    await this.prisma.mailAutoReplyReceipt.upsert({
      where: {
        autoReplyId_toAddress: {
          autoReplyId: rule.id,
          toAddress: from.address,
        },
      },
      create: {
        autoReplyId: rule.id,
        toAddress: from.address,
        sentAt: new Date(),
      },
      update: { sentAt: new Date() },
    });
  }

  private shouldSkipHeaders(input: MailAutoReplyInboundInput) {
    const autoSubmitted = (input.autoSubmitted || '').trim().toLowerCase();
    if (autoSubmitted && autoSubmitted !== 'no') return true;

    const precedence = (input.precedence || '').trim().toLowerCase();
    if (/(^|[,;\s])(list|bulk|junk)([,;\s]|$)/.test(precedence)) return true;

    if ((input.listId || '').trim()) return true;

    const suppress = (input.autoResponseSuppress || '').toLowerCase();
    if (/\b(all|oof|autoreply)\b/.test(suppress)) return true;

    return false;
  }

  private parseAddress(raw: string) {
    const address = raw.trim().toLowerCase();
    const at = address.lastIndexOf('@');
    if (at <= 0 || at === address.length - 1) return null;
    return {
      address,
      local: address.slice(0, at),
      domain: address.slice(at + 1),
    };
  }

  private parseOptionalDate(
    value: string | null | undefined,
    endOfDay: boolean,
    fallback: Date | null,
  ): Date | null {
    if (value === undefined) return fallback;
    if (value == null || value === '') return null;
    const trimmed = value.trim();
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
    const parsed = new Date(
      dateOnly ? `${trimmed}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z` : trimmed,
    );
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid date.');
    }
    return parsed;
  }
}
