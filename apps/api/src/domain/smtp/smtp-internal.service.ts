import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { MailAppStatus, MailMailboxStatus } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { ApiKeysService } from '../developer/api-keys/api-keys.service';
import { DeveloperRateLimitService } from '../developer/shared/developer-rate-limit.service';
import { EmailMessagesService } from '../email-api/messaging/email-messages.service';
import { MailMessagesService } from '../mail/mail-messages.service';
import {
  SmtpSendDeveloperDto,
  SmtpSendMailboxDto,
  SmtpValidateDeveloperKeyDto,
  SmtpValidateMailboxDto,
} from './dto/smtp-internal.dto';

const DEVELOPER_SMTP_USERNAME = 'rukny';

@Injectable()
export class SmtpInternalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiKeys: ApiKeysService,
    private readonly rateLimit: DeveloperRateLimitService,
    private readonly emailMessages: EmailMessagesService,
    private readonly mailMessages: MailMessagesService,
  ) {}

  static developerUsername(): string {
    return DEVELOPER_SMTP_USERNAME;
  }

  async validateDeveloperKey(dto: SmtpValidateDeveloperKeyDto) {
    const keyData = await this.requireDeveloperKey(dto.apiKey);
    if (!keyData.scopes.includes('email:send')) {
      throw new ForbiddenException('API key is missing email:send scope.');
    }
    if (dto.clientIp && keyData.ipAllowlist.length > 0) {
      if (!keyData.ipAllowlist.includes(dto.clientIp)) {
        throw new ForbiddenException('IP address not allowed for this API key.');
      }
    }
    return {
      ok: true as const,
      apiKeyId: keyData.id,
      userId: keyData.userId,
      developerAppId: keyData.developerAppId,
      environment: keyData.environment,
    };
  }

  async sendDeveloper(dto: SmtpSendDeveloperDto) {
    const keyData = await this.requireDeveloperKey(dto.apiKey);
    if (!keyData.scopes.includes('email:send')) {
      throw new ForbiddenException('API key is missing email:send scope.');
    }
    const clientIp = dto.clientIp?.trim() || 'smtp-gateway';
    if (keyData.ipAllowlist.length > 0 && !keyData.ipAllowlist.includes(clientIp)) {
      throw new ForbiddenException('IP address not allowed for this API key.');
    }
    await this.rateLimit.enforceApiKeyRateLimit(keyData.userId, keyData.id);
    await this.rateLimit.enforceEmailApiRateLimit(
      keyData.userId,
      keyData.id,
      keyData.developerAppId,
      clientIp,
    );

    if (!dto.bodyText?.trim() && !dto.bodyHtml?.trim()) {
      throw new BadRequestException('Message body is required.');
    }

    return this.emailMessages.sendViaSmtp(
      keyData.userId,
      keyData.id,
      {
        from: dto.from,
        fromName: dto.fromName,
        to: dto.to,
        subject: dto.subject,
        bodyText: dto.bodyText,
        bodyHtml: dto.bodyHtml,
        replyTo: dto.replyTo,
      },
      dto.idempotencyKey,
    );
  }

  async validateMailbox(dto: SmtpValidateMailboxDto) {
    const mailbox = await this.authenticateMailbox(
      dto.address,
      dto.appPassword,
    );
    return {
      ok: true as const,
      mailboxId: mailbox.id,
      mailAppId: mailbox.mailAppId,
      userId: mailbox.mailApp.userId,
      appId: mailbox.mailApp.appId,
      address: `${mailbox.localPart}@${mailbox.domain}`,
      allowedFrom: await this.allowedFromAddresses(mailbox),
    };
  }

  async sendMailbox(dto: SmtpSendMailboxDto) {
    const mailbox = await this.authenticateMailbox(
      dto.address,
      dto.appPassword,
    );
    const allowedFrom = await this.allowedFromAddresses(mailbox);
    const from = dto.from.trim().toLowerCase();
    if (!allowedFrom.includes(from)) {
      throw new ForbiddenException(
        'From address must match the authenticated mailbox or one of its aliases.',
      );
    }
    if (!dto.bodyText?.trim() && !dto.bodyHtml?.trim()) {
      throw new BadRequestException('Message body is required.');
    }

    return this.mailMessages.sendViaSmtp({
      mailboxId: mailbox.id,
      userId: mailbox.mailApp.userId,
      appId: mailbox.mailApp.appId,
      from,
      fromName: dto.fromName,
      to: dto.to,
      cc: dto.cc,
      bcc: dto.bcc,
      subject: dto.subject,
      bodyText: dto.bodyText,
      bodyHtml: dto.bodyHtml,
    });
  }

  private async requireDeveloperKey(rawKey: string) {
    if (
      !rawKey.startsWith('rk_live_') &&
      !rawKey.startsWith('rk_test_')
    ) {
      throw new UnauthorizedException('Invalid API key format.');
    }
    const keyData = await this.apiKeys.validateKey(rawKey);
    if (!keyData) {
      throw new UnauthorizedException('Invalid or expired API key.');
    }
    return keyData;
  }

  private async authenticateMailbox(address: string, appPassword: string) {
    const normalized = address.trim().toLowerCase();
    const at = normalized.lastIndexOf('@');
    if (at <= 0) {
      throw new UnauthorizedException('Invalid mailbox address.');
    }
    const localPart = normalized.slice(0, at);
    const domain = normalized.slice(at + 1);

    const mailbox = await this.prisma.mailMailbox.findFirst({
      where: {
        localPart,
        domain,
        status: MailMailboxStatus.ACTIVE,
      },
      include: {
        mailApp: { select: { id: true, appId: true, userId: true, status: true } },
        appPasswords: {
          where: { revokedAt: null },
          select: { id: true, secretHash: true },
        },
      },
    });

    if (!mailbox || mailbox.mailApp.status !== MailAppStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid mailbox credentials.');
    }

    let matchedId: string | null = null;
    for (const row of mailbox.appPasswords) {
      const ok = await bcrypt.compare(appPassword, row.secretHash);
      if (ok) {
        matchedId = row.id;
        break;
      }
    }
    if (!matchedId) {
      throw new UnauthorizedException('Invalid mailbox credentials.');
    }

    await this.prisma.mailAppPassword.update({
      where: { id: matchedId },
      data: { lastUsedAt: new Date() },
    });

    return mailbox;
  }

  private async allowedFromAddresses(
    mailbox: {
      localPart: string;
      domain: string;
      id: string;
    },
  ): Promise<string[]> {
    const primary = `${mailbox.localPart}@${mailbox.domain}`.toLowerCase();
    const aliases = await this.prisma.mailAlias.findMany({
      where: { mailboxId: mailbox.id, enabled: true },
      select: { localPart: true, domain: true },
    });
    const extra = aliases.map(
      (row) => `${row.localPart}@${row.domain}`.toLowerCase(),
    );
    return [primary, ...extra];
  }
}
