'use client';

import { useEffect, useState } from 'react';
import { Button } from '@heroui/react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type { AdminMailAppDetail, MailPlanCode } from '@/lib/types/mail';
import { formatMailDateTime, formatMailPlan } from '@/lib/mail-format';
import { FilterDropdown } from '@/components/shared/filter-dropdown';
import { detailPanelClassName } from '@/components/ui/pill-tab';

const PLAN_OPTIONS: { value: MailPlanCode; label: string }[] = [
  { value: 'STARTER', label: 'Starter · 1 mailbox · 5 GB · 3,000 IQD' },
  { value: 'STANDARD', label: 'Standard · 3 mailboxes · 20 GB · 6,000 IQD' },
  { value: 'PREMIUM', label: 'Premium · 5 mailboxes · 30 GB · 10,000 IQD' },
];

export function MailAppSubscriptionPanel({
  app,
  onActivated,
}: {
  app: AdminMailAppDetail;
  onActivated: () => Promise<void> | void;
}) {
  const [plan, setPlan] = useState<MailPlanCode>(app.subscription?.plan ?? 'STARTER');
  const [seats, setSeats] = useState(app.subscription?.mailboxCount ?? 1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPlan(app.subscription?.plan ?? 'STARTER');
    setSeats(app.subscription?.mailboxCount ?? 1);
  }, [app.subscription?.plan, app.subscription?.mailboxCount]);

  async function handleActivate() {
    setSaving(true);
    try {
      await hqApi.activateMailAppSubscription(app.appId, {
        plan,
        mailboxCount: Math.max(1, Math.floor(seats) || 1),
        billingCycle: 'MONTHLY',
      });
      appToast.success('Mail plan activated for this app');
      await onActivated();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not activate plan',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={detailPanelClassName}>
      <h2 className="mb-1 text-sm font-semibold">Subscription</h2>
      <p className="text-xs text-[var(--muted-foreground)]">
        Activates seats, storage quota, and plan features for this app only — same path as the
        support ticket panel.
      </p>

      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-[var(--muted-foreground)]">Current plan</dt>
          <dd className="font-medium">{formatMailPlan(app.subscription?.plan)}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">Status</dt>
          <dd className="font-medium">{app.subscription?.status ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">Seats</dt>
          <dd className="font-medium tabular-nums" dir="ltr">
            {app.subscription?.mailboxCount ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">Period end</dt>
          <dd className="font-medium">
            {formatMailDateTime(app.subscription?.currentPeriodEnd)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-[var(--muted-foreground)]">Plan</p>
          <FilterDropdown
            label="Mail plan"
            value={plan}
            options={PLAN_OPTIONS}
            onChange={(value) => {
              const next = value as MailPlanCode;
              setPlan(next);
              const included =
                next === 'PREMIUM' ? 5 : next === 'STANDARD' ? 3 : 1;
              setSeats((current) => Math.max(included, current));
            }}
            disabled={saving}
          />
        </div>
        <label className="space-y-1.5 text-xs">
          <span className="font-medium text-[var(--muted-foreground)]">Seats</span>
          <input
            type="number"
            min={1}
            max={500}
            value={seats}
            disabled={saving}
            onChange={(event) => setSeats(Number(event.target.value) || 1)}
            className="block h-9 w-24 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          />
        </label>
        <Button
          size="sm"
          className="rounded-2xl"
          isDisabled={saving}
          onPress={() => void handleActivate()}
        >
          {saving ? 'Saving…' : app.subscription ? 'Update plan' : 'Activate plan'}
        </Button>
      </div>
    </section>
  );
}
