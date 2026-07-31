'use client';

import type { AdminFormDetail } from '@/lib/types/forms';
import { formatFormDateTime, yesNo } from '@/lib/forms-format';
import { formatNumber } from '@/lib/dashboard-format';
import { detailPanelClassName } from '@/components/ui/pill-tab';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border)]/60 py-2.5 last:border-0">
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      <span className="max-w-[65%] break-all text-end text-xs font-medium text-[var(--foreground)]" dir="ltr">
        {value}
      </span>
    </div>
  );
}

export function FormSettingsPanel({ form }: { form: AdminFormDetail }) {
  const webhookEvents =
    form.webhookEvents.length > 0 ? form.webhookEvents.join(', ') : '—';

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          Submission rules
        </h2>
        <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-1">
          <DetailRow
            label="Multiple submissions"
            value={yesNo(form.allowMultipleSubmissions)}
          />
          <DetailRow
            label="One response per user"
            value={yesNo(form.oneResponsePerUser)}
          />
          <DetailRow
            label="Requires sign-in"
            value={yesNo(form.requiresAuthentication)}
          />
          <DetailRow
            label="Turnstile on submit"
            value={yesNo(form.requireTurnstileOnSubmit)}
          />
          <DetailRow
            label="Max submissions"
            value={
              form.maxSubmissions != null
                ? formatNumber(form.maxSubmissions)
                : 'Unlimited'
            }
          />
          <DetailRow
            label="Submission limit"
            value={
              form.submissionLimit != null
                ? formatNumber(form.submissionLimit)
                : '—'
            }
          />
        </div>
      </section>

      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          Display & flow
        </h2>
        <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-1">
          <DetailRow label="Progress bar" value={yesNo(form.showProgressBar)} />
          <DetailRow
            label="Question numbers"
            value={yesNo(form.showQuestionNumbers)}
          />
          <DetailRow label="Shuffle questions" value={yesNo(form.shuffleQuestions)} />
          <DetailRow label="Multi-step" value={yesNo(form.isMultiStep)} />
          <DetailRow label="Close after date" value={yesNo(form.closeAfterDate)} />
        </div>
      </section>

      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          Notifications
        </h2>
        <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-1">
          <DetailRow
            label="Notify on submission"
            value={yesNo(form.notifyOnSubmission)}
          />
          <DetailRow
            label="Notification email"
            value={form.notificationEmail?.trim() || '—'}
          />
          <DetailRow
            label="Auto-response"
            value={yesNo(form.autoResponseEnabled)}
          />
        </div>
      </section>

      <section className={detailPanelClassName}>
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          Webhooks & integrations
        </h2>
        <div className="rounded-2xl bg-[var(--surface-secondary)] px-4 py-1">
          <DetailRow label="Webhook enabled" value={yesNo(form.webhookEnabled)} />
          <DetailRow label="Webhook URL" value={form.webhookUrl?.trim() || '—'} />
          <DetailRow label="Webhook events" value={webhookEvents} />
        </div>

        {form.integrations.length > 0 ? (
          <div className="mt-3 space-y-2">
            {form.integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between rounded-xl bg-[var(--surface-secondary)] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">
                    {integration.name || integration.type}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {integration.type}
                    {integration.lastSyncAt
                      ? ` · Last sync ${formatFormDateTime(integration.lastSyncAt)}`
                      : ''}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                  {integration.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            No integrations connected.
          </p>
        )}
      </section>
    </div>
  );
}
