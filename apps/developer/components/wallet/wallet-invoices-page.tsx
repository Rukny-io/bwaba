'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { useWalletTransactions } from '@/hooks/use-wallet';
import { WalletSectionHeader } from '@/components/wallet/wallet-section';
import { walletPanelClass } from '@/components/wallet/wallet-ui';
import { formatIqd } from '@/lib/wallet-format';
import { appWallet } from '@/lib/app-routes';
import type { WalletTransactionStatus, WalletTransactionType } from '@/lib/api/types';

function formatTxDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-IQ' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function txTypeLabel(
  type: WalletTransactionType,
  labels: Record<string, string>,
): string {
  return labels[type] ?? type;
}

function txStatusLabel(
  status: WalletTransactionStatus,
  labels: Record<string, string>,
): string {
  return labels[status] ?? status;
}

export function WalletInvoicesPage({ publicAppId }: { publicAppId: string }) {
  const t = useTranslations();
  const w = t.wallet;
  const currency = t.dashboard.iqd;
  const isRtl = t.common.switchLang === 'English';
  const locale = isRtl ? 'ar' : 'en';
  const BackChevron = isRtl ? ChevronRight : ChevronLeft;

  const { data, isLoading, isError, refetch } = useWalletTransactions(1, 30);
  const transactions = data?.data ?? [];

  const typeLabels = (w.txTypes ?? {}) as Record<string, string>;
  const statusLabels = (w.txStatuses ?? {}) as Record<string, string>;

  return (
    <div className="dashboard-section-stack">
      <Link
        href={appWallet(publicAppId)}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
      >
        <BackChevron className="size-4 shrink-0" aria-hidden />
        {w.backToWallet}
      </Link>

      <section className={walletPanelClass}>
        <WalletSectionHeader
          icon={Receipt}
          title={w.invoicesTitle}
          description={w.invoicesDesc}
        />

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-[var(--surface-secondary)]"
              />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,var(--background))] px-4 py-3 text-sm text-[var(--foreground)]">
            <p>{w.invoicesLoadError}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-2 text-xs font-semibold text-[var(--primary)]"
            >
              {w.invoicesRetry}
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <p className="rounded-2xl border border-[color-mix(in_srgb,var(--border)_55%,transparent)] bg-[var(--background)] px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
            {w.invoicesEmpty}
          </p>
        ) : (
          <div
            className="overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--border)_55%,transparent)] bg-[var(--background)]"
          >
            <ul className="divide-y divide-[color-mix(in_srgb,var(--border)_55%,transparent)]">
              {transactions.map((tx) => (
                <li
                  key={tx.id}
                  className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {txTypeLabel(tx.type, typeLabels)}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      {formatTxDate(tx.createdAt, locale)}
                    </p>
                    {tx.description ? (
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        {tx.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-end sm:shrink-0">
                    <p
                      className="text-sm font-semibold tabular-nums text-[var(--foreground)]"
                      dir="ltr"
                      lang="en"
                    >
                      {formatIqd(tx.amount, currency)}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-[var(--muted-foreground)]">
                      {txStatusLabel(tx.status, statusLabels)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
