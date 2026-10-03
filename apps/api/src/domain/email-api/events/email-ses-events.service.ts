import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import {
  DeveloperEmailMessageStatus,
  DeveloperEmailSuppressionReason,
} from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import {
  asSnsEnvelope,
  assertExpectedSnsTopic,
  confirmSnsSubscription,
  verifySnsSignature,
} from '../../../core/common/utils/sns-signature.util';

type SesEvent = {
  eventType?: string;
  notificationType?: string;
  mail?: { messageId?: string };
  delivery?: { recipients?: string[] };
  bounce?: {
    bounceType?: string;
    bouncedRecipients?: Array<{ emailAddress?: string }>;
  };
  complaint?: { complainedRecipients?: Array<{ emailAddress?: string }> };
};

/** Verifies SNS's cryptographic signature before accepting SES event payloads. */
@Injectable()
export class EmailSesEventsService {
  private readonly logger = new Logger(EmailSesEventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async handle(payload: unknown) {
    const envelope = asSnsEnvelope(payload);
    await verifySnsSignature(envelope);
    assertExpectedSnsTopic(
      envelope.TopicArn!,
      this.config.get<string>('EMAIL_SES_SNS_TOPIC_ARN'),
    );

    if (envelope.Type === 'SubscriptionConfirmation') {
      if (!envelope.SubscribeURL) {
        throw new BadRequestException(
          'SNS subscription confirmation is missing SubscribeURL.',
        );
      }
      await confirmSnsSubscription(envelope.SubscribeURL);
      return { ok: true, handled: 'subscription_confirmation' };
    }
    if (envelope.Type !== 'Notification' || !envelope.Message) {
      throw new BadRequestException('Unsupported SNS message type.');
    }

    let event: SesEvent;
    try {
      event = JSON.parse(envelope.Message) as SesEvent;
    } catch {
      throw new BadRequestException(
        'SNS notification message is not valid JSON.',
      );
    }
    return this.handleSesEvent(event);
  }

  private async handleSesEvent(event: SesEvent) {
    const sesMessageId = event.mail?.messageId;
    if (!sesMessageId)
      return { ok: true, handled: 'ignored_missing_message_id' };
    const message = await this.prisma.developerEmailMessage.findUnique({
      where: { sesMessageId },
      select: { id: true, userId: true, recipientHash: true },
    });
    if (!message) return { ok: true, handled: 'ignored_unknown_message' };

    const type = (
      event.eventType ||
      event.notificationType ||
      ''
    ).toLowerCase();
    if (type === 'delivery') {
      await this.prisma.developerEmailMessage.update({
        where: { id: message.id },
        data: {
          status: DeveloperEmailMessageStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      });
      return { ok: true, handled: 'delivery' };
    }

    const recipient = this.eventRecipient(event, type);
    if (!recipient || this.hashRecipient(recipient) !== message.recipientHash) {
      this.logger.warn(
        `Ignoring ${type || 'unknown'} event with mismatched recipient for SES message ${sesMessageId}`,
      );
      return { ok: true, handled: 'ignored_recipient_mismatch' };
    }

    if (type === 'bounce') {
      await this.recordSuppression(
        message,
        recipient,
        DeveloperEmailMessageStatus.BOUNCED,
        DeveloperEmailSuppressionReason.BOUNCE,
      );
      return { ok: true, handled: 'bounce' };
    }
    if (type === 'complaint') {
      await this.recordSuppression(
        message,
        recipient,
        DeveloperEmailMessageStatus.COMPLAINED,
        DeveloperEmailSuppressionReason.COMPLAINT,
      );
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
      this.prisma.developerEmailMessage.update({
        where: { id: message.id },
        data: { status },
      }),
      this.prisma.developerEmailSuppression.upsert({
        where: {
          userId_recipientHash: {
            userId: message.userId,
            recipientHash: message.recipientHash,
          },
        },
        create: {
          userId: message.userId,
          recipientHash: message.recipientHash,
          reason,
        },
        update: { reason },
      }),
    ]);
  }

  private eventRecipient(event: SesEvent, type: string): string | null {
    const raw =
      type === 'bounce'
        ? event.bounce?.bouncedRecipients?.[0]?.emailAddress
        : type === 'complaint'
          ? event.complaint?.complainedRecipients?.[0]?.emailAddress
          : event.delivery?.recipients?.[0];
    return raw ? raw.trim().toLowerCase() : null;
  }

  private hashRecipient(recipient: string) {
    return createHash('sha256').update(recipient).digest('hex');
  }
}
