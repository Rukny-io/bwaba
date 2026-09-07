import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createVerify } from 'crypto';
import {
  DeveloperEmailMessageStatus,
  DeveloperEmailSuppressionReason,
} from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';

type SnsEnvelope = {
  Type?: string;
  Message?: string;
  MessageId?: string;
  Subject?: string;
  Timestamp?: string;
  TopicArn?: string;
  Token?: string;
  SubscribeURL?: string;
  SigningCertURL?: string;
  Signature?: string;
  SignatureVersion?: string;
};

type SesEvent = {
  eventType?: string;
  notificationType?: string;
  mail?: { messageId?: string };
  delivery?: { recipients?: string[] };
  bounce?: { bounceType?: string; bouncedRecipients?: Array<{ emailAddress?: string }> };
  complaint?: { complainedRecipients?: Array<{ emailAddress?: string }> };
};

/** Verifies SNS's cryptographic signature before accepting SES event payloads.
 * No user-supplied URL is fetched: the signing certificate host is constrained
 * to official SNS endpoints, which prevents this webhook becoming an SSRF path. */
@Injectable()
export class EmailSesEventsService {
  private readonly logger = new Logger(EmailSesEventsService.name);
  private readonly certificateCache = new Map<string, { pem: string; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async handle(payload: unknown) {
    const envelope = this.asEnvelope(payload);
    await this.verifySnsSignature(envelope);
    this.assertExpectedTopic(envelope.TopicArn);

    if (envelope.Type === 'SubscriptionConfirmation') {
      await this.confirmSubscription(envelope.SubscribeURL!);
      return { ok: true, handled: 'subscription_confirmation' };
    }
    if (envelope.Type !== 'Notification' || !envelope.Message) {
      throw new BadRequestException('Unsupported SNS message type.');
    }

    let event: SesEvent;
    try {
      event = JSON.parse(envelope.Message) as SesEvent;
    } catch {
      throw new BadRequestException('SNS notification message is not valid JSON.');
    }
    return this.handleSesEvent(event);
  }

  private async handleSesEvent(event: SesEvent) {
    const sesMessageId = event.mail?.messageId;
    if (!sesMessageId) return { ok: true, handled: 'ignored_missing_message_id' };
    const message = await this.prisma.developerEmailMessage.findUnique({
      where: { sesMessageId },
      select: { id: true, userId: true, recipientHash: true },
    });
    if (!message) return { ok: true, handled: 'ignored_unknown_message' };

    const type = (event.eventType || event.notificationType || '').toLowerCase();
    if (type === 'delivery') {
      await this.prisma.developerEmailMessage.update({
        where: { id: message.id },
        data: { status: DeveloperEmailMessageStatus.DELIVERED, deliveredAt: new Date() },
      });
      return { ok: true, handled: 'delivery' };
    }

    const recipient = this.eventRecipient(event, type);
    if (!recipient || this.hashRecipient(recipient) !== message.recipientHash) {
      // Do not allow a mismatched event recipient to suppress an unrelated
      // address. One-recipient MVP messages make this strict equality safe.
      this.logger.warn(`Ignoring ${type || 'unknown'} event with mismatched recipient for SES message ${sesMessageId}`);
      return { ok: true, handled: 'ignored_recipient_mismatch' };
    }

    if (type === 'bounce') {
      await this.recordSuppression(message, recipient, DeveloperEmailMessageStatus.BOUNCED, DeveloperEmailSuppressionReason.BOUNCE);
      return { ok: true, handled: 'bounce' };
    }
    if (type === 'complaint') {
      await this.recordSuppression(message, recipient, DeveloperEmailMessageStatus.COMPLAINED, DeveloperEmailSuppressionReason.COMPLAINT);
      return { ok: true, handled: 'complaint' };
    }
    return { ok: true, handled: 'ignored_event_type' };
  }

  private async recordSuppression(
    message: { id: string; userId: string; recipientHash: string },
    _recipient: string,
    status: DeveloperEmailMessageStatus,
    reason: DeveloperEmailSuppressionReason,
  ) {
    await this.prisma.$transaction([
      this.prisma.developerEmailMessage.update({ where: { id: message.id }, data: { status } }),
      this.prisma.developerEmailSuppression.upsert({
        where: { userId_recipientHash: { userId: message.userId, recipientHash: message.recipientHash } },
        create: { userId: message.userId, recipientHash: message.recipientHash, reason },
        update: { reason },
      }),
    ]);
  }

  private eventRecipient(event: SesEvent, type: string): string | null {
    const raw = type === 'bounce'
      ? event.bounce?.bouncedRecipients?.[0]?.emailAddress
      : type === 'complaint'
        ? event.complaint?.complainedRecipients?.[0]?.emailAddress
        : event.delivery?.recipients?.[0];
    return raw ? raw.trim().toLowerCase() : null;
  }

  private asEnvelope(payload: unknown): Required<Pick<SnsEnvelope, 'Type' | 'MessageId' | 'Timestamp' | 'TopicArn' | 'SigningCertURL' | 'Signature' | 'SignatureVersion'>> & SnsEnvelope {
    if (!payload || typeof payload !== 'object') throw new BadRequestException('Invalid SNS payload.');
    const envelope = payload as SnsEnvelope;
    const required = ['Type', 'MessageId', 'Timestamp', 'TopicArn', 'SigningCertURL', 'Signature', 'SignatureVersion'] as const;
    if (required.some((key) => !envelope[key])) throw new BadRequestException('SNS payload is missing required fields.');
    return envelope as Required<Pick<SnsEnvelope, typeof required[number]>> & SnsEnvelope;
  }

  private async verifySnsSignature(envelope: ReturnType<EmailSesEventsService['asEnvelope']>) {
    const certUrl = this.validateCertificateUrl(envelope.SigningCertURL);
    const pem = await this.getCertificate(certUrl);
    const verifier = createVerify(envelope.SignatureVersion === '2' ? 'RSA-SHA256' : 'RSA-SHA1');
    verifier.update(this.canonicalMessage(envelope), 'utf8');
    verifier.end();
    if (!verifier.verify(pem, envelope.Signature, 'base64')) {
      throw new ForbiddenException('Invalid SNS message signature.');
    }
  }

  private canonicalMessage(envelope: SnsEnvelope): string {
    const fields = envelope.Type === 'Notification'
      ? ['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type']
      : ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'];
    return fields
      .filter((field) => envelope[field as keyof SnsEnvelope] !== undefined)
      .map((field) => `${field}\n${String(envelope[field as keyof SnsEnvelope])}\n`)
      .join('');
  }

  private validateCertificateUrl(value: string): string {
    let url: URL;
    try { url = new URL(value); } catch { throw new BadRequestException('Invalid SNS signing certificate URL.'); }
    if (url.protocol !== 'https:' || !/^sns\.[a-z0-9-]+\.amazonaws\.com(?:\.cn)?$/i.test(url.hostname) || !url.pathname.endsWith('.pem')) {
      throw new ForbiddenException('Untrusted SNS signing certificate URL.');
    }
    return url.toString();
  }

  private async getCertificate(url: string): Promise<string> {
    const cached = this.certificateCache.get(url);
    if (cached && cached.expiresAt > Date.now()) return cached.pem;
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(5_000) });
    if (!response.ok) throw new BadRequestException('Could not fetch SNS signing certificate.');
    const pem = await response.text();
    if (!pem.includes('BEGIN CERTIFICATE')) throw new BadRequestException('Invalid SNS signing certificate.');
    this.certificateCache.set(url, { pem, expiresAt: Date.now() + 60 * 60 * 1000 });
    return pem;
  }

  private assertExpectedTopic(topicArn: string) {
    const expected = this.config.get<string>('EMAIL_SES_SNS_TOPIC_ARN')?.trim();
    if (!expected || topicArn !== expected) throw new ForbiddenException('Unexpected SNS topic.');
  }

  private async confirmSubscription(value: string) {
    const url = this.validateSubscriptionUrl(value);
    await fetch(url, { method: 'GET', redirect: 'error', signal: AbortSignal.timeout(5_000) });
  }

  private validateSubscriptionUrl(value: string): string {
    let url: URL;
    try { url = new URL(value); } catch { throw new BadRequestException('Invalid SNS subscription URL.'); }
    if (
      url.protocol !== 'https:' ||
      !/^sns\.[a-z0-9-]+\.amazonaws\.com(?:\.cn)?$/i.test(url.hostname) ||
      url.searchParams.get('Action') !== 'ConfirmSubscription'
    ) {
      throw new ForbiddenException('Untrusted SNS subscription URL.');
    }
    return url.toString();
  }

  private hashRecipient(recipient: string) {
    return createHash('sha256').update(recipient).digest('hex');
  }
}
