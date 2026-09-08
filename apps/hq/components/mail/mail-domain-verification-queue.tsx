'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Chip } from '@heroui/react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type {
  MailDomainVerificationRequest,
  MailDomainVerificationRequestStatus,
} from '@/lib/types/mail';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { detailPanelClassName } from '@/components/ui/pill-tab';

type Decision = 'approve' | 'reject' | 'revoke';

const STATUS_COLOR = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'default',
} as const;

export function MailDomainVerificationQueue() {
  const [rows, setRows] = useState<MailDomainVerificationRequest[]>([]);
  const [selected, setSelected] = useState<MailDomainVerificationRequest | null>(null);
  const [status, setStatus] = useState<MailDomainVerificationRequestStatus | ''>('PENDING');
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await hqApi.getMailDomainVerificationRequests({
        limit: 100,
        status: status || undefined,
      });
      setRows(result.data);
      setSelected((current) =>
        current ? result.data.find((row) => row.id === current.id) ?? null : result.data[0] ?? null,
      );
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Could not load verification requests',
      );
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitDecision() {
    if (!selected || !decision) return;
    if (decision !== 'approve' && reason.trim().length < 3) {
      appToast.error('Enter a reason of at least 3 characters');
      return;
    }
    setBusy(true);
    try {
      if (decision === 'approve') {
        await hqApi.approveMailDomainVerification(selected.id);
      } else if (decision === 'reject') {
        await hqApi.rejectMailDomainVerification(selected.id, reason.trim());
      } else {
        await hqApi.revokeMailDomainVerification(selected.id, reason.trim());
      }
      appToast.success(`Domain verification ${decision}d`);
      setReason('');
      await load();
    } catch (error) {
      appToast.error(error instanceof ApiException ? error.message : 'Decision failed');
      throw error;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
      <section className={detailPanelClassName}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">Domain verification queue</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Administrative trust requests, separate from DNS/SES verification.
            </p>
          </div>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as MailDomainVerificationRequestStatus | '')
            }
            className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs"
          >
            <option value="">All requests</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>
        {loading ? (
          <div className="h-40 animate-pulse rounded-xl bg-[var(--surface-secondary)]" />
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-xs text-[var(--muted-foreground)]">
            No matching requests.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]/60">
            {rows.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setSelected(row)}
                  className="flex w-full items-center gap-3 py-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" dir="ltr">
                      {row.domain}
                    </p>
                    <p className="truncate text-xs text-[var(--muted-foreground)]">
                      {row.mailApp.name} · {row.requestedBy.email}
                    </p>
                  </div>
                  <Chip color={STATUS_COLOR[row.status]} size="sm" variant="soft">
                    {row.status}
                  </Chip>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={detailPanelClassName}>
        {!selected ? (
          <p className="text-xs text-[var(--muted-foreground)]">Select a request to review.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Request detail</h2>
              <p className="mt-1 font-mono text-xs text-[var(--muted-foreground)]">
                {selected.id}
              </p>
            </div>
            <dl className="grid gap-3 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-[var(--muted-foreground)]">Domain</dt>
                <dd className="font-medium" dir="ltr">{selected.domain}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">DNS / SES</dt>
                <dd className="font-medium">{selected.mailApp.domainStatus}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Trust</dt>
                <dd className="font-medium">{selected.mailApp.domainTrustStatus}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted-foreground)]">Requested</dt>
                <dd className="font-medium">{new Date(selected.createdAt).toLocaleString()}</dd>
              </div>
            </dl>
            {selected.rejectionReason || selected.mailApp.domainTrustReason ? (
              <p className="rounded-xl bg-[var(--surface-secondary)] p-3 text-xs">
                {selected.mailApp.domainTrustReason || selected.rejectionReason}
              </p>
            ) : null}
            <Link
              href={`/app/mail/${selected.mailApp.appId}?tab=domain`}
              className="text-xs font-medium text-[var(--primary)]"
            >
              Open Mail app detail
            </Link>
            {selected.status === 'PENDING' ||
            (selected.status === 'APPROVED' &&
              selected.mailApp.domainTrustStatus === 'VERIFIED') ? (
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Reason (required for reject or revoke)"
                className="min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm"
                maxLength={1000}
              />
            ) : null}
            {selected.status === 'PENDING' ? (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onPress={() => setDecision('approve')}>
                  Approve
                </Button>
                <Button size="sm" variant="danger" onPress={() => setDecision('reject')}>
                  Reject
                </Button>
              </div>
            ) : selected.status === 'APPROVED' &&
              selected.mailApp.domainTrustStatus === 'VERIFIED' ? (
              <Button size="sm" variant="danger" onPress={() => setDecision('revoke')}>
                Revoke verification
              </Button>
            ) : null}
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={decision !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDecision(null);
            setReason('');
          }
        }}
        title={`${decision ? decision[0].toUpperCase() + decision.slice(1) : 'Confirm'} domain`}
        description={
          decision === 'approve'
            ? 'Approval is allowed only while current DNS and SES verification is ACTIVE.'
            : `Confirm this ${decision ?? 'decision'} and record the supplied reason in the audit trail.`
        }
        confirmLabel={decision ? decision[0].toUpperCase() + decision.slice(1) : 'Confirm'}
        variant={decision === 'reject' || decision === 'revoke' ? 'danger' : 'default'}
        isLoading={busy}
        onConfirm={submitDecision}
      />
    </div>
  );
}
