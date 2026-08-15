import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { MetaApiService } from '../shared/meta-api.service';
import { TokenEncryptionService } from '../shared/token-encryption.service';
import { QuotaService } from '../shared/quota.service';
import { DeveloperRateLimitService } from '../../developer/shared/developer-rate-limit.service';
import { WalletService } from '../../developer/wallet/wallet.service';
import { WebhookDeliveryService } from '../../developer/webhooks/webhook-delivery.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagingSecurityService } from './messaging-security.service';
import { WhatsAppMessageIdempotencyService } from './whatsapp-message-idempotency.service';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    private prisma: PrismaService,
    private metaApi: MetaApiService,
    private tokenEncryption: TokenEncryptionService,
    private quotaService: QuotaService,
    private rateLimitService: DeveloperRateLimitService,
    private walletService: WalletService,
    private webhookDelivery: WebhookDeliveryService,
    private messagingSecurity: MessagingSecurityService,
    private idempotency: WhatsAppMessageIdempotencyService,
  ) {}

  async sendMessage(
    userId: string,
    apiKeyId: string,
    dto: SendMessageDto,
    idempotencyKey?: string,
  ) {
    if (idempotencyKey) {
      const claim = await this.idempotency.claim(apiKeyId, idempotencyKey);
      if (claim === 'replay') {
        const stored = await this.idempotency.getStoredResult(
          apiKeyId,
          idempotencyKey,
        );
        if (stored) return stored;
      }
    }

    try {
      const result = await this.sendMessageInternal(
        userId,
        apiKeyId,
        dto,
      );

      if (idempotencyKey) {
        await this.idempotency.storeResult(apiKeyId, idempotencyKey, result);
      }

      return result;
    } catch (error) {
      if (idempotencyKey) {
        await this.idempotency.releaseClaim(apiKeyId, idempotencyKey);
      }
      throw error;
    }
  }

  private async sendMessageInternal(
    userId: string,
    apiKeyId: string,
    dto: SendMessageDto,
  ) {
    await this.quotaService.enforceQuota(userId, 'messages');

    const apiKey = await this.prisma.developerApiKey.findFirst({
      where: { id: apiKeyId, userId, status: 'ACTIVE' },
      select: { developerAppId: true },
    });

    if (!apiKey?.developerAppId) {
      throw new ForbiddenException('API key is not linked to an app');
    }

    const developerAppId = apiKey.developerAppId;
    const normalizedTo = this.messagingSecurity.normalizeE164(dto.to);
    dto.to = normalizedTo;

    const approvedTemplate = await this.messagingSecurity.resolveApprovedTemplate(
      developerAppId,
      userId,
      dto,
    );

    if (approvedTemplate?.category === 'AUTHENTICATION') {
      await this.rateLimitService.enforceOtpRateLimit(userId, normalizedTo);
    }

    const accounts = await this.prisma.developerWhatsappAccount.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        developerAppId,
      },
      include: {
        phoneNumbers: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (accounts.length === 0) {
      throw new BadRequestException(
        'No active WhatsApp Business Account. Please connect one first.',
      );
    }

    let account;
    let phoneNumber;

    if (dto.phoneNumberId) {
      for (const acc of accounts) {
        const phone = acc.phoneNumbers.find(
          (p) => p.phoneNumberId === dto.phoneNumberId,
        );
        if (phone) {
          account = acc;
          phoneNumber = phone;
          break;
        }
      }
      if (!phoneNumber) {
        throw new NotFoundException('Phone number not found or not active');
      }
    } else {
      account = accounts[0];
      phoneNumber = account.phoneNumbers[0];
      if (!phoneNumber) {
        throw new BadRequestException('No active phone number available');
      }
    }

    if (!account.accessTokenEncrypted) {
      throw new BadRequestException('WABA account token is not available');
    }
    const accessToken = this.tokenEncryption.decrypt(
      account.accessTokenEncrypted,
    );

    const messageLog = await this.prisma.whatsappMessageLog.create({
      data: {
        userId,
        accountId: account.id,
        phoneNumberId: phoneNumber.id,
        apiKeyId,
        templateId: approvedTemplate?.id,
        direction: 'OUTBOUND',
        messageType: dto.type.toUpperCase() as any,
        status: 'ACCEPTED',
        recipientNumber: this.formatPhoneNumber(dto.to),
        senderNumber: phoneNumber.phoneNumber,
        content: this.buildContent(dto),
      },
    });

    try {
      const metaPayload = this.buildMetaPayload(dto);
      const result = await this.metaApi.sendMessage(
        phoneNumber.phoneNumberId,
        accessToken,
        metaPayload,
      );

      const metaMessageId = result.messages?.[0]?.id;

      await this.prisma.whatsappMessageLog.update({
        where: { id: messageLog.id },
        data: {
          status: 'SENT',
          metaMessageId,
          sentAt: new Date(),
        },
      });

      await this.quotaService.incrementMessageCount(userId);

      const walletCategory = approvedTemplate
        ? this.messagingSecurity.walletCategoryForTemplate(
            approvedTemplate.category,
          )
        : 'UTILITY';

      await this.walletService.chargeMessage(
        userId,
        developerAppId,
        messageLog.id,
        walletCategory,
      );

      await this.webhookDelivery.dispatchEvent(
        userId,
        'message.sent',
        {
          messageId: messageLog.id,
          metaMessageId,
          to: dto.to,
          type: dto.type,
          status: 'sent',
        },
        developerAppId,
      );

      return {
        id: messageLog.id,
        status: 'sent',
        to: dto.to,
        type: dto.type,
        meta_message_id: metaMessageId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorData = error.response?.data?.error || {};
      await this.prisma.whatsappMessageLog.update({
        where: { id: messageLog.id },
        data: {
          status: 'FAILED',
          errorCode: String(errorData.code || 'UNKNOWN'),
          errorMessage: errorData.message || error.message,
          failedAt: new Date(),
        },
      });

      await this.webhookDelivery.dispatchEvent(
        userId,
        'message.failed',
        {
          messageId: messageLog.id,
          to: dto.to,
          type: dto.type,
          error: {
            code: errorData.code,
            message: errorData.message || error.message,
          },
        },
        developerAppId,
      );

      throw new BadRequestException({
        message: 'Failed to send message',
        error: errorData.message || error.message,
        code: errorData.code,
      });
    }
  }

  async getMessageStatus(userId: string, messageId: string) {
    const message = await this.prisma.whatsappMessageLog.findFirst({
      where: { id: messageId, userId },
      select: {
        id: true,
        direction: true,
        messageType: true,
        status: true,
        recipientNumber: true,
        metaMessageId: true,
        conversationCategory: true,
        errorCode: true,
        errorMessage: true,
        pricing: true,
        sentAt: true,
        deliveredAt: true,
        readAt: true,
        failedAt: true,
        createdAt: true,
      },
    });

    if (!message) throw new NotFoundException('Message not found');

    return message;
  }

  private buildMetaPayload(dto: SendMessageDto): any {
    const payload: any = {
      messaging_product: 'whatsapp',
      to: this.formatPhoneNumber(dto.to),
      type: dto.type,
    };

    if (dto.text) payload.text = dto.text;
    if (dto.image) payload.image = dto.image;
    if (dto.video) payload.video = dto.video;
    if (dto.audio) payload.audio = dto.audio;
    if (dto.document) payload.document = dto.document;
    if (dto.sticker) payload.sticker = dto.sticker;
    if (dto.location) payload.location = dto.location;
    if (dto.contacts) payload.contacts = dto.contacts;
    if (dto.template) payload.template = dto.template;
    if (dto.interactive) payload.interactive = dto.interactive;

    return payload;
  }

  private buildContent(dto: SendMessageDto): any {
    const content: any = { type: dto.type };

    if (dto.text) content.text = dto.text.body;
    if (dto.template) content.template = dto.template.name;
    if (dto.image) content.image = dto.image.link || dto.image.id;
    if (dto.video) content.video = dto.video.link || dto.video.id;
    if (dto.document) content.document = dto.document.filename;

    return content;
  }

  private formatPhoneNumber(phone: string): string {
    return phone.replace(/[\s\-\(\)\+]/g, '');
  }
}
