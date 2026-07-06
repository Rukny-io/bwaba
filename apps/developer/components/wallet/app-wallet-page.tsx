'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowRightLeft,
  Landmark,
  MessageSquare,
  Plus,
  TrendingUp,
  PiggyBank,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import {
  useAllocateAppWallet,
  useAppWallet,
  useMasterWallet,
} from '@/hooks/use-wallet';
import { DashboardGrid } from '@/components/dashboard/dashboard-ui';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import {
  WalletSectionHeader,
  WalletSummaryRow,
} from '@/components/wallet/wallet-section';
import { formatIqd } from '@/lib/wallet-format';
import { appWhatsapp } from '@/lib/app-routes';
import { appToast } from '@/lib/app-toast';

const SUGGESTED_AMOUNTS = [5000, 10000, 25000];

interface AppWalletPageProps {
  publicAppId: string;
}

function MetricSkeleton() {
  return (
    <div className="dashboard-card h-[7.25rem] animate-pulse rounded-2xl sm:rounded-3xl" />
  );
}

export function AppWalletPage({ publicAppId }: AppWalletPageProps) {
  const t = useTranslations();
  const w = t.wallet;
  const currency = t.dashboard.iqd;
  const isRtl = t.common.switchLang === 'English';

  const { data: masterWallet, isLoading: masterLoading } = useMasterWallet();
  const { data: appWallet, isLoading: appLoading } = useAppWallet(publicAppId);
  const allocateMutation = useAllocateAppWallet(publicAppId);

  const [amount, setAmount] = useState('');

  const numericAmount = useMemo(
    () => Number(amount.replace(/[^\d]/g, '')),
    [amount],
  );

  const appShare = useMemo(() => {
    const total = (masterWallet?.balance ?? 0) + (appWallet?.balance ?? 0);
    if (!total) return 0;
    return Math.round(((appWallet?.balance ?? 0) / total) * 100);
  }, [appWallet?.balance, masterWallet?.balance]);

  const handleAllocate = useCallback(async () => {
    if (!numericAmount || numericAmount <= 0) {
      appToast.error(w.minAmount);
      return;
    }

    if ((masterWallet?.balance ?? 0) < numericAmount) {
      appToast.error(w.insufficient);
      return;
    }

    try {
      await allocateMutation.mutateAsync(numericAmount);
      setAmount('');
      appToast.success(w.success);
    } catch (error) {
      appToast.fromError(error, w.transferFailed);
    }
  }, [allocateMutation, masterWallet?.balance, numericAmount, w]);

  if (masterLoading || appLoading || !masterWallet || !appWallet) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <DashboardGrid>
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
        </DashboardGrid>
        <div className="dashboard-card h-40 animate-pulse rounded-2xl sm:rounded-3xl" />
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="dashboard-card h-80 animate-pulse rounded-2xl sm:rounded-3xl" />
          <div className="dashboard-card h-80 animate-pulse rounded-2xl sm:rounded-3xl" />
        </div>
      </div>
    );
  }

  const progressWidth = Math.max(appShare, appWallet.balance > 0 ? 6 : 0);
  const Chevron = isRtl ? ChevronLeft : ChevronRight;
  const canTransfer =
    !allocateMutation.isPending && numericAmount > 0 && amount.length > 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardGrid>
        <DashboardMetricCard
          icon={Wallet}
          label={w.appBalance}
          value={formatIqd(appWallet.balance, currency)}
          comparisonPrimary={
            appWallet.balance > 0
              ? `${w.allocatedTotal}: ${formatIqd(appWallet.totalAllocated, currency)}`
              : w.emptyApp
          }
        />
        <DashboardMetricCard
          icon={Landmark}
          label={w.mainBalance}
          value={formatIqd(masterWallet.balance, currency)}
          comparisonPrimary={w.availableHint}
          comparisonSecondary={`${w.spentTotal}: ${formatIqd(masterWallet.totalSpent, currency)}`}
        />
        <DashboardMetricCard
          icon={TrendingUp}
          label={w.appShare}
          value={`${appShare}%`}
          comparisonPrimary={w.ofCombinedFunds}
        />
        <DashboardMetricCard
          icon={PiggyBank}
          label={w.allocatedTotal}
          value={formatIqd(appWallet.totalAllocated, currency)}
          comparisonPrimary={`${w.spentTotal}: ${formatIqd(appWallet.totalSpent, currency)}`}
        />
      </DashboardGrid>

      <section className="dashboard-card rounded-2xl p-5 sm:rounded-3xl sm:p-6">
        <WalletSectionHeader
          icon={TrendingUp}
          title={w.distributionTitle}
          description={w.distributionDesc}
        />

        <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all duration-500 ease-out"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--muted-foreground)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[var(--primary)]" />
                {w.appBalance}
                <span dir="ltr" lang="en" className="font-medium text-[var(--foreground)]">
                  {formatIqd(appWallet.balance, currency)}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[var(--muted-foreground)]/35" />
                {w.mainBalance}
                <span dir="ltr" lang="en" className="font-medium text-[var(--foreground)]">
                  {formatIqd(masterWallet.balance, currency)}
                </span>
              </span>
            </div>
          </div>
          <p
            className="w-full rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-center text-xs font-medium text-[var(--muted-foreground)] sm:w-auto sm:shrink-0 sm:text-start"
            dir="ltr"
            lang="en"
          >
            {w.activeInApp.replace(
              '{amount}',
              formatIqd(appWallet.balance, currency),
            )}
          </p>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="dashboard-card rounded-2xl p-5 sm:rounded-3xl sm:p-6">
          <WalletSectionHeader
            icon={ArrowRightLeft}
            title={w.transferTitle}
            description={w.transferDesc}
          />

          <p className="mb-4 text-xs text-[var(--muted-foreground)]">
            {(w.availableBalance ?? 'Available: {amount}').replace(
              '{amount}',
              formatIqd(masterWallet.balance, currency),
            )}
          </p>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="allocate-amount"
                className="mb-1.5 block text-xs font-medium text-[var(--foreground)]"
              >
                {w.amount}
              </label>
              <input
                id="allocate-amount"
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value.replace(/[^\d]/g, ''));
                }}
                placeholder="5000"
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 font-mono text-sm text-[var(--foreground)] transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_20%,transparent)]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {SUGGESTED_AMOUNTS.map((value) => {
                const selected = amount === String(value);
                const disabled = value > masterWallet.balance;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={disabled}
                    onClick={() => setAmount(String(value))}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      selected
                        ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]'
                        : 'border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--foreground)] hover:border-[color-mix(in_srgb,var(--primary)_25%,var(--border))]'
                    }`}
                    dir="ltr"
                    lang="en"
                  >
                    {formatIqd(value, currency)}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => void handleAllocate()}
              disabled={!canTransfer}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50 sm:w-auto"
            >
              <Plus className="size-4" />
              {allocateMutation.isPending ? w.transferring : w.transfer}
            </button>
          </div>
        </section>

        <section className="dashboard-card rounded-2xl p-5 sm:rounded-3xl sm:p-6">
          <WalletSectionHeader
            icon={MessageSquare}
            title={w.quickLinks}
            description={w.quickLinksDesc}
          />

          <div className="space-y-2">
            <Link
              href={appWhatsapp(publicAppId)}
              className="dashboard-card group flex items-center gap-3 rounded-xl p-3 transition-shadow hover:shadow-md"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)] text-[var(--primary)] group-hover:bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))]">
                <MessageSquare className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--primary)]">
                  {w.whatsappSetup}
                </span>
              </span>
              <Chevron className="size-4 shrink-0 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>

            <div className="mt-4 space-y-2">
              <WalletSummaryRow
                label={w.mainBalance}
                value={formatIqd(masterWallet.balance, currency)}
              />
              <WalletSummaryRow
                label={w.appBalance}
                value={formatIqd(appWallet.balance, currency)}
              />
              <WalletSummaryRow
                label={w.allocatedTotal}
                value={formatIqd(appWallet.totalAllocated, currency)}
              />
              <WalletSummaryRow
                label={w.spentTotal}
                value={formatIqd(appWallet.totalSpent, currency)}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
