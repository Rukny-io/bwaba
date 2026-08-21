import { promises as fs } from "node:fs";
import path from "node:path";
import type { MailDomainStatus } from "@/lib/mail-domain";
import {
  redisGetJson,
  redisSetJsonPersist,
} from "@/lib/redis";

export type MailDomainBinding = {
  domain: string;
  status: MailDomainStatus;
  updatedAt: string;
  /** Cached Easy DKIM tokens from the last SES check (avoids SES on hot path). */
  dkimTokens?: string[];
  /** ISO time of last successful SES status read used for this binding. */
  sesCheckedAt?: string;
};

/** Keyed by Mail appId — one domain per app; domains are unique across apps. */
type BindingMap = Record<string, MailDomainBinding>;

const REDIS_BINDINGS_KEY = "mail:domain-bindings";
const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "mail-domain-bindings.json");

async function readFileMap(): Promise<BindingMap> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as BindingMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeFileMap(map: BindingMap) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, `${JSON.stringify(map, null, 2)}\n`, "utf8");
}

async function readMap(): Promise<BindingMap> {
  const fromRedis = await redisGetJson<BindingMap>(REDIS_BINDINGS_KEY);
  if (fromRedis && typeof fromRedis === "object") {
    return fromRedis;
  }

  // One-time migrate from local file (dev / pre-Redis deploys).
  const fromFile = await readFileMap();
  if (Object.keys(fromFile).length > 0) {
    await redisSetJsonPersist(REDIS_BINDINGS_KEY, fromFile);
  }
  return fromFile;
}

async function writeMap(map: BindingMap) {
  const saved = await redisSetJsonPersist(REDIS_BINDINGS_KEY, map);
  // Keep a local copy when Redis is down (single-node fallback).
  if (!saved) {
    await writeFileMap(map);
  }
}

export async function getMailDomainBinding(mailAppId: string): Promise<MailDomainBinding | null> {
  const map = await readMap();
  return map[mailAppId] ?? null;
}

/** Returns the Mail appId that already owns this domain, if any. */
export async function findMailAppIdByDomain(domain: string): Promise<string | null> {
  const normalized = domain.trim().toLowerCase();
  if (!normalized) return null;
  const map = await readMap();
  for (const [appId, binding] of Object.entries(map)) {
    if (binding.domain === normalized) return appId;
  }
  return null;
}

export async function upsertMailDomainBinding(
  mailAppId: string,
  binding: Pick<MailDomainBinding, "domain" | "status" | "dkimTokens" | "sesCheckedAt">,
) {
  const domain = binding.domain.trim().toLowerCase();
  const map = await readMap();

  const owner = Object.entries(map).find(
    ([id, row]) => row.domain === domain && id !== mailAppId,
  );
  if (owner) {
    throw new Error(
      `Domain ${domain} is already connected to another Mail app (${owner[0]}).`,
    );
  }

  const previous = map[mailAppId];
  const next: MailDomainBinding = {
    domain,
    status: binding.status,
    updatedAt: new Date().toISOString(),
    dkimTokens: binding.dkimTokens ?? previous?.dkimTokens,
    sesCheckedAt: binding.sesCheckedAt ?? previous?.sesCheckedAt,
  };

  // Skip write when nothing meaningful changed.
  if (
    previous &&
    previous.domain === next.domain &&
    previous.status === next.status &&
    JSON.stringify(previous.dkimTokens ?? []) === JSON.stringify(next.dkimTokens ?? [])
  ) {
    return previous;
  }

  map[mailAppId] = next;
  await writeMap(map);
  return map[mailAppId];
}

export async function deleteMailDomainBinding(mailAppId: string) {
  const map = await readMap();
  if (!(mailAppId in map)) return;
  delete map[mailAppId];
  await writeMap(map);
}

/**
 * If the same domain was wrongly attached to multiple apps, keep the oldest
 * binding and drop the rest so each remaining app starts clean.
 */
export async function dedupeDomainBindings(): Promise<string[]> {
  const map = await readMap();
  const byDomain = new Map<string, { appId: string; updatedAt: string }[]>();

  for (const [appId, binding] of Object.entries(map)) {
    const domain = binding.domain.toLowerCase();
    const list = byDomain.get(domain) ?? [];
    list.push({ appId, updatedAt: binding.updatedAt });
    byDomain.set(domain, list);
  }

  const clearedAppIds: string[] = [];
  for (const [, owners] of byDomain) {
    if (owners.length < 2) continue;
    owners.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    for (const extra of owners.slice(1)) {
      delete map[extra.appId];
      clearedAppIds.push(extra.appId);
    }
  }

  if (clearedAppIds.length > 0) {
    await writeMap(map);
  }
  return clearedAppIds;
}
