'use client';

import type { AdminFormDetail, FormDeletionLogEntry } from '@/lib/types/forms';
import { formatFormDateTime, formatFormStatus, formatFormType } from '@/lib/forms-format';
import { detailPanelClassName } from '@/components/ui/pill-tab';

function LogRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)]/60 py-2 last:border-0">
      <span className="text-[11px] text-[var(--muted-foreground)]">{label}</span>
      <span
        className="max-w-[70%] text-end text-[11px] font-medium text-[var(--foreground)]"
        dir="ltr"
      >
        {value}
      </span>
    </div>
  );
}

function DeletionLogCard({ log }: { log: FormDeletionLogEntry }) {
  const outcome = log.purgedAt
    ? 'Permanently purged'
    : log.restoredAt
      ? 'Restored'
      : 'Pending purge';

  return (
    <article className="rounded-xl border border-[var(--border)]/70 bg-[var(--surface-secondary)]/40 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[var(--foreground)]">{outcome}</span>
        <span className="text-[10px] text-[var(--muted-foreground)]" dir="ltr">
          {formatFormDateTime(log.createdAt)}
        </span>
      </div>
      <div className="space-y-0">
        <LogRow
          label="Submissions at delete"
          value={log.submissionCount.toLocaleString('en-US')}
        />
        <LogRow label="Status" value={formatFormStatus(log.statusAtDelete)} />
        <LogRow label="Type" value={formatFormType(log.typeAtDelete)} />
        {log.reason ? <LogRow label="Reason" value={log.reason} /> : null}
        <LogRow
          label="Purge scheduled"
          value={formatFormDateTime(log.purgeScheduledAt)}
        />
        {log.restoredAt ? (
          <LogRow label="Restored" value={formatFormDateTime(log.restoredAt)} />
        ) : null}
        {log.purgedAt ? (
          <LogRow label="Purged" value={formatFormDateTime(log.purgedAt)} />
        ) : null}
        {log.ipAddress ? <LogRow label="IP" value={log.ipAddress} /> : null}
      </div>
    </article>
  );
}

export function FormDeletionPanel({ form }: { form: AdminFormDetail }) {
  if (!form.deletedAt && form.deletionLogs.length === 0) {
    return null;
  }

  return (
    <section className={detailPanelClassName}>
      <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
        Deletion audit
      </h2>

      {form.deletedAt ? (
        <div className="mb-4 rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/8 px-3 py-2.5 text-xs text-[var(--foreground)]">
          <p className="font-medium text-[var(--danger)]">This form is in trash</p>
          <p className="mt-1 text-[var(--muted-foreground)]">
            Deleted {formatFormDateTime(form.deletedAt)}
            {form.purgeScheduledAt
              ? ` · permanent purge scheduled ${formatFormDateTime(form.purgeScheduledAt)}`
              : ''}
          </p>
          {form.deletionReason ? (
            <p className="mt-1 text-[var(--muted-foreground)]">
              Reason: {form.deletionReason}
            </p>
          ) : null}
          {form.deletedBy ? (
            <p className="mt-1 text-[var(--muted-foreground)]" dir="ltr">
              Deleted by {form.deletedBy.email}
            </p>
          ) : null}
        </div>
      ) : null}

      {form.deletionLogs.length > 0 ? (
        <div className="space-y-2">
          {form.deletionLogs.map((log) => (
            <DeletionLogCard key={log.id} log={log} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--muted-foreground)]">No deletion events recorded.</p>
      )}
    </section>
  );
}
