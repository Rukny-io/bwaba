import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  MailMessageFolder,
  MailMessageStatus,
} from '@prisma/client';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { MailMessagesService } from './mail-messages.service';

@Injectable()
export class MailScheduledSendService {
  private readonly logger = new Logger(MailScheduledSendService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly messages: MailMessagesService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async dispatchDueScheduledMessages() {
    if (this.running) return;
    this.running = true;
    try {
      const due = await this.prisma.mailMessage.findMany({
        where: {
          folder: MailMessageFolder.DRAFTS,
          status: MailMessageStatus.QUEUED,
          scheduledAt: { lte: new Date() },
        },
        take: 20,
        orderBy: { scheduledAt: 'asc' },
        select: { id: true, userId: true, mailbox: { select: { mailApp: { select: { appId: true } } } } },
      });

      for (const row of due) {
        const appId = row.mailbox.mailApp.appId;
        try {
          await this.messages.sendScheduledDraft(row.userId, appId, row.id);
        } catch (error) {
          this.logger.warn(
            `Scheduled send failed for ${row.id}: ${
              error instanceof Error ? error.message : 'unknown error'
            }`,
          );
        }
      }
    } finally {
      this.running = false;
    }
  }
}
