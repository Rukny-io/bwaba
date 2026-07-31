'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2, Zap } from 'lucide-react';
import { useTranslations } from '@/components/providers/translations-provider';
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

const cardClass =
  'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:rounded-3xl';

export function WhatsappWebhooksPanel() {
  const w = useTranslations().whatsapp;
  const { data: webhooks, isLoading } = useWebhooks();
  const { createMutation, deleteMutation, testMutation } = useWebhookMutations();

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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--primary-foreground)]"
        >
          <Plus className="size-3.5" />
          {w.addWebhook}
        </button>
      </div>

      {newSecret && (
        <section className="rounded-2xl border border-[color-mix(in_srgb,var(--warning)_40%,var(--border))] bg-[color-mix(in_srgb,var(--warning)_8%,var(--background))] p-4">
          <p className="text-xs font-medium text-[var(--foreground)]">{w.webhookSecretOnce}</p>
          <code className="mt-2 block break-all font-mono text-xs" dir="ltr">
            {newSecret}
          </code>
        </section>
      )}

      {showForm && (
        <section className={cn(cardClass, 'space-y-3')}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={w.webhookUrl}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            dir="ltr"
          />
          <p className="text-xs font-medium text-[var(--muted-foreground)]">{w.webhookEvents}</p>
          <div className="flex flex-wrap gap-2">
            {WEBHOOK_EVENTS.map((event) => (
              <button
                key={event}
                type="button"
                onClick={() => toggleEvent(event)}
                className={cn(
                  'rounded-full px-2.5 py-1 font-mono text-[10px] transition-colors',
                  events.includes(event)
                    ? 'bg-[var(--foreground)] text-[var(--background)]'
                    : 'bg-[var(--surface-secondary)] text-[var(--foreground)]',
                )}
              >
                {event}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={!url.trim() || events.length === 0 || createMutation.isPending}
            onClick={() =>
              createMutation.mutate(
                { url: url.trim(), events },
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
            className="rounded-full bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-[var(--primary-foreground)] disabled:opacity-50"
          >
            {w.addWebhook}
          </button>
        </section>
      )}

      {!webhooks?.length ? (
        <section className={cn(cardClass, 'text-center text-sm text-[var(--muted-foreground)]')}>
          {w.noWebhooks}
        </section>
      ) : (
        webhooks.map((hook) => (
          <section key={hook.id} className={cn(cardClass, 'space-y-2')}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <code className="break-all font-mono text-xs text-[var(--foreground)]" dir="ltr">
                {hook.url}
              </code>
              <span className="rounded-full bg-[var(--surface-secondary)] px-2 py-0.5 text-[10px] font-semibold uppercase">
                {hook.status}
              </span>
            </div>
            <p className="font-mono text-[10px] text-[var(--muted-foreground)]">
              {hook.events.join(', ')}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={testMutation.isPending}
                onClick={() =>
                  testMutation.mutate(hook.id, {
                    onSuccess: () => appToast.success(w.testWebhook),
                    onError: (e) => appToast.error(getApiErrorMessage(e)),
                  })
                }
                className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1 text-xs"
              >
                <Zap className="size-3" />
                {w.testWebhook}
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() =>
                  deleteMutation.mutate(hook.id, {
                    onSuccess: () => appToast.success('OK'),
                    onError: (e) => appToast.error(getApiErrorMessage(e)),
                  })
                }
                className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,var(--danger)_30%,var(--border))] px-3 py-1 text-xs text-[var(--danger)]"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
