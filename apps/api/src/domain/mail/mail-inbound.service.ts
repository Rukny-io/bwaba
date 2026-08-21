import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MailMailboxStatus,
  MailMessageDirection,
  MailMessageFolder,
  MailMessageStatus,
} from '@prisma/client';
import { simpleParser, type AddressObject, type ParsedMail } from 'mailparser';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { S3Service } from '../../shared/services/s3.service';

type SesReceiptAction = {
  type?: string;
  bucketName?: string;
  objectKeyPrefix?: string;
  objectKey?: string;
};

type SesReceivedNotification = {
  notificationType?: string;
  mail?: {
    messageId?: string;
    source?: string;
    destination?: string[];
    commonHeaders?: {
      subject?: string;
      from?: string[];
      to?: string[];
      messageId?: string;
    };
  };
  receipt?: {
    action?: SesReceiptAction;
    recipients?: string[];
  };
};

@Injectable()
export class MailInboundService {
  private readonly logger = new Logger(MailInboundService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly config: ConfigService,
  ) {}

  assertWebhookToken(token: string | undefined) {
    const expected = this.config.get<string>('MAIL_SES_WEBHOOK_TOKEN')?.trim();
    if (!expected) return;
    if (!token || token !== expected) {
      throw new UnauthorizedException('Invalid mail webhook token.');
    }
  }

  private rawBucket() {
    return (
      this.config.get<string>('MAIL_S3_BUCKET_RAW')?.trim() ||
      this.config.get<string>('WORKSPACE_S3_BUCKET_RAW')?.trim() ||
      ''
    );
  }

  private addressesFrom(
    value: AddressObject | AddressObject[] | undefined,
  ): string[] {
    if (!value) return [];
    const list = Array.isArray(value) ? value : [value];
    const out: string[] = [];
    for (const item of list) {
      for (const addr of item.value ?? []) {
        if (addr.address) out.push(addr.address.toLowerCase());
      }
    }
    return out;
  }

  private firstName(
    value: AddressObject | AddressObject[] | undefined,
  ): string | null {
    if (!value) return null;
    const list = Array.isArray(value) ? value : [value];
    const first = list[0]?.value?.[0];
    return first?.name?.trim() || null;
  }

