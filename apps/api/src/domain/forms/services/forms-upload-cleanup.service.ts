import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { join } from 'path';
import { existsSync, readdirSync, statSync, unlinkSync, rmdirSync } from 'fs';
import { RedisService } from '../../../core/cache/redis.service';

const TEMP_MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours

@Injectable()
export class FormsUploadCleanupService {
  private readonly logger = new Logger(FormsUploadCleanupService.name);

  constructor(private readonly redis: RedisService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupStalePublicUploads(): Promise<void> {
    const tempRoot = join(process.cwd(), 'uploads', 'forms', 'temp');
    if (!existsSync(tempRoot)) return;

    const now = Date.now();
    let removed = 0;

    for (const slugDir of readdirSync(tempRoot)) {
      const dirPath = join(tempRoot, slugDir);
      try {
        const stat = statSync(dirPath);
        if (!stat.isDirectory()) continue;

        if (now - stat.mtimeMs > TEMP_MAX_AGE_MS) {
          for (const file of readdirSync(dirPath)) {
            unlinkSync(join(dirPath, file));
            removed++;
          }
          rmdirSync(dirPath);
        }
      } catch (err) {
        this.logger.warn(`Cleanup skip ${slugDir}: ${err?.message}`);
      }
    }

    if (removed > 0) {
      this.logger.log(`Removed ${removed} stale public form upload file(s)`);
    }
  }

  /** Track a public temp upload in Redis (48h TTL). */
  async trackPublicUpload(
    slug: string,
    filename: string,
    formId: string,
  ): Promise<void> {
    const key = `form:temp-upload:${slug}:${filename}`;
    await this.redis.set(key, formId, 48 * 3600);
  }
}
