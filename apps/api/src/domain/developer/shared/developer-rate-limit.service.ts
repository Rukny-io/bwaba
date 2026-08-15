import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../../../core/cache/redis.service';
import { DevSubscriptionsService } from '../subscriptions/dev-subscriptions.service';

const OTP_LIMIT_PER_RECIPIENT = 5;
const OTP_LIMIT_WINDOW_SECONDS = 60 * 60;
const OTP_LIMIT_PER_USER = 50;

@Injectable()
export class DeveloperRateLimitService {
  constructor(
    private readonly redis: RedisService,
    private readonly devSubscriptions: DevSubscriptionsService,
  ) {}

  async enforceApiKeyRateLimit(userId: string, apiKeyId: string): Promise<void> {
    const quotas = await this.devSubscriptions.getResourceQuotas(userId);
    const rateLimit = quotas.rateLimitPerMinute;
    const key = `ratelimit:apikey:${apiKeyId}`;

    const current = await this.redis.get<number>(key);
    if (current !== null && current !== undefined && current >= rateLimit) {
      throw new HttpException(
        {
          message: 'Rate limit exceeded. Try again in a minute.',
          retryAfter: 60,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const pipeline = await this.redis.getClient();
    if (pipeline) {
      const multi = pipeline.multi();
      multi.incr(key);
      multi.expire(key, 60);
      await multi.exec();
    }
  }

  /**
   * Limits OTP / AUTHENTICATION template sends per recipient and per account.
   */
  async enforceOtpRateLimit(userId: string, recipient: string): Promise<void> {
    const normalized = recipient.replace(/[\s\-\(\)\+]/g, '');
    const recipientKey = `ratelimit:otp:${userId}:${normalized}`;
    const userKey = `ratelimit:otp:user:${userId}`;

    const [recipientCount, userCount] = await Promise.all([
      this.redis.get<number>(recipientKey),
      this.redis.get<number>(userKey),
    ]);

    if (
      (recipientCount ?? 0) >= OTP_LIMIT_PER_RECIPIENT ||
      (userCount ?? 0) >= OTP_LIMIT_PER_USER
    ) {
      throw new HttpException(
        {
          message:
            'OTP rate limit exceeded for this recipient. Try again later.',
          retryAfter: OTP_LIMIT_WINDOW_SECONDS,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const pipeline = await this.redis.getClient();
    if (pipeline) {
      const multi = pipeline.multi();
      multi.incr(recipientKey);
      multi.expire(recipientKey, OTP_LIMIT_WINDOW_SECONDS);
      multi.incr(userKey);
      multi.expire(userKey, OTP_LIMIT_WINDOW_SECONDS);
      await multi.exec();
    }
  }
}