  private snippetFrom(text?: string | null, html?: string | null) {
    const raw = (text || html || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return raw.slice(0, 200) || null;
  }

  private normalizeMessageId(raw?: string | null) {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    return trimmed.startsWith('<') ? trimmed : `<${trimmed}>`;
  }

  async handleSnsPayload(body: unknown): Promise<{ ok: true; handled: string }> {
    const envelope = body as {
      Type?: string;
      SubscribeURL?: string;
      Message?: string;
      TopicArn?: string;
    };

    if (envelope?.Type === 'SubscriptionConfirmation' && envelope.SubscribeURL) {
      await this.confirmSubscription(envelope.SubscribeURL);
      return { ok: true, handled: 'subscription_confirmation' };
    }

    if (envelope?.Type === 'Notification' && typeof envelope.Message === 'string') {
      let notification: SesReceivedNotification;
      try {
        notification = JSON.parse(envelope.Message) as SesReceivedNotification;
      } catch {
        this.logger.warn('SNS Notification Message is not valid JSON');
        return { ok: true, handled: 'ignored_invalid_message' };
      }
      return this.handleSesNotification(notification);
    }

    // Direct SES JSON (useful for local/manual tests)
    if (
      body &&
      typeof body === 'object' &&
      ('notificationType' in body || 'receipt' in body || 'mail' in body)
    ) {
      return this.handleSesNotification(body as SesReceivedNotification);
    }

    this.logger.warn('Unrecognized SES/SNS webhook payload');
    return { ok: true, handled: 'ignored' };
  }

  private async confirmSubscription(url: string) {
    try {
      const parsed = new URL(url);
      if (
        parsed.protocol !== 'https:' ||
        !parsed.hostname.endsWith('.amazonaws.com')
      ) {
        this.logger.warn(`Refusing non-AWS SubscribeURL: ${url}`);
        return;
      }
      const res = await fetch(url, { method: 'GET' });
      this.logger.log(
        `SNS subscription confirmation GET ${res.status} ${parsed.hostname}`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to confirm SNS subscription',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async handleSesNotification(
    notification: SesReceivedNotification,
  ): Promise<{ ok: true; handled: string }> {
    const type = notification.notificationType || '';
    if (type && type !== 'Received') {
      // Bounce/Complaint can be wired later
      this.logger.debug(`Ignoring SES notificationType=${type}`);
      return { ok: true, handled: `ignored_${type || 'unknown'}` };
    }

    const action = notification.receipt?.action;
    const bucket =
      action?.bucketName ||
      this.rawBucket() ||
      undefined;
    const key =
      action?.objectKey ||
      (notification.mail?.messageId
        ? `${action?.objectKeyPrefix || ''}${notification.mail.messageId}`
        : undefined);

    if (!bucket || !key) {
      this.logger.warn(
        'Inbound notification missing S3 bucket/key — configure SES receipt rule S3 action',
      );
      return { ok: true, handled: 'missing_s3_location' };
    }

    const raw = await this.s3.getObject(bucket, key);
    if (!raw) {
      this.logger.warn(`Raw mail object not found s3://${bucket}/${key}`);
      return { ok: true, handled: 's3_not_found' };
    }

    const parsed = await simpleParser(raw);
    const stored = await this.storeInboundMessage({
      parsed,
      rawS3Key: key,
      sesMessageId: notification.mail?.messageId || null,
      destinations:
        notification.receipt?.recipients ||
        notification.mail?.destination ||
        [],
    });

    return {
      ok: true,
      handled: stored ? 'stored_inbound' : 'no_matching_mailbox',
    };
  }

  private async storeInboundMessage(input: {
    parsed: ParsedMail;
    rawS3Key: string;
    sesMessageId: string | null;
    destinations: string[];
  }) {
    const toFromParsed = this.addressesFrom(input.parsed.to);
    const candidates = [
      ...input.destinations.map((d) => d.toLowerCase()),
      ...toFromParsed,
      ...this.addressesFrom(input.parsed.cc),
    ];
    const uniqueCandidates = [...new Set(candidates.filter(Boolean))];

    const mailbox = await this.resolveMailbox(uniqueCandidates);
    if (!mailbox) {
      this.logger.warn(
        `No active mailbox for recipients: ${uniqueCandidates.join(', ')}`,
      );
      return null;
    }

    const messageId =
      this.normalizeMessageId(input.parsed.messageId) ||
      this.normalizeMessageId(input.sesMessageId) ||
      `<${randomUUID()}@${mailbox.domain}>`;

    const existing = await this.prisma.mailMessage.findFirst({
      where: {
        OR: [
          { messageId },
          ...(input.sesMessageId
            ? [{ sesMessageId: input.sesMessageId }]
            : []),
        ],
      },
      select: { id: true },
    });
    if (existing) {
      this.logger.debug(`Duplicate inbound skipped messageId=${messageId}`);
      return existing;
    }

    const fromAddress =
      this.addressesFrom(input.parsed.from)[0] ||
      'unknown@unknown';
    const fromName = this.firstName(input.parsed.from);
    const bodyText =
      typeof input.parsed.text === 'string' ? input.parsed.text : null;
    const bodyHtml =
      typeof input.parsed.html === 'string' ? input.parsed.html : null;

    const inReplyTo = this.normalizeMessageId(
      Array.isArray(input.parsed.inReplyTo)
        ? input.parsed.inReplyTo[0]
        : input.parsed.inReplyTo,
    );

    let threadId: string = randomUUID();
    if (inReplyTo) {
      const parent = await this.prisma.mailMessage.findFirst({
        where: {
          mailboxId: mailbox.id,
          OR: [{ messageId: inReplyTo }, { inReplyTo }],
        },
        select: { threadId: true },
      });
      if (parent) threadId = parent.threadId;
    }

    return this.prisma.mailMessage.create({
      data: {
        mailboxId: mailbox.id,
        userId: mailbox.mailApp.userId,
        threadId,
        messageId,
        inReplyTo,
        direction: MailMessageDirection.INBOUND,
        folder: MailMessageFolder.INBOX,
        status: MailMessageStatus.RECEIVED,
        fromAddress,
        fromName,
        toAddresses: toFromParsed.length
          ? toFromParsed
          : [`${mailbox.localPart}@${mailbox.domain}`],
        ccAddresses: this.addressesFrom(input.parsed.cc),
        bccAddresses: [],
        subject: input.parsed.subject?.trim() || '(no subject)',
        bodyText,
        bodyHtml,
        snippet: this.snippetFrom(bodyText, bodyHtml),
        isRead: false,
        sesMessageId: input.sesMessageId,
        rawS3Key: input.rawS3Key,
        receivedAt: input.parsed.date || new Date(),
      },
    });
  }

  private async resolveMailbox(addresses: string[]) {
    for (const address of addresses) {
      const at = address.lastIndexOf('@');
      if (at <= 0) continue;
      const localPart = address.slice(0, at).toLowerCase();
      const domain = address.slice(at + 1).toLowerCase();
      const mailbox = await this.prisma.mailMailbox.findFirst({
        where: {
          localPart,
          domain,
          status: MailMailboxStatus.ACTIVE,
        },
        include: {
          mailApp: { select: { userId: true, status: true } },
        },
      });
      if (mailbox && mailbox.mailApp.status === 'ACTIVE') {
        return mailbox;
      }
    }
    return null;
  }
}
