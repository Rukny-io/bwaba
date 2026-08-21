import { redisDel, redisGetJson, redisSetJson } from "@/lib/redis";

export type MailSlotMap = {
  /** slotIndex → appId */
  slots: Record<string, string>;
  /** appId → slotIndex */
  apps: Record<string, number>;
  updatedAt: string;
};

const SLOT_MAP_TTL_SECONDS = 120;

export function mailUserSlotsKey(userId: string) {
  return `mail:user-slots:${userId}`;
}

export async function getCachedUserSlotMap(userId: string): Promise<MailSlotMap | null> {
  return redisGetJson<MailSlotMap>(mailUserSlotsKey(userId));
}

export async function setCachedUserSlotMap(userId: string, map: MailSlotMap) {
  await redisSetJson(mailUserSlotsKey(userId), map, SLOT_MAP_TTL_SECONDS);
}

export async function invalidateUserSlotMap(userId: string) {
  await redisDel(mailUserSlotsKey(userId));
}

export function buildSlotMap(
  apps: { appId: string; slotIndex: number }[],
): MailSlotMap {
  const slots: Record<string, string> = {};
  const byApp: Record<string, number> = {};
  for (const app of apps) {
    slots[String(app.slotIndex)] = app.appId;
    byApp[app.appId] = app.slotIndex;
  }
  return { slots, apps: byApp, updatedAt: new Date().toISOString() };
}

export function resolveAppIdFromSlot(
  map: MailSlotMap,
  slotIndex: number,
): string | null {
  return map.slots[String(slotIndex)] ?? null;
}
