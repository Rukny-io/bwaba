import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { Prisma, DeveloperEmailMessageStatus } from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { MailSesService } from '../../mail/mail-ses.service';
import { SendEmailDto } from './dto/send-email.dto';
import {
  EmailEntitlementService,
  EmailQuotaReservation,
} from '../shared/email-entitlement.service';

@Injectable()
export class EmailMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ses: MailSesService,
    private readonly entitlements: EmailEntitlementService,
    private readonly config: ConfigService,
  ) {}

  async send(
    userId: string,
    apiKeyId: string,
    dto: SendEmailDto,
    idempotencyKey: string,
  ) {
    const apiKey = await this.prisma.developerApiKey.findFirst({
      where: { id: apiKeyId, userId, status: 'ACTIVE' },
      select: { developerAppId: true, environment: true },
    });
    if (!apiKey?.developerAppId) {
      throw new ForbiddenException('API key is not linked to a developer app.');
    }

    const developerAppId = apiKey.developerAppId;
    const existing = await this.prisma.developerEmailMessage.findUnique({
      where: { apiKeyId_idempotencyKey: { apiKeyId, idempotencyKey } },
      select: { externalId: true, status: true, createdAt: true },
    });
    if (existing) return this.publicMessage(existing);

    const appProduct = await this.prisma.developerAppProduct.findUnique({
      where: {
        developerAppId_productId: { developerAppId, productId: 'emailApi' },
      },
      select: { id: true },
    });
    if (!appProduct) {
      throw new ForbiddenException('Email API is not installed for this app.');
    }

    const from = this.normalizeAddress(dto.from);
    const recipient = this.normalizeAddress(dto.to[0]);
    const recipientHash = this.hashRecipient(recipient);
    const environment = apiKey.environment === 'test' ? 'test' : 'live';

    const suppressed = await this.prisma.developerEmailSuppression.findUnique({
      where: { userId_recipientHash: { userId, recipientHash } },
      select: { id: true },
    });
    if (suppressed) {
      throw new ForbiddenException(
        'Recipient is on this account suppression list.',
      );
    }

    const senderId = await this.requireAuthorizedSender(
      userId,
      developerAppId,
      from,
    );
    if (environment === 'test') {
      await this.requireTestRecipient(userId, recipient);
    }

    let reservation: EmailQuotaReservation | undefined;
    if (environment === 'live') {
      reservation = await this.entitlements.reserveLiveSend(userId);
    }

    const externalId = `em_${randomUUID().replace(/-/g, '')}`;
    let message: {
      id: string;
      externalId: string;
      status: DeveloperEmailMessageStatus;
      createdAt: Date;
    };
    try {
      message = await this.prisma.developerEmailMessage.create({
        data: {
          externalId,
          userId,
          developerAppId,
          apiKeyId,
          senderId,
          recipientHash,
          subject: dto.subject.trim(),
          idempotencyKey,
          environment,
        },
        select: { id: true, externalId: true, status: true, createdAt: true },
      });
    } catch (error) {
      if (reservation)
        await this.entitlements.releaseLiveSend(userId, reservation);
      if (this.isUniqueViolation(error)) {
        const replay = await this.prisma.developerEmailMessage.findUnique({
          where: { apiKeyId_idempotencyKey: { apiKeyId, idempotencyKey } },
          select: { externalId: true, status: true, createdAt: true },
        });
        if (replay) return this.publicMessage(replay);
      }
      throw error;
    }

    let sesMessageId: string;
    try {
      ({ sesMessageId } = await this.ses.sendEmail({
        from,
        fromName: dto.fromName?.trim(),
        to: [recipient],
        subject: dto.subject.trim(),
        bodyText: dto.bodyText,
        bodyHtml: dto.bodyHtml,
        replyTo: dto.replyTo?.map((address) => this.normalizeAddress(address)),
        messageIdHeader: `<${message.externalId}@api.rukny.io>`,
        configurationSetName: this.config
          .get<string>('EMAIL_SES_CONFIGURATION_SET')
          ?.trim(),
      }));
    } catch (error) {
      await this.prisma.developerEmailMessage.update({
        where: { id: message.id },
        data: {
          status: DeveloperEmailMessageStatus.FAILED,
          errorCode: 'provider_rejected',
          errorMessage: this.safeProviderError(error),
        },
      });
      if (reservation)
        await this.entitlements.releaseLiveSend(userId, reservation);
      throw new ServiceUnavailableException(
        'Email provider could not accept the message. The quota reservation was released.',
      );
    }

    try {
      const sent = await this.prisma.developerEmailMessage.update({
        where: { id: message.id },
        data: {
          status: DeveloperEmailMessageStatus.SENT,
          sesMessageId,
          sentAt: new Date(),
        },
        select: { externalId: true, status: true, createdAt: true },
      });
      return this.publicMessage(sent);
    } catch {
      throw new ServiceUnavailableException(
        'Email was accepted by the provider but its status could not be persisted. Retry with the same Idempotency-Key.',
      );
    }
  }

  async getStatus(userId: string, apiKeyId: string, externalId: string) {
    const apiKey = await this.prisma.developerApiKey.findFirst({
      where: { id: apiKeyId, userId, status: 'ACTIVE' },
      select: { developerAppId: true },
    });
    if (!apiKey?.developerAppId) {
      throw new ForbiddenException('API key is not linked to a developer app.');
    }
    const message = await this.prisma.developerEmailMessage.findFirst({
      where: { externalId, userId, developerAppId: apiKey.developerAppId },
      select: {
        externalId: true,
        status: true,
        createdAt: true,
        sentAt: true,
        deliveredAt: true,
      },
    });
    if (!message) throw new NotFoundException('Email message not found.');
    return {
      ...this.publicMessage(message),
      sentAt: message.sentAt?.toISOString() ?? null,
      deliveredAt: message.deliveredAt?.toISOString() ?? null,
    };
  }

  private async requireAuthorizedSender(
    userId: string,
    developerAppId: string,
    from: string,
  ): Promise<string> {
    const [localPart, domain] = this.splitAddress(from);
    const sender = await this.prisma.developerEmailSender.findFirst({
      where: {
        developerAppId,
        localPart,
        status: 'ACTIVE',
        emailDomain: { userId, domain, status: 'VERIFIED' },
      },
      select: { id: true },
    });
    if (!sender) {
      throw new ForbiddenException(
        'Sender is not verified or is not authorized for this developer app.',
      );
    }
    return sender.id;
  }

  private async requireTestRecipient(userId: string, recipient: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user || this.normalizeAddress(user.email) !== recipient) {
      throw new ForbiddenException(
        'Test API keys may send only to the account email address.',
      );
    }
  }

  private splitAddress(value: string): [string, string] {
    const at = value.lastIndexOf('@');
    if (at <= 0 || at === value.length - 1) {
      throw new BadRequestException('Invalid email address.');
    }
    return [value.slice(0, at), value.slice(at + 1)];
  }

  private normalizeAddress(value: string): string {
    const normalized = value.trim().toLowerCase();
    if (
      /\r|\n/.test(normalized) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    ) {
      throw new BadRequestException('Invalid email address.');
    }
    return normalized;
  }

  private hashRecipient(recipient: string): string {
    return createHash('sha256').update(recipient).digest('hex');
  }

  private publicMessage(message: {
    externalId: string;
    status: DeveloperEmailMessageStatus;
    createdAt: Date;
  }) {
    return {
      id: message.externalId,
      status: message.status.toLowerCase(),
      createdAt: message.createdAt.toISOString(),
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private safeProviderError(error: unknown): string {
    const message =
      error instanceof Error ? error.message : 'Provider rejected message.';
    return message.slice(0, 300);
  }
}
