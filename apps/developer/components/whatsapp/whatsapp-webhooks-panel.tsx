'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2, Webhook, Zap } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
import { useCurrentApp } from '@/components/providers/app-context';
import { DashboardGrid } from '@/components/dashboard/dashboard-ui';
import { DashboardMetricCard } from '@/components/dashboard/dashboard-metric-card';
import {
  WhatsappEmptyState,
  whatsappBtnDanger,
  whatsappBtnPrimary,
  whatsappBtnSecondary,
  whatsappInputClass,
} from '@/components/whatsapp/whatsapp-ui';
import { useWebhookMutations, useWebhooks } from '@/hooks/use-webhooks';
import { appToast, getApiErrorMessage } from '@/lib/app-toast';
import { cn } from '@/lib/utils';

const WEBHOOK_EVENTS = [
  'message.sent',
  'message.delivered',
  'message.read',
  'message.failed',
  'message.received',
  'template.approved',
  'template.rejected',
] as const;

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function WhatsappWebhooksPanel() {
  const w = useTranslations().whatsapp;
  const { app } = useCurrentApp();
  const { data: webhooks, isLoading } = useWebhooks(app.appId);
  const { createMutation, deleteMutation, testMutation } = useWebhookMutations(
    app.appId,
  );

  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>(['message.delivered', 'message.received']);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  function toggleEvent(event: string) {
    setEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    );
  }

  const list = webhooks ?? [];
  const activeCount = list.filter((h) => h.status === 'ACTIVE').length;

  return (
    <div className="dashboard-section-stack">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-[var(--muted-foreground)]">{w.webhooksPageDesc}</p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className={whatsappBtnPrimary}
        >
          <Plus className="size-3.5" />
          {w.addWebhook}
        </button>
      </div>

      <DashboardGrid>
        <DashboardMetricCard
          icon={Webhook}
          label={w.metricWebhooksTotal}
          value={formatCount(list.length)}
          comparisonPrimary={w.metricWebhooksTotalHint}
        />
        <DashboardMetricCard
          icon={Zap}
          label={w.metricWebhooksActive}
          value={formatCount(activeCount)}
          comparisonPrimary={w.metricWebhooksActiveHint}
        />
      </DashboardGrid>

      {newSecret ? (
        <section className="rounded-2xl bg-[color-mix(in_srgb,var(--warning)_8%,var(--surface))] p-4 sm:p-5">
          <p className="text-[13px] font-medium text-[var(--foreground)]">{w.webhookSecretOnce}</p>
          <code className="mt-2 block break-all font-mono text-xs" dir="ltr">
            {newSecret}
          </code>
        </section>
      ) : null}

      {showForm ? (
        <section className="dashboard-panel space-y-4 rounded-2xl p-5 sm:rounded-3xl sm:p-6">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={w.webhookUrl}
            className={whatsappInputClass}
            dir="ltr"
          />
          <div>
            <p className="mb-2 text-[12.5px] font-medium text-[var(--muted-foreground)]">
              {w.webhookEvents}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {WEBHOOK_EVENTS.map((event) => (
                <button
                  key={event}
                  type="button"
                  onClick={() => toggleEvent(event)}
                  className={cn(
                    'rounded-xl px-2.5 py-1.5 font-mono text-[11px] transition-colors',
                    events.includes(event)
                      ? 'bg-[var(--foreground)] text-[var(--background)]'
                      : 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
                  )}
                >
                  {event}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            disabled={!url.trim() || events.length === 0 || createMutation.isPending}
            onClick={() =>
              createMutation.mutate(
                { url: url.trim(), events, appId: app.appId },
                {
                  onSuccess: (created) => {
                    setNewSecret(created.secret);
                    setUrl('');
                    setShowForm(false);
                    appToast.success(w.addWebhook);
                  },
                  onError: (e) => appToast.error(getApiErrorMessage(e)),
                },
              )
            }
            className={whatsappBtnPrimary}
          >
            {w.addWebhook}
          </button>
        </section>
      ) : null}

      {!list.length ? (
        <WhatsappEmptyState
          icon={Webhook}
          title={w.noWebhooks}
          description={w.webhooksEmptyDesc}
          action={
            <button type="button" onClick={() => setShowForm(true)} className={whatsappBtnPrimary}>
              <Plus className="size-3.5" />
              {w.addWebhook}
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {list.map((hook) => (
            <section
              key={hook.id}
              className="dashboard-panel space-y-3 rounded-2xl p-4 sm:rounded-3xl sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <code
                  className="break-all font-mono text-[13px] text-[var(--foreground)]"
                  dir="ltr"
                >
                  {hook.url}
                </code>
                <span className="rounded-lg bg-[var(--surface-secondary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  {hook.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {hook.events.map((event) => (
                  <span
                    key={event}
                    className="rounded-lg bg-[var(--surface-secondary)] px-2 py-1 font-mono text-[11px] text-[var(--muted-foreground)]"
                    dir="ltr"
                  >
                    {event}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled={testMutation.isPending}
                  onClick={() =>
                    testMutation.mutate(hook.id, {
                      onSuccess: () => appToast.success(w.testWebhook),
                      onError: (e) => appToast.error(getApiErrorMessage(e)),
                    })
                  }
                  className={whatsappBtnSecondary}
                >
                  <Zap className="size-3.5" />
                  {w.testWebhook}
                </button>
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() =>
                    deleteMutation.mutate(hook.id, {
                      onSuccess: () => appToast.success(w.deleteWebhookDone),
                      onError: (e) => appToast.error(getApiErrorMessage(e)),
                    })
                  }
                  className={whatsappBtnDanger}
                >
                  <Trash2 className="size-3.5" />
                  {w.deleteWebhook}
                </button>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
