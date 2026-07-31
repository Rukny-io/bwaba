/**
 * 🔒 F-10 — Prisma middleware for transparent field-level encryption.
 *
 * Responsibilities:
 *  1. WRITE: encrypt configured fields in `args.data` and populate blind-index
 *     columns for searchable fields (create/update/upsert/*Many).
 *  2. WHERE: rewrite equality filters on encrypted searchable fields to their
 *     blind-index column (so lookups keep working) — including findUnique.
 *  3. READ: decrypt configured fields in returned records.
 *
 * Deliberately conservative: only top-level `data`/`where` on the model itself
 * are transformed. Nested writes/relations should be encrypted at their own
 * model boundary (each model is handled when its query runs).
 *
 * NOTE: enabling this requires (a) the blind-index columns to exist in the
 * schema, and (b) existing rows to be backfilled — see
 * apps/api/scripts/migrate-encrypt-pii.ts. It is gated by FIELD_ENCRYPTION_ENABLED.
 */
import type { KeyProvider } from './key-provider';
import { blindIndex, decryptValue, encryptValue, isEncrypted } from './field-crypto';
import { getModelConfig, ModelEncryptionConfig } from './encrypted-fields';

type MiddlewareParams = {
  model?: string;
  action: string;
  args: any;
};
type NextFn = (params: MiddlewareParams) => Promise<any>;

const WRITE_ACTIONS = new Set([
  'create',
  'update',
  'upsert',
  'createMany',
  'updateMany',
]);

function encryptData(
  data: any,
  cfg: ModelEncryptionConfig,
  keys: KeyProvider,
): void {
  if (!data || typeof data !== 'object') return;
  for (const field of cfg.encrypt) {
    const val = data[field];
    if (typeof val !== 'string' || val.length === 0 || isEncrypted(val)) {
      continue;
    }
    // Populate blind index BEFORE encrypting (needs plaintext).
    const indexCol = cfg.blindIndex?.[field];
    if (indexCol) data[indexCol] = blindIndex(val, keys);
    data[field] = encryptValue(val, keys);
  }
}

function rewriteWhere(
  where: any,
  cfg: ModelEncryptionConfig,
  keys: KeyProvider,
): void {
  if (!where || typeof where !== 'object' || !cfg.blindIndex) return;
  for (const [field, indexCol] of Object.entries(cfg.blindIndex)) {
    if (!(field in where)) continue;
    const cond = where[field];
    if (typeof cond === 'string') {
      where[indexCol] = blindIndex(cond, keys);
      delete where[field];
    } else if (cond && typeof cond === 'object' && typeof cond.equals === 'string') {
      where[indexCol] = blindIndex(cond.equals, keys);
      delete where[field];
    } else if (cond && typeof cond === 'object' && Array.isArray(cond.in)) {
      where[indexCol] = { in: cond.in.map((v: string) => blindIndex(v, keys)) };
      delete where[field];
    }
    // Non-equality operators (contains/startsWith) cannot use a blind index.
  }
}

function decryptRecord(
  record: any,
  cfg: ModelEncryptionConfig,
  keys: KeyProvider,
): void {
  if (!record || typeof record !== 'object') return;
  for (const field of cfg.encrypt) {
    const val = record[field];
    if (typeof val === 'string' && isEncrypted(val)) {
      record[field] = decryptValue(val, keys);
    }
  }
}

export function createEncryptionMiddleware(keys: KeyProvider) {
  return async function encryptionMiddleware(
    params: MiddlewareParams,
    next: NextFn,
  ): Promise<any> {
    const cfg = getModelConfig(params.model);
    if (!cfg) return next(params);

    const args = params.args || {};

    // 1) WHERE rewrite (reads, updates, deletes, upsert.where)
    if (args.where) rewriteWhere(args.where, cfg, keys);

    // 2) WRITE encryption
    if (WRITE_ACTIONS.has(params.action) && args.data) {
      if (Array.isArray(args.data)) {
        for (const row of args.data) encryptData(row, cfg, keys);
      } else {
        encryptData(args.data, cfg, keys);
        // upsert carries create + update payloads
        if (args.data.create) encryptData(args.data.create, cfg, keys);
        if (args.data.update) encryptData(args.data.update, cfg, keys);
      }
    }
    if (params.action === 'upsert') {
      if (args.create) encryptData(args.create, cfg, keys);
      if (args.update) encryptData(args.update, cfg, keys);
    }

    const result = await next(params);

    // 3) READ decryption
    if (Array.isArray(result)) {
      for (const row of result) decryptRecord(row, cfg, keys);
    } else if (result && typeof result === 'object') {
      decryptRecord(result, cfg, keys);
    }

    return result;
  };
}
