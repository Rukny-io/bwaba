'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { hqApi } from '@/lib/hq-api';
import { appToast } from '@/lib/app-toast';
import { ApiException } from '@/lib/api-client';
import type {
  MetaPortfolioAdminRequest,
  MetaPortfolioStats,
} from '@/lib/types/meta-portfolio';
import { cn } from '@/lib/utils';

const STATUS_FILTERS = [
  'pending',
  'approved',
  'fulfilled',
  'rejected',
  'all',
] as const;

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'pending'
      ? 'bg-[var(--warning)]/15 text-[var(--warning)]'
      : status === 'rejected'
        ? 'bg-[var(--destructive)]/15 text-[var(--destructive)]'
        : status === 'fulfilled'
          ? 'bg-[var(--success)]/15 text-[var(--success)]'
          : 'bg-[var(--surface-secondary)] text-[var(--foreground)]';

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize',
        tone,
      )}
    >
      {status}
    </span>
  );
}

export function MetaPortfolioWorkspace() {
  const [status, setStatus] =
    useState<(typeof STATUS_FILTERS)[number]>('pending');
  const [stats, setStats] = useState<MetaPortfolioStats | null>(null);
  const [rows, setRows] = useState<MetaPortfolioAdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [metaBusinessIdDraft, setMetaBusinessIdDraft] = useState<
    Record<string, string>
  >({});
  const [rejectDraft, setRejectDraft] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        hqApi.getMetaPortfolioStats(),
        hqApi.getMetaPortfolioRequests({
          page: 1,
          limit: 50,
          status: status === 'all' ? undefined : status,
        }),
      ]);
      setStats(statsRes);
      setRows(listRes.data);
    } catch (error) {
      appToast.error(
        error instanceof ApiException
          ? error.message
          : 'Could not load Meta portfolio requests',
      );
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runAction(
    id: string,
    action: () => Promise<unknown>,
    success: string,
  ) {
    setBusyId(id);
    try {
      await action();
      appToast.success(success);
      await load();
    } catch (error) {
      appToast.error(
        error instanceof ApiException ? error.message : 'Action failed',
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          Meta Business Portfolio
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Review Pro requests. Create the portfolio under Rukny ownership in Meta,
          then approve / fulfill. Checklist: domain, email on domain, website shows
          business name. Review may take more than 5 days.
        </p>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {(
            [
              ['pending', stats.pending],
              ['approved', stats.approved],
              ['fulfilled', stats.fulfilled],
              ['rejected', stats.rejected],
            ] as const
          ).map(([key, value]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={cn(
                'rounded-2xl border p-4 text-start transition-colors',
                status === key
                  ? 'border-[var(--foreground)] bg-[var(--surface)]'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-secondary)]',
              )}
            >
              <p className="text-xs capitalize text-[var(--muted-foreground)]">
                {key}
              </p>
              <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                {value}
              </p>
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStatus(item)}
            className={cn(
              'inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold capitalize',
              status === item
                ? 'bg-[var(--foreground)] text-[var(--background)]'
                : 'bg-[var(--surface-secondary)] text-[var(--foreground)]',
            )}
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-[var(--muted-foreground)]">
          No requests in this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <article
              key={row.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-[var(--foreground)]">
                      {row.businessName}
                    </h2>
                    <StatusBadge status={row.status} />
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {row.user.email}
                    {row.user.name ? ` · ${row.user.name}` : ''} · app{' '}
                    <span dir="ltr">{row.app.name}</span>
                  </p>
                </div>
                <Link
                  href={`/app/users/${row.user.id}`}
                  className="text-xs font-medium text-[var(--primary)] hover:underline"
                >
                  Open user
                </Link>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-[var(--muted-foreground)]">Domain</dt>
                  <dd dir="ltr">{row.domain}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted-foreground)]">Email</dt>
                  <dd dir="ltr">{row.businessEmail}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-[var(--muted-foreground)]">Website</dt>
                  <dd>
                    <a
                      href={row.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--primary)] hover:underline"
                      dir="ltr"
                    >
                      {row.websiteUrl}
                    </a>
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-[var(--muted-foreground)]">
                    Description
                  </dt>
                  <dd className="text-[var(--foreground)]">
                    {row.businessDescription}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1',
                    row.checklist.domainPresent
                      ? 'bg-[var(--success)]/15 text-[var(--success)]'
                      : 'bg-[var(--destructive)]/15 text-[var(--destructive)]',
                  )}
                >
                  Domain present
                </span>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1',
                    row.checklist.emailOnDomain
                      ? 'bg-[var(--success)]/15 text-[var(--success)]'
                      : 'bg-[var(--destructive)]/15 text-[var(--destructive)]',
                  )}
                >
                  Email on domain
                </span>
                <span className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-1 text-[var(--muted-foreground)]">
                  Website shows name — verify manually
                </span>
              </div>

              {(row.status === 'pending' || row.status === 'approved') && (
                <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-medium text-[var(--muted-foreground)]">
                      Meta Business ID
                    </span>
                    <input
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                      dir="ltr"
                      placeholder="Paste Meta Business Portfolio ID"
                      value={
                        metaBusinessIdDraft[row.id] ?? row.metaBusinessId ?? ''
                      }
                      onChange={(e) =>
                        setMetaBusinessIdDraft((prev) => ({
                          ...prev,
                          [row.id]: e.target.value,
                        }))
                      }
                    />
                  </label>

                  {row.status === 'pending' ? (
                    <>
                      <label className="block space-y-1.5">
                        <span className="text-xs font-medium text-[var(--muted-foreground)]">
                          Rejection reason
                        </span>
                        <input
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                          value={rejectDraft[row.id] ?? ''}
                          onChange={(e) =>
                            setRejectDraft((prev) => ({
                              ...prev,
                              [row.id]: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() =>
                            void runAction(
                              row.id,
                              () =>
                                hqApi.approveMetaPortfolioRequest(
                                  row.id,
                                  metaBusinessIdDraft[row.id] || undefined,
                                ),
                              'Request approved',
                            )
                          }
                          className="inline-flex h-9 items-center rounded-full bg-[var(--foreground)] px-4 text-xs font-semibold text-[var(--background)] disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() =>
                            void runAction(
                              row.id,
                              () =>
                                hqApi.rejectMetaPortfolioRequest(
                                  row.id,
                                  rejectDraft[row.id] || '',
                                ),
                              'Request rejected',
                            )
                          }
                          className="inline-flex h-9 items-center rounded-full bg-[var(--destructive)] px-4 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={
                            busyId === row.id ||
                            !(
                              metaBusinessIdDraft[row.id]?.trim() ||
                              row.metaBusinessId
                            )
                          }
                          onClick={() =>
                            void runAction(
                              row.id,
                              () =>
                                hqApi.fulfillMetaPortfolioRequest(
                                  row.id,
                                  metaBusinessIdDraft[row.id]?.trim() ||
                                    row.metaBusinessId ||
                                    '',
                                ),
                              'Marked fulfilled',
                            )
                          }
                          className="inline-flex h-9 items-center rounded-full border border-[var(--border)] px-4 text-xs font-semibold text-[var(--foreground)] disabled:opacity-50"
                        >
                          Fulfill now
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        busyId === row.id ||
                        !(
                          metaBusinessIdDraft[row.id]?.trim() ||
                          row.metaBusinessId
                        )
                      }
                      onClick={() =>
                        void runAction(
                          row.id,
                          () =>
                            hqApi.fulfillMetaPortfolioRequest(
                              row.id,
                              metaBusinessIdDraft[row.id]?.trim() ||
                                row.metaBusinessId ||
                                '',
                            ),
                          'Marked fulfilled',
                        )
                      }
                      className="inline-flex h-9 items-center rounded-full bg-[var(--foreground)] px-4 text-xs font-semibold text-[var(--background)] disabled:opacity-50"
                    >
                      Mark fulfilled
                    </button>
                  )}
                </div>
              )}

              {row.rejectionReason ? (
                <p className="mt-3 text-xs text-[var(--destructive)]">
                  Rejected: {row.rejectionReason}
                </p>
              ) : null}
              {row.metaBusinessId ? (
                <p className="mt-2 text-xs text-[var(--muted-foreground)]" dir="ltr">
                  Meta Business ID: {row.metaBusinessId}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
