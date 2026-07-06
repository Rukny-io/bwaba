import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../core/cache/redis.service';
import { CacheKeys } from '../../../core/cache/cache.constants';

const FORM_CACHE_VERSION = 'v2';

@Injectable()
export class FormsCacheService {
  constructor(private readonly redis: RedisService) {}

  formBySlugKey(slug: string): string {
    return `${CacheKeys.formBySlug(slug)}:${FORM_CACHE_VERSION}`;
  }

  publicFormsKey(username: string, limit: number): string {
    return `${CacheKeys.publicFormsByUsername(username)}:${limit}:${FORM_CACHE_VERSION}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.redis.get<string>(key);
      if (!raw) return null;
      if (typeof raw === 'string') {
        return JSON.parse(raw) as T;
      }
      return raw as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), ttlSeconds);
    } catch {
      /* non-blocking */
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch {
      /* non-blocking */
    }
  }

  async invalidateForm(opts: {
    slug?: string | null;
    userId?: string | null;
    username?: string | null;
  }): Promise<void> {
    if (opts.slug) {
      await this.del(this.formBySlugKey(opts.slug));
    }
    if (opts.userId) {
      await this.del(CacheKeys.dashboardStats(opts.userId));
    }
    if (opts.username) {
      for (const limit of [10, 20, 50]) {
        await this.del(this.publicFormsKey(opts.username, limit));
      }
    }
  }
}
