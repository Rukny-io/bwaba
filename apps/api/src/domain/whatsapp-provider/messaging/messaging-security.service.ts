import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

export interface ResolvedWhatsappTemplate {
  id: string;
  name: string;
  language: string;
  category: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
}

@Injectable()
export class MessagingSecurityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensures template messages use an APPROVED template owned by the app.
   */
  async resolveApprovedTemplate(
    developerAppId: string,
    userId: string,
    dto: SendMessageDto,
  ): Promise<ResolvedWhatsappTemplate | null> {
    if (dto.type !== 'template' || !dto.template?.name) {
      if (dto.type === 'template') {
        throw new BadRequestException('Template name and language are required');
      }
      return null;
    }

    const language = dto.template.language?.code?.trim();
    if (!language) {
      throw new BadRequestException('Template language code is required');
    }

    const template = await this.prisma.developerWhatsappTemplate.findFirst({
      where: {
        name: dto.template.name,
        language,
        status: 'APPROVED',
        account: {
          userId,
          developerAppId,
          status: 'ACTIVE',
        },
      },
      select: {
        id: true,
        name: true,
        language: true,
        category: true,
      },
    });

    if (!template) {
      throw new BadRequestException(
        'Template not found or not approved for this app. Create and approve the template in the developer portal first.',
      );
    }

    return template;
  }

  normalizeE164(phone: string): string {
    const digits = phone.replace(/[\s\-\(\)]/g, '');
    if (!/^\+[1-9]\d{7,14}$/.test(digits)) {
      throw new BadRequestException(
        'Recipient must be a valid E.164 phone number (e.g. +9647xxxxxxxxx)',
      );
    }
    return digits;
  }

  walletCategoryForTemplate(
    category: ResolvedWhatsappTemplate['category'],
  ): string {
    return category;
  }
}
