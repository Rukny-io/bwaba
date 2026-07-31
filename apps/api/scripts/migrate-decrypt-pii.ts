/**
 * 🔓 F-10 — Backfill rollback migration: decrypt existing encrypted PII/token fields and
 * clear blind-index columns.
 *
 * SAFETY:
 *  - DRY-RUN by default. Pass `--apply` to actually write.
 *  - Idempotent: already-plaintext values are skipped.
 *  - Runs with a raw PrismaClient (no encryption middleware) to avoid double
 *    encryption/decryption.
 *  - Batched to avoid long transactions / DB pressure.
 *
 * Usage:
 *   ts-node apps/api/scripts/migrate-decrypt-pii.ts            # dry-run
 *   ts-node apps/api/scripts/migrate-decrypt-pii.ts --apply    # perform writes
 *   ts-node apps/api/scripts/migrate-decrypt-pii.ts --apply --batch 200
 *
 * Prereqs:
 *   - FIELD_ENCRYPTION_KEY and BLIND_INDEX_KEY set (64 hex chars each).
 *   - Keep FIELD_ENCRYPTION_ENABLED unset while running this script.
 */
import { PrismaClient } from '@prisma/client';
import {
  EnvKeyProvider,
  ENCRYPTED_FIELDS,
  decryptValue,
  isEncrypted,
} from '@rukny/database';

const APPLY = process.argv.includes('--apply');
const batchArgIdx = process.argv.indexOf('--batch');
const BATCH_SIZE =
  batchArgIdx > -1 ? Number(process.argv[batchArgIdx + 1]) || 100 : 100;

async function main() {
  const keys = new EnvKeyProvider();
  const prisma = new PrismaClient();
  const cfg = ENCRYPTED_FIELDS.user;

  console.log(
    `\n🔓 PII decryption rollback — mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}, batch: ${BATCH_SIZE}\n`,
  );

  let processed = 0;
  let toUpdate = 0;
  let cursor: string | undefined;

  const selectFields: Record<string, boolean> = { id: true };
  for (const f of cfg.encrypt) selectFields[f] = true;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const users: any[] = await prisma.user.findMany({
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
      select: selectFields,
    });
    if (users.length === 0) break;
    cursor = users[users.length - 1].id;

    for (const user of users) {
      processed++;
      const data: Record<string, any> = {};

      for (const field of cfg.encrypt) {
        const val = user[field];
        if (typeof val !== 'string' || val.length === 0 || !isEncrypted(val)) {
          continue;
        }
        
        // Clear blind index for rollback (if applicable)
        const indexCol = cfg.blindIndex?.[field];
        if (indexCol) data[indexCol] = null;
        
        // Decrypt back to plaintext
        data[field] = decryptValue(val, keys);
      }

      if (Object.keys(data).length === 0) continue;
      toUpdate++;

      if (APPLY) {
        await prisma.user.update({ where: { id: user.id }, data });
      } else if (toUpdate <= 5) {
        console.log(
          `  would decrypt user ${user.id}: [${Object.keys(data).filter((k) => !k.endsWith('Index')).join(', ')}]`,
        );
      }
    }
    process.stdout.write(`  processed=${processed} pending=${toUpdate}\r`);
  }

  console.log(
    `\n\n✅ Done. Scanned ${processed} users; ${toUpdate} ${
      APPLY ? 'updated' : 'would be updated'
    }.`,
  );
  if (!APPLY && toUpdate > 0) {
    console.log('   Re-run with --apply to perform the decryption.\n');
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
