import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  MailMailboxStatus,
  MailMessageDirection,
  MailMessageFolder,
  MailMessageStatus,
} from '@prisma/client';
import { simpleParser, type AddressObject, type ParsedMail } from 'mailparser';
import { randomUUID, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { MailRealtimeService } from './mail-realtime.service';

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
  private mailS3: S3Client | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly realtime: MailRealtimeService,
  ) {}

  assertWebhookToken(token: string | undefined) {
    const expected = this.config.get<string>('MAIL_SES_WEBHOOK_TOKEN')?.trim();
    if (!expected) {
      this.logger.error(
        'MAIL_SES_WEBHOOK_TOKEN is not set — refusing mail webhook (fail-closed).',
      );
      throw new UnauthorizedException('Mail webhook is not configured.');
    }
    if (!token || !safeEqualToken(token, expected)) {
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

  private mailRegion() {
    return (
      this.config.get<string>('MAIL_AWS_REGION')?.trim() ||
      this.config.get<string>('AWS_REGION')?.trim() ||
      'eu-north-1'
    );
  }

  private getMailS3(): S3Client {
    if (this.mailS3) return this.mailS3;
    const accessKeyId = this.config.get<string>('AWS_ACCESS_KEY_ID')?.trim();
    const secretAccessKey = this.config
      .get<string>('AWS_SECRET_ACCESS_KEY')
      ?.trim();
    this.mailS3 = new S3Client({
      region: this.mailRegion(),
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
    });
    return this.mailS3;
  }

  private async getRawObject(
    bucket: string,
    key: string,
    attempts = 3,
  ): Promise<Buffer | null> {
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        const response = await this.getMailS3().send(
          new GetObjectCommand({ Bucket: bucket, Key: key }),
        );
        if (!response.Body) return null;
        const stream = response.Body as NodeJS.ReadableStream;
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
      } catch (error) {
        lastError = error;
        const name = error instanceof Error ? error.name : 'Error';
        if (name === 'NoSuchKey') {
          if (i < attempts - 1) {
            await new Promise((r) => setTimeout(r, 400 * (i + 1)));
            continue;
          }
          return null;
        }
        this.logger.warn(`Mail S3 get failed s3://${bucket}/${key}: ${name}`);
        if (i < attempts - 1) {
          await new Promise((r) => setTimeout(r, 400 * (i + 1)));
          continue;
        }
        throw error;
      }
    }
    if (lastError) throw lastError;
    return null;
  }

  private async listRawKeys(bucket: string, maxKeys: number): Promise<string[]> {
    const response = await this.getMailS3().send(
      new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: maxKeys,
      }),
    );
    return (response.Contents ?? [])
      .map((obj) => obj.Key)
      .filter((key): key is string => Boolean(key));
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
      this.logger.debug(`Ignoring SES notificationType=${type}`);
      return { ok: true, handled: `ignored_${type || 'unknown'}` };
    }

    const action = notification.receipt?.action;
    // When SNS is the last receipt action, action.type is SNS (no bucket/key).
    // SES still stores the raw MIME under mail.messageId in the S3 bucket.
    const bucket = (action?.bucketName || this.rawBucket() || '').trim();
    const key = (
      action?.objectKey ||
      (notification.mail?.messageId
        ? `${action?.objectKeyPrefix || ''}${notification.mail.messageId}`
        : '')
    ).trim();

    if (!bucket || !key) {
      this.logger.warn(
        `Inbound notification missing S3 location bucket=${bucket || '-'} key=${key || '-'} actionType=${action?.type || '-'}`,
      );
      return { ok: true, handled: 'missing_s3_location' };
    }

    this.logger.log(
      `Inbound Received → s3://${bucket}/${key} recipients=${(notification.receipt?.recipients || notification.mail?.destination || []).join(',')}`,
    );

    const raw = await this.getRawObject(bucket, key);
    if (!raw) {
      this.logger.warn(`Raw mail object not found s3://${bucket}/${key}`);
      return { ok: true, handled: 's3_not_found' };
    }

    const parsed = await simpleParser(raw);
    const headerDestinations = [
      ...(notification.mail?.commonHeaders?.to || []),
      ...this.headerAddresses(parsed, 'delivered-to'),
      ...this.headerAddresses(parsed, 'x-original-to'),
      ...this.headerAddresses(parsed, 'envelope-to'),
    ];

    const stored = await this.storeInboundMessage({
      parsed,
      rawS3Key: key,
      sesMessageId: notification.mail?.messageId || null,
      destinations: [
        ...(notification.receipt?.recipients || []),
        ...(notification.mail?.destination || []),
        ...headerDestinations,
      ],
    });

    const handled = stored ? 'stored_inbound' : 'no_matching_mailbox';
    this.logger.log(`Inbound handled=${handled} key=${key}`);
    return { ok: true, handled };
  }

  /**
   * Import raw MIME objects already stored by SES (recovery / catch-up).
   */
  async importRawKeys(keys: string[]) {
    const bucket = this.rawBucket();
    if (!bucket) {
      throw new BadRequestException('MAIL_S3_BUCKET_RAW is not configured.');
    }

    const results: Array<{ key: string; handled: string }> = [];
    for (const key of keys) {
      const trimmed = key.trim();
      if (!trimmed || trimmed === 'AMAZON_SES_SETUP_NOTIFICATION') {
        continue;
      }
      try {
        const raw = await this.getRawObject(bucket, trimmed);
        if (!raw) {
          results.push({ key: trimmed, handled: 's3_not_found' });
          continue;
        }
        const parsed = await simpleParser(raw);
        const stored = await this.storeInboundMessage({
          parsed,
          rawS3Key: trimmed,
          sesMessageId: null,
          destinations: [
            ...this.addressesFrom(parsed.to),
            ...this.headerAddresses(parsed, 'delivered-to'),
            ...this.headerAddresses(parsed, 'x-original-to'),
            ...this.headerAddresses(parsed, 'envelope-to'),
          ],
        });
        results.push({
          key: trimmed,
          handled: stored ? 'stored_inbound' : 'no_matching_mailbox',
        });
        this.logger.log(
          `Import key=${trimmed} handled=${stored ? 'stored_inbound' : 'no_matching_mailbox'}`,
        );
      } catch (error) {
        this.logger.error(
          `Import failed for s3://${bucket}/${trimmed}`,
          error instanceof Error ? error.stack : undefined,
        );
        results.push({ key: trimmed, handled: 'error' });
      }
    }
    // Do not return raw S3 object keys to clients — only aggregate status.
    const summary = {
      bucket,
      stored: results.filter((r) => r.handled === 'stored_inbound').length,
      unmatched: results.filter((r) => r.handled === 'no_matching_mailbox')
        .length,
      missing: results.filter((r) => r.handled === 's3_not_found').length,
      errors: results.filter((r) => r.handled === 'error').length,
      total: results.length,
    };
    return summary;
  }

  async importRecentRaw(limit = 30) {
    const bucket = this.rawBucket();
    if (!bucket) {
      throw new BadRequestException('MAIL_S3_BUCKET_RAW is not configured.');
    }
    let keys: string[];
    try {
      keys = await this.listRawKeys(
        bucket,
        Math.min(Math.max(limit, 1), 100),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes('not authorized') ||
        message.includes('AccessDenied') ||
        message.includes('ListBucket')
      ) {
        throw new BadRequestException(
          `AWS IAM missing s3:ListBucket/GetObject on ${bucket}. Update user rukny-platform policy.`,
        );
      }
      throw error;
    }
    return this.importRawKeys(
      keys.filter((k) => k !== 'AMAZON_SES_SETUP_NOTIFICATION'),
    );
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

    return this.prisma.mailMessage
      .create({
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
      })
      .then((created) => {
        this.realtime.publish({
          type: 'mail.changed',
          appId: mailbox.mailApp.appId,
          mailboxId: mailbox.id,
          folder: MailMessageFolder.INBOX,
          messageId: created.id,
          direction: 'INBOUND',
        });
        return created;
      });
  }

  private headerAddresses(parsed: ParsedMail, headerName: string): string[] {
    const value = parsed.headers?.get(headerName);
    if (!value) return [];
    const raw = Array.isArray(value) ? value.join(', ') : String(value);
    return raw
      .split(/[,;]+/)
      .map((part) => {
        const match = part.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
        return match?.[0]?.toLowerCase() || '';
      })
      .filter(Boolean);
  }

  private async resolveMailbox(addresses: string[]) {
    for (const address of addresses) {
      const normalized = address.trim().toLowerCase();
      const at = normalized.lastIndexOf('@');
      if (at <= 0) continue;
      let localPart = normalized.slice(0, at);
      const domain = normalized.slice(at + 1);
      // help+tag@domain → help
      const plus = localPart.indexOf('+');
      if (plus > 0) localPart = localPart.slice(0, plus);

      const mailbox = await this.prisma.mailMailbox.findFirst({
        where: {
          localPart,
          domain,
          status: MailMailboxStatus.ACTIVE,
        },
        include: {
          mailApp: { select: { userId: true, status: true, appId: true } },
        },
      });
      if (mailbox && mailbox.mailApp.status === 'ACTIVE') {
        return mailbox;
      }
    }

    return null;
  }
}

function safeEqualToken(provided: string, expected: string): boolean {
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
