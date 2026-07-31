import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FormsDeletionService } from './forms-deletion.service';

@Injectable()
export class FormsDeletionPurgeService {
  private readonly logger = new Logger(FormsDeletionPurgeService.name);
  private running = false;

  constructor(private readonly deletion: FormsDeletionService) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async purgeExpiredSoftDeletedForms(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      let total = 0;
      let batch = 0;
      do {
        batch = await this.deletion.purgeExpiredForms();
        total += batch;
      } while (batch >= 25);

      if (total > 0) {
        this.logger.log(`Purge job completed — ${total} form(s) permanently removed`);
      }
    } catch (err) {
      this.logger.error(
        `Purge job failed: ${err instanceof Error ? err.message : err}`,
      );
    } finally {
      this.running = false;
    }
  }
}
