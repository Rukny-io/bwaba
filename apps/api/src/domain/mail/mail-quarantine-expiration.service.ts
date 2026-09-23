import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailMessageFolder, MailQuarantineAction } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { MailRealtimeService } from './mail-realtime.service';

@Injectable()
export class MailQuarantineExpirationService {
  private readonly logger = new Logger(MailQuarantineExpirationService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: MailRealtimeService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpiredQuarantine(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      const now = new Date();
      const expired = await this.prisma.mailMessage.findMany({
        where: {
          folder: MailMessageFolder.QUARANTINE,
          quarantineExpiresAt: { lte: now },
        },
        include: {
          mailbox: {
            select: {
              localPart: true,
              domain: true,
              mailAppId: true,
              mailApp: { select: { appId: true, userId: true } },
            },
          },
        },
        take: 200,
      });

      if (!expired.length) return;

      for (const message of expired) {
        await this.prisma.$transaction([
          this.prisma.mailQuarantineActionLog.create({
            data: {
              mailAppId: message.mailbox.mailAppId,
              messageId: message.id,
              actorUserId: message.mailbox.mailApp.userId,
              action: MailQuarantineAction.EXPIRED,
              fromAddress: message.fromAddress,
              subject: message.subject,
              mailboxAddress: `${message.mailbox.localPart}@${message.mailbox.domain}`,
            },
          }),
          this.prisma.mailMessage.delete({ where: { id: message.id } }),
        ]);

        this.realtime.publish({
          type: 'mail.changed',
          appId: message.mailbox.mailApp.appId,
          mailboxId: message.mailboxId,
          folder: MailMessageFolder.QUARANTINE,
          messageId: message.id,
          direction: 'INBOUND',
        });
      }

      this.logger.log(
        `Purged ${expired.length} expired quarantined message(s)`,
      );
    } catch (error) {
      this.logger.error(
        `Quarantine purge failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      this.running = false;
    }
  }
}
