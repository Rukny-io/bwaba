'use client';

import Link from 'next/link';
import { Chip } from '@heroui/react';
import type { MailDomainsResponse } from '@/lib/types/mail';
import { FormsTableOwnerCell } from '@/components/forms/forms-table-owner-cell';
import {
  formatMailDomainStatus,
  mailDomainStatusChipColor,
} from '@/lib/mail-format';
import { formatNumber } from '@/lib/dashboard-format';
import { detailPanelClassName } from '@/components/ui/pill-tab';

const ORDER = ['NONE', 'PENDING_DNS', 'VERIFYING', 'FAILED', 'ACTIVE'] as const;

export function MailDomainsPanel({
  data,
  loading,
}: {
  data: MailDomainsResponse | null;
  loading?: boolean;
}) {
  if (loading || !data) {
    return <div className="h-64 animate-pulse rounded-2xl bg-[var(--surface-secondary)]" />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {ORDER.map((status) => (
          <div key={status} className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-3">
            <p className="text-[11px] text-[var(--muted-foreground)]">
              {formatMailDomainStatus(status)}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums" dir="ltr">
              {formatNumber(data.counts[status] ?? 0)}
            </p>
          </div>
        ))}
      </div>

      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold">Unverified apps</h2>
        {data.apps.length === 0 ? (
          <p className="text-xs text-[var(--muted-foreground)]">
            All apps are verified, or there are no rows.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]/60">
            {data.apps.map((app) => (
              <li key={app.appId} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/app/mail/${app.appId}`}
                    className="block truncate text-sm font-medium hover:text-[var(--primary)]"
                  >
                    {app.name}
                  </Link>
                  <p className="truncate text-xs text-[var(--muted-foreground)]" dir="ltr">
                    {app.primaryDomain || app.appId}
                  </p>
                  <div className="mt-1 flex gap-3 text-[11px] font-medium">
                    <Link href={`/app/mail/${app.appId}`} className="text-[var(--primary)]">
                      Details
                    </Link>
                    <Link
                      href={`/app/mail/${app.appId}?tab=analytics`}
                      className="text-[var(--primary)]"
                    >
                      Analytics
                    </Link>
                  </div>
                </div>
                <Chip
                  color={mailDomainStatusChipColor(app.domainStatus)}
                  size="sm"
                  variant="soft"
                >
                  {formatMailDomainStatus(app.domainStatus)}
                </Chip>
                <div className="w-full sm:w-56">
                  <FormsTableOwnerCell owner={app.owner} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
