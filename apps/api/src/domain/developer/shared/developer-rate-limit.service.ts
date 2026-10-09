import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../../../core/cache/redis.service';
import { DevSubscriptionsService } from '../subscriptions/dev-subscriptions.service';
import { PrismaService } from '../../../core/database/prisma/prisma.service';

const OTP_LIMIT_PER_RECIPIENT = 5;
const OTP_LIMIT_WINDOW_SECONDS = 60 * 60;
const OTP_LIMIT_PER_USER = 50;

@Injectable()
export class DeveloperRateLimitService {
  constructor(
    private readonly redis: RedisService,
    private readonly devSubscriptions: DevSubscriptionsService,
    private readonly prisma: PrismaService,
  ) {}

  /** Email API has product-specific ceilings so a free developer subscription
   * cannot bypass the commercial Email API allowance. Apply four keys to make
   * rotating keys or IPs ineffective as an abuse bypass. */
  async enforceEmailApiRateLimit(
    userId: string,
    apiKeyId: string,
    developerAppId: string | null,
    clientIp: string,
  ): Promise<void> {
    const now = new Date();
    const active = developerAppId
      ? await this.prisma.developerEmailEntitlement.findFirst({
          where: {
            developerAppId,
            subscriptionStatus: 'ACTIVE',
            periodStartsAt: { lte: now },
            periodEndsAt: { gt: now },
          },
          select: { id: true },
        })
      : await this.prisma.developerEmailEntitlement.findFirst({
          where: {
            userId,
            subscriptionStatus: 'ACTIVE',
            periodStartsAt: { lte: now },
            periodEndsAt: { gt: now },
          },
          select: { id: true },
        });
    const limit = active ? 30 : 10;
    const keys = [
      `ratelimit:email:key:${apiKeyId}`,
      `ratelimit:email:user:${userId}`,
      `ratelimit:email:ip:${clientIp}`,
      ...(developerAppId ? [`ratelimit:email:app:${developerAppId}`] : []),
    ];
    // One Lua operation checks and increments every dimension together. A
    // read-then-increment sequence would allow parallel requests to bypass
    // the limit at the window boundary.
    const allowed = await this.redis.getClient().eval(
      `for _, key in ipairs(KEYS) do
         local current = redis.call('GET', key)
         if current and tonumber(current) >= tonumber(ARGV[1]) then return 0 end
       end
       for _, key in ipairs(KEYS) do
         redis.call('INCR', key)
         redis.call('EXPIRE', key, ARGV[2])
       end
       return 1`,
      keys.length,
      ...keys,
      String(limit),
      '60',
    );
    if (Number(allowed) !== 1) {
      throw new HttpException(
        {
          message: 'Email API rate limit exceeded. Try again in a minute.',
          retryAfter: 60,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async enforceApiKeyRateLimit(
    userId: string,
    apiKeyId: string,
  ): Promise<void> {
    const quotas = await this.devSubscriptions.getResourceQuotas(userId);
    const rateLimit = quotas.rateLimitPerMinute;
    const key = `ratelimit:apikey:${apiKeyId}`;

    const client = await this.redis.getClient();
    const allowed = client
      ? await client.eval(
          `local current = tonumber(redis.call('GET', KEYS[1]) or '0')
           if current >= tonumber(ARGV[1]) then return 0 end
           redis.call('INCR', KEYS[1]); redis.call('EXPIRE', KEYS[1], ARGV[2])
           return 1`,
          1,
          key,
          String(rateLimit),
          '60',
        )
      : 1;
    if (Number(allowed) !== 1) {
      throw new HttpException(
        {
          message: 'Rate limit exceeded. Try again in a minute.',
          retryAfter: 60,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Limits OTP / AUTHENTICATION template sends per recipient and per account.
   */
  async enforceOtpRateLimit(userId: string, recipient: string): Promise<void> {
    const normalized = recipient.replace(/[\s\-\(\)\+]/g, '');
    const recipientKey = `ratelimit:otp:${userId}:${normalized}`;
    const userKey = `ratelimit:otp:user:${userId}`;
    const client = await this.redis.getClient();
    const allowed = client
      ? await client.eval(
          `local recipient = tonumber(redis.call('GET', KEYS[1]) or '0')
           local user = tonumber(redis.call('GET', KEYS[2]) or '0')
           if recipient >= tonumber(ARGV[1]) or user >= tonumber(ARGV[2]) then return 0 end
           redis.call('INCR', KEYS[1]); redis.call('EXPIRE', KEYS[1], ARGV[3])
           redis.call('INCR', KEYS[2]); redis.call('EXPIRE', KEYS[2], ARGV[3])
           return 1`,
          2,
          recipientKey,
          userKey,
          String(OTP_LIMIT_PER_RECIPIENT),
          String(OTP_LIMIT_PER_USER),
          String(OTP_LIMIT_WINDOW_SECONDS),
        )
      : 1;
    if (Number(allowed) !== 1) {
      throw new HttpException(
        {
          message: 'OTP rate limit exceeded for this recipient. Try again later.',
          retryAfter: OTP_LIMIT_WINDOW_SECONDS,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
}
