'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { CreditCard, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { useMasterWallet } from '@/hooks/use-wallet';
import { WalletSectionHeader } from '@/components/wallet/wallet-section';
import {
  ownerNoticeClass,
  TOP_UP_AMOUNTS,
  walletChipClass,
  walletPanelClass,
} from '@/components/wallet/wallet-ui';
import { formatIqd } from '@/lib/wallet-format';
import { appWallet } from '@/lib/app-routes';
import { useIsWorkspaceOwner } from '@/components/workspace/workspace-role-provider';
import { redirectToDeveloperCheckout } from '@/lib/developer-checkout';
import { appToast } from '@/lib/app-toast';
import { WalletTopUpConfirmDialog } from '@/components/wallet/wallet-top-up-confirm-dialog';

const TOP_UP_MIN = 1_000;
const TOP_UP_MAX = 5_000_000;

export function WalletTopUpPage({ publicAppId }: { publicAppId: string }) {
  const t = useTranslations();
  const w = t.wallet;
  const currency = t.dashboard.iqd;
  const isRtl = t.common.switchLang === 'English';
  const BackChevron = isRtl ? ChevronRight : ChevronLeft;

  const { data: masterWallet } = useMasterWallet();
  const isOwner = useIsWorkspaceOwner();
  const [customAmount, setCustomAmount] = useState('');
  const [topUpBusy, setTopUpBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);

  const numericCustomAmount = useMemo(
    () => Number(customAmount.replace(/[^\d]/g, '')),
    [customAmount],
  );

  const handleTopUp = useCallback(
    async (amount: number) => {
      if (!isOwner || topUpBusy) return;
      if (!Number.isFinite(amount) || amount < TOP_UP_MIN) {
        appToast.error(w.topUpMinAmount);
        return;
      }
      if (amount > TOP_UP_MAX) {
        appToast.error(w.topUpMaxAmount);
        return;
      }
      setTopUpBusy(true);
      try {
        await redirectToDeveloperCheckout({
          kind: 'WALLET_TOPUP',
          amount,
          appId: publicAppId,
        });
      } catch (error) {
        appToast.fromError(error, w.topUpFailed);
        setTopUpBusy(false);
      }
    },
    [isOwner, publicAppId, topUpBusy, w.topUpFailed, w.topUpMinAmount, w.topUpMaxAmount],
  );

  const requestTopUpConfirm = useCallback(
    (amount: number) => {
      if (!isOwner || topUpBusy) return;
      if (!Number.isFinite(amount) || amount < TOP_UP_MIN) {
        appToast.error(w.topUpMinAmount);
        return;
      }
      if (amount > TOP_UP_MAX) {
        appToast.error(w.topUpMaxAmount);
        return;
      }
      setPendingAmount(amount);
      setConfirmOpen(true);
    },
    [isOwner, topUpBusy, w.topUpMaxAmount, w.topUpMinAmount],
  );

  const handleCustomTopUp = useCallback(() => {
    if (!numericCustomAmount || numericCustomAmount <= 0) {
      appToast.error(w.minAmount);
      return;
    }
    requestTopUpConfirm(numericCustomAmount);
  }, [numericCustomAmount, requestTopUpConfirm, w.minAmount]);

  const handleConfirmTopUp = useCallback(() => {
    if (pendingAmount == null) return;
    void handleTopUp(pendingAmount);
  }, [handleTopUp, pendingAmount]);

  const canCustomTopUp =
    isOwner &&
    !topUpBusy &&
    numericCustomAmount >= TOP_UP_MIN &&
    numericCustomAmount <= TOP_UP_MAX;

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
          icon={CreditCard}
          title={w.topUpTitle}
          description={w.topUpDesc}
        />
        <p className="mb-4 text-xs text-[var(--muted-foreground)]">
          {(w.availableBalance ?? 'Available: {amount}').replace(
            '{amount}',
            formatIqd(masterWallet?.balance ?? 0, currency),
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {TOP_UP_AMOUNTS.map((value) => {
            const selected = customAmount === String(value);
            return (
              <button
                key={value}
                type="button"
                disabled={!isOwner || topUpBusy}
                onClick={() => {
                  setCustomAmount(String(value));
                  requestTopUpConfirm(value);
                }}
                className={`${walletChipClass} ${
                  selected
                    ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_12%,var(--background))] text-[var(--primary)]'
                    : ''
                }`}
                dir="ltr"
                lang="en"
              >
                {formatIqd(value, currency)}
              </button>
            );
          })}
        </div>

        <div className="mt-6 border-t border-[color-mix(in_srgb,var(--border)_55%,transparent)] pt-5">
          <p className="mb-1.5 text-xs font-medium text-[var(--foreground)]">
            {w.topUpCustomTitle}
          </p>
          <p className="mb-3 text-xs text-[var(--muted-foreground)]">
            {w.topUpCustomHint}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <label
                htmlFor="top-up-amount"
                className="mb-1.5 block text-xs font-medium text-[var(--foreground)]"
              >
                {w.amount}
              </label>
              <input
                id="top-up-amount"
                type="text"
                inputMode="numeric"
                dir="ltr"
                value={customAmount}
                onChange={(event) => {
                  setCustomAmount(event.target.value.replace(/[^\d]/g, ''));
                }}
                placeholder="10000"
                disabled={!isOwner || topUpBusy}
                className="h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 font-mono text-sm text-[var(--foreground)] transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_20%,transparent)] disabled:opacity-50"
              />
            </div>
            <button
              type="button"
              onClick={handleCustomTopUp}
              disabled={!canCustomTopUp}
              className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50 sm:min-w-[10rem]"
            >
              <Plus className="size-4" />
              {topUpBusy ? w.topUpContinuing : w.topUpCustomAction}
            </button>
          </div>
        </div>

        {!isOwner ? (
          <p className={`mt-3 ${ownerNoticeClass}`}>{w.ownerOnlyTopUp}</p>
        ) : null}
      </section>

      <section className={walletPanelClass}>
        <WalletSectionHeader
          icon={CreditCard}
          title={w.topUpHowTitle}
          description={w.topUpHowDesc}
        />
        <ol className="list-decimal space-y-2 ps-5 text-[13px] leading-relaxed text-[var(--muted-foreground)] sm:text-sm">
          <li>{w.topUpStep1}</li>
          <li>{w.topUpStep2}</li>
          <li>{w.topUpStep3}</li>
        </ol>
      </section>

      <WalletTopUpConfirmDialog
        open={confirmOpen}
        amount={pendingAmount}
        isPending={topUpBusy}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open && !topUpBusy) {
            setPendingAmount(null);
          }
        }}
        onConfirm={handleConfirmTopUp}
      />
    </div>
  );
}
