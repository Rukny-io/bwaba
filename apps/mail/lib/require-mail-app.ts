import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { isValidMailAppId, MAIL_APP_ID_COOKIE } from "@/lib/mail-app-id";
import { apiFetchJson, requireMailSession } from "@/lib/server-api";
import {
  mailAppOwnerKey,
  redisDel,
  redisGetJson,
  redisSetJson,
} from "@/lib/redis";

export type MailAppSession = {
  userId: string;
  email: string;
  appId: string;
};

/** Short TTL — limits stale ownership after revoke/archive. */
const OWNER_CACHE_TTL_SECONDS = 45;

type RequireOptions = {
  /**
   * Always re-check app ownership via Nest (mutations: create/delete/verify domain).
   * Still requires a cryptographically verified JWT when JWT_SECRET is set.
   */
  fresh?: boolean;
};

type CachedOwner = {
  userId: string;
  email: string;
  tokenFp: string;
};

function readAccessToken(cookieStore: Awaited<ReturnType<typeof cookies>>): string | null {
  return (
    cookieStore.get("access_token")?.value ||
    cookieStore.get("__Secure-access_token")?.value ||
    null
  );
}

export function accessTokenFingerprint(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 24);
}

function ownerCacheKey(appId: string, userId: string) {
  return `${mailAppOwnerKey(appId)}:${userId}`;
}

/**
 * Cryptographic JWT verification only — no unsigned decode path.
 * Fails closed when the token is invalid/expired or (in production) JWT_SECRET is missing.
 */
async function verifyAccessToken(
  token: string,
): Promise<{ userId: string; email: string } | null> {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[mail-auth] JWT_SECRET is required in production");
      return null;
    }
    // Dev without secret: defer to Nest /auth/me (still network-verified).
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (!payload.sub) return null;
    return {
      userId: String(payload.sub),
      email: String(payload.email ?? ""),
    };
  } catch {
    return null;
  }
}

async function assertAppOwnership(appId: string): Promise<boolean> {
  const appResult = await apiFetchJson<{ app: { appId: string } }>(
    `/mail/apps/${encodeURIComponent(appId)}`,
  );
  return appResult.ok;
}

/**
 * Requires a verified session + Mail app cookie owned by that user.
 *
 * - JWT verified with JWT_SECRET (no decode-only).
 * - Ownership Redis cache bound to userId + token fingerprint.
 * - Mutating routes must pass `{ fresh: true }`.
 */
export async function requireMailAppSession(
  options: RequireOptions = {},
): Promise<MailAppSession | null> {
  const jar = await cookies();
  const appId = jar.get(MAIL_APP_ID_COOKIE)?.value ?? "";
  if (!isValidMailAppId(appId)) return null;

  const token = readAccessToken(jar);
  if (!token) return null;

  const verified = await verifyAccessToken(token);

  // No local verify (missing secret in dev, or verify failed): full Nest session only.
  if (!verified) {
    if (process.env.JWT_SECRET?.trim()) {
      // Secret present but token invalid/forged — reject.
      return null;
    }
    const session = await requireMailSession();
    if (!session) return null;
    if (!(await assertAppOwnership(appId))) return null;
    return { ...session, appId };
  }

  const fp = accessTokenFingerprint(token);
  const cacheKey = ownerCacheKey(appId, verified.userId);

  if (!options.fresh) {
    const cached = await redisGetJson<CachedOwner>(cacheKey);
    if (
      cached &&
      cached.userId === verified.userId &&
      cached.tokenFp === fp
    ) {
      return {
        userId: verified.userId,
        email: cached.email || verified.email,
        appId,
      };
    }
  }

  if (!(await assertAppOwnership(appId))) {
    await redisDel(cacheKey);
    return null;
  }

  await redisSetJson(
    cacheKey,
    {
      userId: verified.userId,
      email: verified.email,
      tokenFp: fp,
    } satisfies CachedOwner,
    OWNER_CACHE_TTL_SECONDS,
  );

  return {
    userId: verified.userId,
    email: verified.email,
    appId,
  };
}

/** Clear ownership cache for an app (delete domain / switch app). */
export async function invalidateMailAppOwnerCache(appId: string, userId?: string) {
  if (userId) {
    await redisDel(ownerCacheKey(appId, userId));
    return;
  }
  await redisDel(mailAppOwnerKey(appId));
}

/** Warm ownership cache after a Nest-proven open/login. */
export async function warmMailAppOwnerCache(
  appId: string,
  userId: string,
  email: string,
  accessToken: string,
) {
  await redisSetJson(
    ownerCacheKey(appId, userId),
    {
      userId,
      email,
      tokenFp: accessTokenFingerprint(accessToken),
    } satisfies CachedOwner,
    OWNER_CACHE_TTL_SECONDS,
  );
}
