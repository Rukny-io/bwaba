import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../core/database/prisma/prisma.service';
import { MailDomainStatusService } from './mail-domain-status.service';

/**
 * Keeps pending domains moving after the customer publishes DNS. DNS and SES
 * have no reliable push notification, so a bounded poll is the only way to
 * activate a domain when the settings page is closed.
 */
@Injectable()
export class MailDomainVerificationCronService {
  private readonly logger = new Logger(MailDomainVerificationCronService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly status: MailDomainStatusService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async verifyPendingDomains(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const domains = await this.prisma.mailDomain.findMany({
        where: { status: { in: ['PENDING_DNS', 'VERIFYING'] } },
        orderBy: { checkedAt: 'asc' },
        take: 100,
        select: {
          domain: true,
          mailApp: { select: { appId: true, userId: true } },
        },
      });

      for (const row of domains) {
        try {
          await this.status.check(
            row.mailApp.userId,
            row.mailApp.appId,
            row.domain,
          );
        } catch (error) {
          this.logger.warn(
            `Pending DNS check failed for ${row.domain}: ${error instanceof Error ? error.message : 'unknown error'}`,
          );
        }
      }
    } finally {
      this.running = false;
    }
  }
}
