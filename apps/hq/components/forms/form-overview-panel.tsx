'use client';

import Link from 'next/link';
import { Eye, FileText, Inbox, UserRound } from 'lucide-react';
import type { AdminFormDetail } from '@/lib/types/forms';
import { FormsTableOwnerCell } from '@/components/forms/forms-table-owner-cell';
import { getFormEditorUrl, getFormPreviewUrl } from '@/lib/forms-url';
import {
  formatFormDateTime,
  formatFormStatus,
  formatFormType,
} from '@/lib/forms-format';
import { formatNumber } from '@/lib/dashboard-format';
import { detailPanelClassName } from '@/components/ui/pill-tab';
import { Button } from '@heroui/react';

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
  icon: typeof Eye;
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

export function FormOverviewPanel({ form }: { form: AdminFormDetail }) {
  const completionRate =
    form.viewCount > 0
      ? `${Math.round((form.submissionCount / form.viewCount) * 1000) / 10}%`
      : '—';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile icon={Eye} label="Views" value={formatNumber(form.viewCount)} />
        <MetricTile
          icon={Inbox}
          label="Submissions"
          value={formatNumber(form.submissionCount)}
        />
        <MetricTile
          icon={FileText}
          label="Fields"
          value={formatNumber(form.counts.fields)}
        />
        <MetricTile icon={Eye} label="Completion" value={completionRate} />
      </div>

      <p className="text-[11px] text-[var(--muted-foreground)]">
        Submission counts are aggregate only — individual responses are not shown in HQ for
        privacy.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={detailPanelClassName}>
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Form info</h2>
          <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-1">
            <DetailRow label="Type" value={formatFormType(form.type)} />
            <DetailRow label="Status" value={formatFormStatus(form.status)} />
            <DetailRow label="Slug" value={`/${form.slug}`} />
            <DetailRow label="Description" value={form.description?.trim() || '—'} />
            <DetailRow
              label="Structure"
              value={
                form.isMultiStep
                  ? `Multi-step (${form.counts.steps} steps)`
                  : 'Single page'
              }
            />
          </div>
        </section>

        <section className={detailPanelClassName}>
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Owner</h2>
          <div className="rounded-2xl bg-[var(--surface-secondary)] p-3">
            <FormsTableOwnerCell owner={form.owner} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/app/users/${form.owner.id}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[var(--surface-secondary)] px-3 text-xs font-medium transition-colors hover:bg-[var(--surface-tertiary)]"
            >
              <UserRound className="size-3.5" />
              User profile
            </Link>
            <Button
              size="sm"
              variant="tertiary"
              className="rounded-lg"
              onPress={() =>
                window.open(getFormEditorUrl(form.id), '_blank', 'noopener,noreferrer')
              }
            >
              Open in Forms
            </Button>
          </div>
        </section>

        <section className={detailPanelClassName}>
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Timeline</h2>
          <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-1">
            <DetailRow label="Created" value={formatFormDateTime(form.createdAt)} />
            <DetailRow label="Updated" value={formatFormDateTime(form.updatedAt)} />
            <DetailRow label="Opens" value={formatFormDateTime(form.opensAt)} />
            <DetailRow label="Closes" value={formatFormDateTime(form.closesAt)} />
          </div>
        </section>

        <section className={detailPanelClassName}>
          <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Quick links</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="tertiary"
              className="rounded-lg"
              onPress={() =>
                window.open(getFormPreviewUrl(form.slug), '_blank', 'noopener,noreferrer')
              }
            >
              Preview form
            </Button>
            {form.linkedStore ? (
              <span className="inline-flex h-8 items-center rounded-lg bg-[var(--surface-secondary)] px-3 text-xs text-[var(--muted-foreground)]">
                Store: {form.linkedStore.name}
              </span>
            ) : null}
            {form.linkedEvent ? (
              <span className="inline-flex h-8 items-center rounded-lg bg-[var(--surface-secondary)] px-3 text-xs text-[var(--muted-foreground)]">
                Event: {form.linkedEvent.title}
              </span>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
