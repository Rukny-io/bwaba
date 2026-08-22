import type { PrismaService } from '../../core/database/prisma/prisma.service';
import type { MailPlan } from '@prisma/client';
import { MAIL_PLAN_LIMITS } from './mail-plan-limits.config';

export const BYTES_PER_GB = 1024 ** 3;

export function storageQuotaBytesForPlan(plan: MailPlan): number {
  return MAIL_PLAN_LIMITS[plan].storageGbPerMailbox * BYTES_PER_GB;
}

export function utf8StorageBytes(
  ...parts: Array<string | null | undefined>
): number {
  return parts.reduce(
    (sum, part) => sum + Buffer.byteLength(part || '', 'utf8'),
    0,
  );
}

export async function incrementMailboxStorage(
  prisma: PrismaService,
  mailboxId: string,
  bytes: number,
) {
  if (!Number.isFinite(bytes) || bytes <= 0) return;
  await prisma.mailMailbox.update({
    where: { id: mailboxId },
    data: { storageUsedBytes: { increment: BigInt(Math.floor(bytes)) } },
  });
}
