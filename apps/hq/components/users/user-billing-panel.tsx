'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@heroui/react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import { formatCurrency, formatNumber } from '@/lib/dashboard-format';
import { formatUserDateTime } from '@/lib/users-format';
import type {
  BillingCycle,
  SubscriptionPlan,
  UserBillingResponse,
} from '@/lib/types/billing';
import { FilterDropdown } from '@/components/shared/filter-dropdown';
import { detailPanelClassName } from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

const PLAN_OPTIONS = [
  { value: 'FREE', label: 'Free' },
  { value: 'PRO', label: 'Pro' },
  { value: 'WHALE', label: 'Whale' },
  { value: 'BUSINESS', label: 'Business' },
] as const;

const CYCLE_OPTIONS = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
] as const;

function planLabel(plan: SubscriptionPlan): string {
  return PLAN_OPTIONS.find((o) => o.value === plan)?.label ?? plan;
}

function statusClass(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-[var(--success)]/15 text-[var(--success)]';
    case 'CANCELLED':
    case 'EXPIRED':
      return 'bg-[var(--warning)]/15 text-[var(--warning)]';
    case 'PAST_DUE':
      return 'bg-[var(--danger)]/15 text-[var(--danger)]';
    default:
      return 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]';
  }
}

function paymentStatusClass(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'text-[var(--success)]';
    case 'FAILED':
    case 'REFUNDED':
      return 'text-[var(--danger)]';
    default:
      return 'text-[var(--muted-foreground)]';
  }
}

export function UserBillingPanel({ userId }: { userId: string }) {
  const [billing, setBilling] = useState<UserBillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planDraft, setPlanDraft] = useState<SubscriptionPlan>('FREE');
  const [cycleDraft, setCycleDraft] = useState<BillingCycle>('MONTHLY');

  const loadBilling = useCallback(async () => {
    setLoading(true);
    try {
      const data = await hqApi.getUserBilling(userId);
      setBilling(data);
      setPlanDraft(data.subscription?.plan ?? 'FREE');
      setCycleDraft(data.subscription?.billingCycle ?? 'MONTHLY');
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not load billing',
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadBilling();
  }, [loadBilling]);

  async function handleSavePlan() {
    setSaving(true);
    try {
      await hqApi.setUserPlan(
        userId,
        planDraft,
        planDraft === 'FREE' ? undefined : cycleDraft,
      );
      appToast.success('Subscription plan updated');
      await loadBilling();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not update plan',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="size-7 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const subscription = billing?.subscription;
  const currentPlan = subscription?.plan ?? 'FREE';

  return (
    <div className="space-y-4">
      <section className={detailPanelClassName}>
        <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
          Subscription
        </h2>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-2xl bg-[var(--surface-secondary)] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-semibold">{planLabel(currentPlan)}</span>
              {subscription ? (
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                    statusClass(subscription.status),
                  )}
                >
                  {subscription.status}
                </span>
              ) : (
                <span className="rounded-full bg-[var(--surface-tertiary)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--muted-foreground)]">
                  No subscription record
                </span>
              )}
            </div>

            {subscription?.billingCycle ? (
              <p className="text-xs text-[var(--muted-foreground)]">
                Billing cycle: {subscription.billingCycle.toLowerCase()}
              </p>
            ) : null}

            {subscription?.currentPeriodStart || subscription?.currentPeriodEnd ? (
              <div className="space-y-1 text-xs text-[var(--muted-foreground)]">
                {subscription.currentPeriodStart ? (
                  <p>Period start: {formatUserDateTime(subscription.currentPeriodStart)}</p>
                ) : null}
                {subscription.currentPeriodEnd ? (
                  <p>Period end: {formatUserDateTime(subscription.currentPeriodEnd)}</p>
                ) : null}
              </div>
            ) : null}

            {billing?.limits ? (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-lg bg-[var(--surface)] px-2.5 py-1 text-[11px] text-[var(--muted-foreground)]">
                  {formatNumber(billing.limits.links)} links
                </span>
                <span className="rounded-lg bg-[var(--surface)] px-2.5 py-1 text-[11px] text-[var(--muted-foreground)]">
                  {formatNumber(billing.limits.forms)} forms
                </span>
                <span className="rounded-lg bg-[var(--surface)] px-2.5 py-1 text-[11px] text-[var(--muted-foreground)]">
                  {formatNumber(Math.round(billing.limits.storageBytes / (1024 * 1024)))} MB storage
                </span>
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">
              Set plan (admin)
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <FilterDropdown
                label="Subscription plan"
                value={planDraft}
                options={PLAN_OPTIONS}
                onChange={(value) => setPlanDraft(value as SubscriptionPlan)}
              />
              {planDraft !== 'FREE' ? (
                <FilterDropdown
                  label="Billing cycle"
                  value={cycleDraft}
                  options={CYCLE_OPTIONS}
                  onChange={(value) => setCycleDraft(value as BillingCycle)}
                />
              ) : null}
              <Button
                className="h-10 rounded-xl"
                isDisabled={saving}
                onPress={() => void handleSavePlan()}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : 'Apply plan'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className={detailPanelClassName}>
        <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
          Invoices & payments
        </h2>

        {!billing?.payments.length ? (
          <p className="text-sm text-[var(--muted-foreground)]">
            No payment records for this user.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[11px] text-[var(--muted-foreground)]">
                  <th className="px-3 py-2 text-start font-medium">Date</th>
                  <th className="px-3 py-2 text-start font-medium">Amount</th>
                  <th className="px-3 py-2 text-start font-medium">Cycle</th>
                  <th className="px-3 py-2 text-start font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {billing.payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-[var(--border)]/60 last:border-0"
                  >
                    <td className="px-3 py-2.5 text-xs text-[var(--muted-foreground)]">
                      {formatUserDateTime(payment.paidAt ?? payment.createdAt)}
                    </td>
                    <td className="px-3 py-2.5 font-medium tabular-nums" dir="ltr">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-[var(--muted-foreground)]">
                      {payment.billingCycle.toLowerCase()}
                    </td>
                    <td
                      className={cn(
                        'px-3 py-2.5 text-xs font-medium',
                        paymentStatusClass(payment.status),
                      )}
                    >
                      {payment.status.toLowerCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
