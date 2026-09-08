'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Chip, SearchField } from '@heroui/react';
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleX,
  Clock3,
  Globe2,
  Mail,
  RefreshCw,
  SearchX,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type {
  MailDomainVerificationRequest,
  MailDomainVerificationRequestStatus,
} from '@/lib/types/mail';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { detailPanelClassName } from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

type Decision = 'approve' | 'reject' | 'revoke';
type StatusFilter = MailDomainVerificationRequestStatus | '';

const STATUS_COLOR = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'default',
} as const;

const STATUS_LABEL: Record<MailDomainVerificationRequestStatus, string> = {
  PENDING: 'Pending review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

function formatStatus(value: string) {
  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function requesterName(request: MailDomainVerificationRequest) {
  return (
    request.requestedBy.profile?.name ||
    request.requestedBy.profile?.username ||
    request.requestedBy.email
  );
}

function DetailItem({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Globe2;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-[var(--surface-secondary)] p-3">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </dt>
      <dd className="mt-1.5 min-w-0 text-sm font-medium text-[var(--foreground)]">
        {children}
      </dd>
    </div>
  );
}

export function MailDomainVerificationQueue() {
  const [rows, setRows] = useState<MailDomainVerificationRequest[]>([]);
  const [selected, setSelected] = useState<MailDomainVerificationRequest | null>(null);
  const [status, setStatus] = useState<StatusFilter>('PENDING');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await hqApi.getMailDomainVerificationRequests({
        limit: 100,
      });
      setRows(result.data);
      setSelected((current) =>
        current ? result.data.find((row) => row.id === current.id) ?? null : result.data[0] ?? null,
      );
    } catch (error) {
      const message =
        error instanceof ApiException ? error.message : 'Could not load verification requests';
      setError(message);
      appToast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const counts = useMemo(
    () =>
      rows.reduce(
        (result, row) => {
          result[row.status] += 1;
          return result;
        },
        { PENDING: 0, APPROVED: 0, REJECTED: 0, WITHDRAWN: 0 },
      ),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (status && row.status !== status) return false;
      if (!query) return true;
      return [
        row.domain,
        row.mailApp.name,
        row.mailApp.appId,
        row.requestedBy.email,
        row.requestedBy.profile?.name,
        row.requestedBy.profile?.username,
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [rows, search, status]);

  const selectedRequest =
    selected && filteredRows.some((row) => row.id === selected.id)
      ? selected
      : filteredRows[0] ?? null;

  async function submitDecision() {
    if (!selectedRequest || !decision) return;
    if (decision !== 'approve' && reason.trim().length < 3) {
      appToast.error('Enter a reason of at least 3 characters');
      return;
    }
    setBusy(true);
    try {
      if (decision === 'approve') {
        await hqApi.approveMailDomainVerification(selectedRequest.id);
      } else if (decision === 'reject') {
        await hqApi.rejectMailDomainVerification(selectedRequest.id, reason.trim());
      } else {
        await hqApi.revokeMailDomainVerification(selectedRequest.id, reason.trim());
      }
      appToast.success(
        decision === 'approve'
          ? 'Domain verification approved'
          : decision === 'reject'
            ? 'Domain verification rejected'
            : 'Domain verification revoked',
      );
      setReason('');
      await load();
    } catch (error) {
      appToast.error(error instanceof ApiException ? error.message : 'Decision failed');
    } finally {
      setBusy(false);
    }
  }

  const primaryMatches =
    selectedRequest?.mailApp.primaryDomain?.toLowerCase() === selectedRequest?.domain.toLowerCase();
  const eligibility = selectedRequest
    ? [
        { label: 'Request is pending review', met: selectedRequest.status === 'PENDING' },
        {
          label: 'DNS and Amazon SES checks are active',
          met: selectedRequest.mailApp.domainStatus === 'ACTIVE',
        },
        { label: 'Requested domain matches the app domain', met: primaryMatches },
      ]
    : [];
  const canApprove = eligibility.every((item) => item.met);
  const canRevoke =
    selectedRequest?.status === 'APPROVED' &&
    selectedRequest.mailApp.domainTrustStatus === 'VERIFIED';
  const reasonRequired = decision === 'reject' || decision === 'revoke';
  const evidence = selectedRequest?.evidence
    ? Object.entries(selectedRequest.evidence).filter(
        ([, value]) =>
          typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean',
      )
    : [];

  return (
    <div className="space-y-4">
      <section aria-labelledby="verification-summary-heading" className={detailPanelClassName}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="verification-summary-heading" className="text-base font-semibold">
              Domain verification
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-[var(--muted-foreground)]">
              Review administrative trust requests after DNS and Amazon SES verification.
            </p>
          </div>
          <Button
            size="sm"
            variant="tertiary"
            className="h-8 gap-1.5 rounded-lg"
            isDisabled={loading}
            onPress={() => void load()}
          >
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} aria-hidden />
            Refresh
          </Button>
        </div>
        <dl className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {[
            { label: 'All requests', value: rows.length, icon: Mail },
            { label: 'Awaiting review', value: counts.PENDING, icon: Clock3 },
            { label: 'Approved', value: counts.APPROVED, icon: CheckCircle2 },
            {
              label: 'Closed',
              value: counts.REJECTED + counts.WITHDRAWN,
              icon: CircleX,
            },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-[var(--surface-secondary)] p-3">
              <dt className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
                <item.icon className="size-3.5" aria-hidden />
                {item.label}
              </dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <section aria-labelledby="verification-queue-heading" className={detailPanelClassName}>
          <div className="mb-3">
            <h2 id="verification-queue-heading" className="text-sm font-semibold">
              Review queue
            </h2>
            <p aria-live="polite" className="mt-1 text-xs text-[var(--muted-foreground)]">
              {filteredRows.length} matching {filteredRows.length === 1 ? 'request' : 'requests'}
            </p>
          </div>

          <SearchField
            fullWidth
            aria-label="Search verification requests"
            name="verification-search"
            value={search}
            onChange={setSearch}
          >
            <SearchField.Group className="h-9 rounded-lg border-0 bg-[var(--surface-secondary)]">
              <SearchField.SearchIcon className="text-[var(--muted-foreground)]" />
              <SearchField.Input
                placeholder="Domain, app, requester or app ID…"
                className="text-xs placeholder:text-[var(--muted-foreground)]"
              />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <div
            role="group"
            aria-label="Filter requests by status"
            className="my-3 flex gap-1.5 overflow-x-auto pb-1"
          >
            {STATUS_OPTIONS.map((option) => {
              const active = status === option.value;
              const count = option.value ? counts[option.value] : rows.length;
              return (
                <button
                  key={option.value || 'all'}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatus(option.value)}
                  className={cn(
                    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors',
                    active
                      ? 'bg-[var(--foreground)] text-[var(--background)]'
                      : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                  )}
                >
                  {option.label}
                  <span className="tabular-nums opacity-75">{count}</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div role="status" className="space-y-2" aria-label="Loading verification requests">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="h-[76px] animate-pulse rounded-xl bg-[var(--surface-secondary)]"
                />
              ))}
            </div>
          ) : error ? (
            <div
              role="alert"
              className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-6 text-center"
            >
              <AlertCircle className="size-6 text-[var(--danger)]" aria-hidden />
              <p className="mt-2 text-sm font-medium">Could not load the queue</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">{error}</p>
              <Button size="sm" variant="outline" className="mt-4" onPress={() => void load()}>
                Try again
              </Button>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center p-6 text-center">
              <SearchX className="size-6 text-[var(--muted-foreground)]" aria-hidden />
              <p className="mt-2 text-sm font-medium">
                {rows.length === 0 ? 'No verification requests yet' : 'No matching requests'}
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                {rows.length === 0
                  ? 'New trust requests will appear here.'
                  : 'Try another search or status filter.'}
              </p>
              {rows.length > 0 ? (
                <Button
                  size="sm"
                  variant="tertiary"
                  className="mt-3"
                  onPress={() => {
                    setSearch('');
                    setStatus('');
                  }}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            <ul className="max-h-[640px] space-y-2 overflow-y-auto pe-1" aria-label="Requests">
              {filteredRows.map((row) => {
                const active = selectedRequest?.id === row.id;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      aria-current={active ? 'true' : undefined}
                      onClick={() => {
                        setSelected(row);
                        setReason('');
                      }}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]',
                        active
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-sm'
                          : 'border-transparent bg-[var(--surface-secondary)] hover:border-[var(--border)]',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
                          active
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--surface)] text-[var(--muted-foreground)]',
                        )}
                      >
                        <Globe2 className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold" dir="ltr">
                          {row.domain}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-[var(--muted-foreground)]">
                          {row.mailApp.name} · {requesterName(row)}
                        </span>
                        <span className="mt-1.5 block text-[11px] text-[var(--muted-foreground)]">
                          {formatDate(row.createdAt)}
                        </span>
                      </span>
                      <Chip color={STATUS_COLOR[row.status]} size="sm" variant="soft">
                        {STATUS_LABEL[row.status]}
                      </Chip>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section
          aria-labelledby="verification-detail-heading"
          className={cn(detailPanelClassName, 'xl:sticky xl:top-4')}
        >
          {!selectedRequest ? (
            <div className="flex min-h-56 flex-col items-center justify-center text-center">
              <ShieldCheck className="size-7 text-[var(--muted-foreground)]" aria-hidden />
              <h2 id="verification-detail-heading" className="mt-2 text-sm font-semibold">
                Select a request
              </h2>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                Choose a queue item to review its evidence and eligibility.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      id="verification-detail-heading"
                      className="truncate text-base font-semibold"
                      dir="ltr"
                    >
                      {selectedRequest.domain}
                    </h2>
                    <Chip color={STATUS_COLOR[selectedRequest.status]} size="sm" variant="soft">
                      {STATUS_LABEL[selectedRequest.status]}
                    </Chip>
                  </div>
                  <p className="mt-1 truncate font-mono text-[11px] text-[var(--muted-foreground)]">
                    Request {selectedRequest.id}
                  </p>
                </div>
                <Link
                  href={`/app/mail/${selectedRequest.mailApp.appId}?tab=domain`}
                  className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary)]/10"
                >
                  Open app
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </div>

              <dl className="grid gap-2 sm:grid-cols-2">
                <DetailItem icon={Globe2} label="Domain">
                  <span className="block truncate" dir="ltr" title={selectedRequest.domain}>
                    {selectedRequest.domain}
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-normal text-[var(--muted-foreground)]">
                    {selectedRequest.mailApp.name}
                  </span>
                </DetailItem>
                <DetailItem icon={UserRound} label="Requester">
                  <span className="block truncate">{requesterName(selectedRequest)}</span>
                  <span
                    className="mt-0.5 block truncate text-xs font-normal text-[var(--muted-foreground)]"
                    dir="ltr"
                  >
                    {selectedRequest.requestedBy.email}
                  </span>
                </DetailItem>
                <DetailItem icon={CalendarDays} label="Requested">
                  {formatDate(selectedRequest.createdAt)}
                  {selectedRequest.reviewedAt ? (
                    <span className="mt-0.5 block text-xs font-normal text-[var(--muted-foreground)]">
                      Reviewed {formatDate(selectedRequest.reviewedAt)}
                    </span>
                  ) : null}
                </DetailItem>
                <DetailItem icon={Mail} label="DNS / SES">
                  <Chip
                    color={
                      selectedRequest.mailApp.domainStatus === 'ACTIVE' ? 'success' : 'warning'
                    }
                    size="sm"
                    variant="soft"
                  >
                    {formatStatus(selectedRequest.mailApp.domainStatus)}
                  </Chip>
                  <span className="mt-1 block text-xs font-normal text-[var(--muted-foreground)]">
                    Checked {formatDate(selectedRequest.mailApp.domainCheckedAt)}
                  </span>
                </DetailItem>
                <DetailItem icon={ShieldCheck} label="Administrative trust">
                  <Chip
                    color={
                      selectedRequest.mailApp.domainTrustStatus === 'VERIFIED'
                        ? 'success'
                        : selectedRequest.mailApp.domainTrustStatus === 'REJECTED' ||
                            selectedRequest.mailApp.domainTrustStatus === 'REVOKED'
                          ? 'danger'
                          : 'warning'
                    }
                    size="sm"
                    variant="soft"
                  >
                    {formatStatus(selectedRequest.mailApp.domainTrustStatus)}
                  </Chip>
                  <span className="mt-1 block text-xs font-normal text-[var(--muted-foreground)]">
                    {selectedRequest.mailApp.domainVerifiedAt
                      ? `Verified ${formatDate(selectedRequest.mailApp.domainVerifiedAt)}`
                      : 'Not administratively verified'}
                  </span>
                </DetailItem>
                <DetailItem icon={CheckCircle2} label="Primary app domain">
                  <span className="block truncate" dir="ltr">
                    {selectedRequest.mailApp.primaryDomain || 'Not configured'}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 block text-xs font-normal',
                      primaryMatches ? 'text-[var(--success)]' : 'text-[var(--danger)]',
                    )}
                  >
                    {primaryMatches ? 'Matches this request' : 'Does not match this request'}
                  </span>
                </DetailItem>
              </dl>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  Approval eligibility
                </h3>
                <ul className="mt-2 space-y-2">
                  {eligibility.map((item) => (
                    <li key={item.label} className="flex items-start gap-2 text-sm">
                      <span
                        className={cn(
                          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full',
                          item.met
                            ? 'bg-[var(--success)]/15 text-[var(--success)]'
                            : 'bg-[var(--danger)]/10 text-[var(--danger)]',
                        )}
                      >
                        {item.met ? (
                          <Check className="size-3" aria-hidden />
                        ) : (
                          <X className="size-3" aria-hidden />
                        )}
                      </span>
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>

              {evidence.length > 0 ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Submitted evidence
                  </h3>
                  <dl className="mt-2 grid gap-2 rounded-xl bg-[var(--surface-secondary)] p-3 text-xs sm:grid-cols-2">
                    {evidence.map(([key, value]) => (
                      <div key={key} className="min-w-0">
                        <dt className="text-[var(--muted-foreground)]">{formatStatus(key)}</dt>
                        <dd className="mt-0.5 truncate font-medium" title={String(value)}>
                          {String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}

              {selectedRequest.rejectionReason ||
              selectedRequest.mailApp.domainTrustReason ? (
                <div
                  role="note"
                  className="rounded-xl border border-[var(--warning)]/20 bg-[var(--warning)]/10 p-3"
                >
                  <p className="text-xs font-semibold">Decision reason</p>
                  <p className="mt-1 whitespace-pre-wrap text-xs text-[var(--muted-foreground)]">
                    {selectedRequest.mailApp.domainTrustReason ||
                      selectedRequest.rejectionReason}
                  </p>
                </div>
              ) : null}

              {selectedRequest.status === 'PENDING' || canRevoke ? (
                <div className="border-t border-[var(--border)] pt-4">
                  <label htmlFor="verification-reason" className="text-sm font-medium">
                    Decision reason
                    <span className="ms-1 text-xs font-normal text-[var(--muted-foreground)]">
                      Required for rejection or revocation
                    </span>
                  </label>
                  <textarea
                    id="verification-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Explain the decision for the audit trail…"
                    className="mt-2 min-h-24 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--field-background)] p-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    maxLength={1000}
                    aria-describedby="verification-reason-help"
                  />
                  <div
                    id="verification-reason-help"
                    className="mt-1 flex justify-between gap-3 text-[11px] text-[var(--muted-foreground)]"
                  >
                    <span>Minimum 3 characters when required.</span>
                    <span className="tabular-nums">{reason.length}/1000</span>
                  </div>
                </div>
              ) : null}

              {selectedRequest.status === 'PENDING' ? (
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button
                    size="sm"
                    variant="danger"
                    className="sm:min-w-24"
                    isDisabled={reason.trim().length < 3}
                    onPress={() => setDecision('reject')}
                  >
                    Reject request
                  </Button>
                  <Button
                    size="sm"
                    className="sm:min-w-24"
                    isDisabled={!canApprove}
                    onPress={() => setDecision('approve')}
                  >
                    Approve domain
                  </Button>
                </div>
              ) : canRevoke ? (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="danger"
                    className="w-full sm:w-auto"
                    isDisabled={reason.trim().length < 3}
                    onPress={() => setDecision('revoke')}
                  >
                    Revoke verification
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        isOpen={decision !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDecision(null);
            setReason('');
          }
        }}
        title={
          decision === 'approve'
            ? 'Approve domain verification?'
            : decision === 'reject'
              ? 'Reject this request?'
              : 'Revoke domain verification?'
        }
        description={
          decision === 'approve'
            ? `This will grant administrative trust to ${selectedRequest?.domain ?? 'this domain'}. DNS and SES must remain active.`
            : `${reasonRequired ? `Reason: “${reason.trim()}” ` : ''}This action will be recorded in the administrative audit trail.`
        }
        confirmLabel={
          decision === 'approve' ? 'Approve domain' : decision === 'reject' ? 'Reject request' : 'Revoke'
        }
        variant={decision === 'reject' || decision === 'revoke' ? 'danger' : 'default'}
        isLoading={busy}
        onConfirm={submitDecision}
      />
    </div>
  );
}
