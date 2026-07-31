/**
 * 🔒 F-10 — Backfill migration: encrypt existing plaintext PII/token fields and
 * populate blind-index columns.
 *
 * SAFETY:
 *  - DRY-RUN by default. Pass `--apply` to actually write.
 *  - Idempotent: already-encrypted values are skipped.
 *  - Runs with a raw PrismaClient (no encryption middleware) to avoid double
 *    encryption, writing envelopes explicitly.
 *  - Batched to avoid long transactions / DB pressure.
 *
 * Usage:
 *   ts-node apps/api/scripts/migrate-encrypt-pii.ts            # dry-run
 *   ts-node apps/api/scripts/migrate-encrypt-pii.ts --apply    # perform writes
 *   ts-node apps/api/scripts/migrate-encrypt-pii.ts --apply --batch 200
 *
 * Prereqs:
 *   - FIELD_ENCRYPTION_KEY and BLIND_INDEX_KEY set (64 hex chars each).
 *   - `emailBlindIndex` column migrated into the DB.
 *   - Keep FIELD_ENCRYPTION_ENABLED unset while running this script.
 */
import { PrismaClient } from '@prisma/client';
import {
  EnvKeyProvider,
  ENCRYPTED_FIELDS,
  blindIndex,
  encryptValue,
  isEncrypted,
} from '@rukny/database';

const APPLY = process.argv.includes('--apply');
const batchArgIdx = process.argv.indexOf('--batch');
const BATCH_SIZE =
  batchArgIdx > -1 ? Number(process.argv[batchArgIdx + 1]) || 100 : 100;

/**
 * Encrypt configured fields for a single model (keyed by its Prisma delegate name).
 * Uses id-cursor pagination and is idempotent (skips already-encrypted envelopes).
 */
async function migrateModel(
  prisma: PrismaClient,
  keys: EnvKeyProvider,
  modelKey: string,
  cfg: { encrypt: string[]; blindIndex?: Record<string, string> },
): Promise<{ processed: number; updated: number }> {
  const delegate = (prisma as any)[modelKey];
  if (!delegate || typeof delegate.findMany !== 'function') {
    console.warn(`  ⚠️  Skipping "${modelKey}" — no matching Prisma delegate.`);
    return { processed: 0, updated: 0 };
  }

  // Fields we can safely read raw (they still hold plaintext or envelopes).
  const selectFields: Record<string, boolean> = { id: true };
  for (const f of cfg.encrypt) selectFields[f] = true;

  let processed = 0;
  let toUpdate = 0;
  let cursor: string | undefined;

  console.log(`\n▶ ${modelKey} — fields: [${cfg.encrypt.join(', ')}]`);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const rows: any[] = await delegate.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
      select: selectFields,
    });
    if (rows.length === 0) break;
    cursor = rows[rows.length - 1].id;

    for (const row of rows) {
      processed++;
      const data: Record<string, string> = {};

      for (const field of cfg.encrypt) {
        const val = row[field];
        if (typeof val !== 'string' || val.length === 0 || isEncrypted(val)) {
          continue;
        }
        const indexCol = cfg.blindIndex?.[field];
        if (indexCol) data[indexCol] = blindIndex(val, keys);
        data[field] = encryptValue(val, keys);
      }

      if (Object.keys(data).length === 0) continue;
      toUpdate++;

      if (APPLY) {
        await delegate.update({ where: { id: row.id }, data });
      } else if (toUpdate <= 5) {
        console.log(
          `  would encrypt ${modelKey} ${row.id}: [${Object.keys(data).join(', ')}]`,
        );
      }
    }
    process.stdout.write(`  processed=${processed} pending=${toUpdate}\r`);
  }

  console.log(
    `\n  ✅ ${modelKey}: scanned ${processed}; ${toUpdate} ${
      APPLY ? 'updated' : 'would be updated'
    }.`,
  );
  return { processed, updated: toUpdate };
}

async function main() {
  const keys = new EnvKeyProvider();
  const prisma = new PrismaClient();

  console.log(
    `\n🔒 PII/token encryption backfill — mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}, batch: ${BATCH_SIZE}`,
  );
  console.log(`   Models: ${Object.keys(ENCRYPTED_FIELDS).join(', ')}`);

  let totalProcessed = 0;
  let totalUpdated = 0;

  // Iterate every configured model so social OAuth tokens (F2-03) are backfilled
  // alongside user PII (F-10).
  for (const [modelKey, cfg] of Object.entries(ENCRYPTED_FIELDS)) {
    const { processed, updated } = await migrateModel(
      prisma,
      keys,
      modelKey,
      cfg,
    );
    totalProcessed += processed;
    totalUpdated += updated;
  }

  console.log(
    `\n\n✅ Done. Scanned ${totalProcessed} rows across ${
      Object.keys(ENCRYPTED_FIELDS).length
    } model(s); ${totalUpdated} ${APPLY ? 'updated' : 'would be updated'}.`,
  );
  if (!APPLY && totalUpdated > 0) {
    console.log('   Re-run with --apply to perform the encryption.\n');
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
