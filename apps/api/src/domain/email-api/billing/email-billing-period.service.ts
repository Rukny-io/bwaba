import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EmailEntitlementService } from '../shared/email-entitlement.service';

@Injectable()
export class EmailBillingPeriodService {
  private readonly logger = new Logger(EmailBillingPeriodService.name);

  constructor(private readonly entitlements: EmailEntitlementService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async resetBillingPeriods() {
    try {
      const result = await this.entitlements.resetBillingPeriods();
      this.logger.log(
        `Email billing periods processed: free=${result.free}, paid=${result.paid}`,
      );
    } catch (error) {
      this.logger.error('Email billing period reset failed', error);
    }
  }
}
