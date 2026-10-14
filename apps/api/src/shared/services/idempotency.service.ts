import { ConflictException, Injectable } from '@nestjs/common';
import { RedisService } from '../../core/cache/redis.service';

/**
 * Small shared primitive for one-shot financial and webhook operations.
 * Redis SET NX makes the claim atomic across API instances.
 */
@Injectable()
export class IdempotencyService {
  constructor(private readonly redis: RedisService) {}

  async claim(scope: string, key: string, ttlSeconds = 900): Promise<string> {
    const normalized = key.trim();
    if (normalized.length < 16 || normalized.length > 200) {
      throw new ConflictException('معرف العملية غير صالح');
    }

    const redisKey = `idempotency:${scope}:${normalized}`;
    const claimed = await this.redis.setNX(redisKey, 'claimed', ttlSeconds);
    if (!claimed) {
      throw new ConflictException('العملية قيد التنفيذ أو تم تنفيذها مسبقاً');
    }
    return redisKey;
  }

  async release(redisKey: string): Promise<void> {
    await this.redis.del(redisKey);
  }
}
