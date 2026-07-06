import { timingSafeEqual } from 'node:crypto';
import type { Prisma } from '@prisma/client';

export const ACTIVE_FORM_FILTER: Prisma.FormWhereInput = {
  deletedAt: null,
};

export function isActiveForm(
  form: { deletedAt?: Date | string | null },
): boolean {
  return form.deletedAt == null;
}

export function secureFormTitleMatch(expected: string, provided: string): boolean {
  const normalizedExpected = expected.normalize('NFC').trim();
  const normalizedProvided = provided.normalize('NFC').trim();
  const a = Buffer.from(normalizedExpected, 'utf8');
  const b = Buffer.from(normalizedProvided, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function sanitizeDeletionReason(reason?: string | null): string | null {
  if (!reason) return null;
  const trimmed = reason.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 500);
}

export function computePurgeDate(retentionDays: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + retentionDays);
  return date;
}
