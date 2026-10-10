import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { WhatsAppBusinessService } from '../../integrations/whatsapp-business/whatsapp-business.service';
import { DeveloperRateLimitService } from '../developer/shared/developer-rate-limit.service';
import { WalletService } from '../developer/wallet/wallet.service';
import { SendRuknyOtpDto } from './dto/send-rukny-otp.dto';

@Injectable()
export class RuknyOtpService {
  private readonly logger = new Logger(RuknyOtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappBusiness: WhatsAppBusinessService,
    private readonly rateLimit: DeveloperRateLimitService,
    private readonly wallet: WalletService,
  ) {}

  async send(
    userId: string,
    apiKeyId: string,
    developerAppId: string,
    dto: SendRuknyOtpDto,
  ) {
    const installed = await this.prisma.developerAppProduct.findFirst({
      where: {
        developerAppId,
        productId: 'ruknyOtp',
      },
      select: { id: true },
    });
    if (!installed) {
      throw new ForbiddenException(
        'Rukny OTP is not installed on this developer app.',
      );
    }

    const normalizedTo = dto.to.replace(/\s/g, '');
    await this.rateLimit.enforceOtpRateLimit(userId, normalizedTo);

    const deliveryId = randomUUID();
    const charge = await this.wallet.chargeMessage(
      userId,
      developerAppId,
      deliveryId,
      'AUTHENTICATION',
    );
    if (!charge.success) {
      throw new BadRequestException('Insufficient app wallet balance');
    }

    try {
      const result = await this.whatsappBusiness.sendOtp(normalizedTo, dto.code);
      if (result.status !== 'accepted') {
        await this.wallet.refundMessageCharge(userId, deliveryId);
        throw new BadRequestException('Failed to send OTP via WhatsApp');
      }

      return {
        id: deliveryId,
        status: 'sent',
        to: normalizedTo,
        providerMessageId: result.messageId || undefined,
      };
    } catch (error) {
      await this.wallet.refundMessageCharge(userId, deliveryId).catch(() => undefined);
      this.logger.warn(
        `Rukny OTP send failed for app ${developerAppId}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}
