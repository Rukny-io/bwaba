import { Logger } from '@nestjs/common';
import { RedisService } from '../../core/cache/redis.service';

export async function invalidateMyProductsCache(
  redisService: RedisService,
  userId: string,
  logger?: Logger,
): Promise<void> {
  try {
    await redisService.del(`dashboard:stats:${userId}`);
    const keys = await redisService.keys(`products:my:${userId}:*`);
    for (const key of keys) {
      await redisService.del(key);
    }
  } catch (err) {
    logger?.warn(
      `Redis invalidate products cache: ${(err as Error)?.message || err}`,
    );
  }
}
