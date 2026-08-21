type RedisClient = {
  status: string;
  get: (key: string) => Promise<string | null>;
  set: (
    key: string,
    value: string,
    mode: "EX",
    ttl: number,
  ) => Promise<unknown>;
  del: (...keys: string[]) => Promise<unknown>;
  on: (event: string, listener: (...args: unknown[]) => void) => unknown;
};

type RedisCtor = new (
  url: string,
  opts: Record<string, unknown>,
) => RedisClient;

/**
 * Shared Redis (same REDIS_URL as Nest API) for Mail SES/setup/session caching.
 * Graceful no-op when Redis or ioredis is unavailable — callers fall through.
 */
let client: RedisClient | null | undefined;
let RedisClass: RedisCtor | null | undefined;

function loadRedisCtor(): RedisCtor | null {
  if (RedisClass !== undefined) return RedisClass;
  try {
    // Externalized via next.config serverExternalPackages — avoid bundling CJS tree.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("ioredis") as { default?: RedisCtor } | RedisCtor;
    RedisClass = typeof mod === "function" ? mod : (mod.default ?? null);
    return RedisClass;
  } catch {
    RedisClass = null;
    return null;
  }
}

function resolveRedisUrl() {
  return process.env.REDIS_URL?.trim() || "";
}

export function getMailRedis(): RedisClient | null {
  const url = resolveRedisUrl();
  if (!url) {
    if (process.env.NODE_ENV !== "production") {
      const g = globalThis as { __mailRedisWarned?: boolean };
      if (!g.__mailRedisWarned) {
        g.__mailRedisWarned = true;
        console.warn("[mail-redis] REDIS_URL is not set — SES/setup cache disabled");
      }
    }
    return null;
  }

  if (client !== undefined) return client;

  const Ctor = loadRedisCtor();
  if (!Ctor) {
    client = null;
    if (process.env.NODE_ENV !== "production") {
      console.warn("[mail-redis] ioredis unavailable — SES/setup cache disabled");
    }
    return null;
  }

  try {
    client = new Ctor(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      enableOfflineQueue: false,
      lazyConnect: false,
      connectTimeout: 1500,
      retryStrategy: (times: number) =>
        times > 3 ? null : Math.min(times * 100, 800),
    });
    client.on("error", () => {
      // Avoid crashing Next on Redis blips; get/set helpers treat as miss.
    });
    return client;
  } catch {
    client = null;
    return null;
  }
}

export async function redisGetJson<T>(key: string): Promise<T | null> {
  const redis = getMailRedis();
  if (!redis) return null;
  try {
    if (redis.status !== "ready" && redis.status !== "connecting") return null;
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function redisSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  const redis = getMailRedis();
  if (!redis) return;
  try {
    if (redis.status !== "ready" && redis.status !== "connecting") return;
    await redis.set(key, JSON.stringify(value), "EX", Math.max(1, ttlSeconds));
  } catch {
    // ignore
  }
}

export async function redisDel(...keys: string[]): Promise<void> {
  const redis = getMailRedis();
  if (!redis || keys.length === 0) return;
  try {
    if (redis.status !== "ready" && redis.status !== "connecting") return;
    await redis.del(...keys);
  } catch {
    // ignore
  }
}

export function mailSesStatusKey(domain: string) {
  return `mail:ses-status:${domain.trim().toLowerCase()}`;
}

export function mailSetupCacheKey(appId: string) {
  return `mail:setup:${appId}`;
}

export function mailAppOwnerKey(appId: string) {
  return `mail:app-owner:${appId}`;
}
