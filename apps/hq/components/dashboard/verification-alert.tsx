import Link from 'next/link';
import { AlertCircle, ArrowRight } from 'lucide-react';
import type { VerificationStats } from '@/lib/types/admin';
import { formatNumber } from '@/lib/dashboard-format';

export function VerificationAlert({
  stats,
}: {
  stats: VerificationStats;
}) {
  const pending = stats.byStatus.pending;
  if (pending <= 0) return null;

  return (
    <Link
      href="/app/users"
      className="dashboard-card flex items-center gap-3 rounded-2xl border-[var(--warning)]/30 bg-[var(--warning)]/10 p-4 transition-opacity hover:opacity-90 sm:rounded-3xl sm:p-5"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--warning)]/20 text-[var(--warning)]">
        <AlertCircle className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {formatNumber(pending)} verification requests awaiting review
        </p>
        <p className="text-xs text-[var(--muted-foreground)]">
          Review requests from each user&apos;s Verification tab — {formatNumber(stats.today)}{' '}
          new today
        </p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-[var(--muted-foreground)]" />
    </Link>
  );
}
