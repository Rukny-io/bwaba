'use client';

import { useEffect, useState } from 'react';
import { Button } from '@heroui/react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import {
  parseMailPlanRequestContext,
  type AdminSupportTicketDetail,
  type MailPlanCode,
} from '@/lib/types/support-tickets';
import { FilterDropdown } from '@/components/shared/filter-dropdown';
import { detailPanelClassName } from '@/components/ui/pill-tab';

const PLAN_OPTIONS: { value: MailPlanCode; label: string }[] = [
  { value: 'STARTER', label: 'Starter · 5 GB' },
  { value: 'STANDARD', label: 'Standard · 20 GB' },
  { value: 'PREMIUM', label: 'Premium · 50 GB' },
];

const OPEN_STATUSES = new Set(['OPEN', 'IN_PROGRESS', 'WAITING_ON_USER']);

interface SupportTicketMailPlanPanelProps {
  ticket: AdminSupportTicketDetail;
  busy: boolean;
  onActivated: () => Promise<void> | void;
}

export function SupportTicketMailPlanPanel({
  ticket,
  busy,
  onActivated,
}: SupportTicketMailPlanPanelProps) {
  const request = parseMailPlanRequestContext(ticket.context);
  const [plan, setPlan] = useState<MailPlanCode>(request?.mailPlan ?? 'STARTER');
  const [seats, setSeats] = useState(request?.mailboxCount ?? 1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!request) return;
    setPlan(request.mailPlan);
    setSeats(request.mailboxCount);
  }, [request?.mailPlan, request?.mailboxCount, request?.mailAppId]);

  if (!request) return null;

  const canActivate = OPEN_STATUSES.has(ticket.status);

  async function handleActivate() {
    if (!request) return;
    setSaving(true);
    try {
      await hqApi.activateMailAppSubscription(request.mailAppId, {
        plan,
        mailboxCount: Math.max(1, Math.floor(seats) || 1),
        ticketId: ticket.id,
        billingCycle: 'MONTHLY',
      });
      appToast.success('Mail plan activated for this app');
      await onActivated();
    } catch (error) {
      appToast.error(
        error instanceof ApiException
          ? error.message
          : 'Could not activate Mail plan',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={detailPanelClassName}>
      <h2 className="mb-1 text-sm font-semibold text-[var(--foreground)]">
        Mail plan request
      </h2>
      <p className="text-xs text-[var(--muted-foreground)]">
        Activates seats, storage quota, and plan features for this Mail app only
        — not for the customer’s other apps. Card payments are coming soon.
      </p>

      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-[var(--muted-foreground)]">App</dt>
          <dd className="font-medium text-[var(--foreground)]" dir="ltr">
            {request.mailAppName || request.mailAppId}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">App ID</dt>
          <dd className="font-mono text-[var(--foreground)]" dir="ltr">
            {request.mailAppId}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">Requested</dt>
          <dd className="font-medium text-[var(--foreground)]">
            {request.mailPlan} · {request.mailboxCount} seat
            {request.mailboxCount === 1 ? '' : 's'}
            {request.monthlyTotal != null
              ? ` · ${request.monthlyTotal.toLocaleString('en-IQ')} IQD/mo`
              : ''}
          </dd>
        </div>
      </dl>

      {canActivate ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">Plan</p>
            <FilterDropdown
              label="Mail plan"
              value={plan}
              options={PLAN_OPTIONS}
              onChange={(value) => setPlan(value as MailPlanCode)}
              disabled={busy || saving}
            />
          </div>
          <label className="space-y-1.5 text-xs">
            <span className="font-medium text-[var(--muted-foreground)]">Seats</span>
            <input
              type="number"
              min={1}
              max={500}
              value={seats}
              disabled={busy || saving}
              onChange={(event) => setSeats(Number(event.target.value) || 1)}
              className="block h-9 w-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
            />
          </label>
          <Button
            size="sm"
            className="rounded-xl"
            isDisabled={busy || saving}
            onPress={() => void handleActivate()}
          >
            {saving ? 'Activating…' : 'Activate for this app'}
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          This request is {ticket.status.toLowerCase().replace(/_/g, ' ')}. Open
          it again if you need to change the plan.
        </p>
      )}
    </section>
  );
}
