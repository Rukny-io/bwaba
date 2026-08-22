'use client';

import Link from 'next/link';
import { HardDrive, Inbox, Mail, TriangleAlert } from 'lucide-react';
import type { AdminMailAppDetail } from '@/lib/types/mail';
import { FormsTableOwnerCell } from '@/components/forms/forms-table-owner-cell';
import { formatNumber } from '@/lib/dashboard-format';
import {
  formatMailAppStatus,
  formatMailAppType,
  formatMailDateTime,
  formatMailDomainStatus,
  formatMailPlan,
  formatMailStorageRatio,
} from '@/lib/mail-format';
import { detailPanelClassName } from '@/components/ui/pill-tab';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)]/60 py-2.5 last:border-0">
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      <span className="max-w-[65%] text-end text-xs font-medium text-[var(--foreground)]" dir="ltr">
        {value}
      </span>
    </div>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-3">
      <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
        <Icon className="size-3.5" aria-hidden />
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className="mt-1.5 text-xl font-bold tabular-nums text-[var(--foreground)]" dir="ltr">
        {value}
      </p>
    </div>
  );
}

export function MailAppOverviewPanel({ app }: { app: AdminMailAppDetail }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile
          icon={Inbox}
          label="Mailboxes"
          value={formatNumber(app.counts.mailboxes)}
        />
        <MetricTile
          icon={HardDrive}
          label="Storage"
          value={formatMailStorageRatio(app.storage.usedBytes, app.storage.quotaBytes)}
        />
        <MetricTile icon={Mail} label="Plan" value={formatMailPlan(app.subscription?.plan)} />
        <MetricTile
          icon={TriangleAlert}
          label="Failed 24h"
          value={formatNumber(app.counts.failed24h)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={detailPanelClassName}>
          <h2 className="mb-3 text-sm font-semibold">App</h2>
          <DetailRow label="Name" value={app.name} />
          <DetailRow label="App ID" value={app.appId} />
          <DetailRow label="Type" value={formatMailAppType(app.appType)} />
          <DetailRow label="Status" value={formatMailAppStatus(app.status)} />
          <DetailRow label="Contact email" value={app.contactEmail ?? '—'} />
          <DetailRow label="Created" value={formatMailDateTime(app.createdAt)} />
          <DetailRow label="Updated" value={formatMailDateTime(app.updatedAt)} />
        </section>

        <section className={detailPanelClassName}>
          <h2 className="mb-3 text-sm font-semibold">Owner and domain</h2>
          <div className="mb-3">
            <FormsTableOwnerCell owner={app.owner} />
          </div>
          <DetailRow label="Domain" value={app.primaryDomain ?? '—'} />
          <DetailRow label="Verification" value={formatMailDomainStatus(app.domainStatus)} />
          <DetailRow
            label="Last checked"
            value={formatMailDateTime(app.domainCheckedAt)}
          />
          <p className="mt-3 text-[11px] text-[var(--muted-foreground)]">
            Message bodies are not shown here. Use the Delivery tab for subject, addresses, and SES
            status only.
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium">
            <Link href={`/app/users/${app.owner.id}`} className="text-[var(--primary)]">
              Open user
            </Link>
            <Link href={`/app/mail/${app.appId}?tab=analytics`} className="text-[var(--primary)]">
              Open analytics
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
