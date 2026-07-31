'use client';

import { useState } from 'react';
import { Button, Switch } from '@heroui/react';
import { Copy, RefreshCw, Zap } from 'lucide-react';
import {
  regenerateWebhookSecret,
  testFormWebhook,
  updateFormIntegrations,
  WEBHOOK_EVENT_OPTIONS,
  type IntegrationsFormRow,
} from '@/lib/integrations-api';
import { fieldInputClass } from '@/components/forms/shared/form-field-input-class';
import { PlanFeatureGate } from '@/components/plan/plan-feature-gate';
import { appToast } from '@/lib/app-toast';
import { cn } from '@/lib/utils';

interface WebhookSettingsPanelProps {
  form: IntegrationsFormRow;
  onSaved: () => void;
}

export function WebhookSettingsPanel({
  form,
  onSaved,
}: WebhookSettingsPanelProps) {
  const [enabled, setEnabled] = useState(form.webhook.enabled);
  const [url, setUrl] = useState(form.webhook.url ?? '');
  const [events, setEvents] = useState<string[]>(
    form.webhook.events.length > 0
      ? form.webhook.events
      : ['form.submission.created'],
  );
  const [secret, setSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  function notifySuccess(text: string) {
    appToast.success(text);
  }

  function notifyError(text: string) {
    appToast.error(text);
  }

  function toggleEvent(value: string) {
    setEvents((prev) =>
      prev.includes(value)
        ? prev.filter((e) => e !== value)
        : [...prev, value],
    );
  }

  async function save() {
    setBusy('save');
    try {
      await updateFormIntegrations(form.id, {
        webhookEnabled: enabled,
        webhookUrl: url.trim() || undefined,
        webhookEvents: events,
      });
      notifySuccess('تم حفظ إعدادات Webhook');
      onSaved();
    } catch (e) {
      notifyError(e instanceof Error ? e.message : 'تعذّر الحفظ');
    } finally {
      setBusy(null);
    }
  }

  async function runTest() {
    setBusy('test');
    try {
      if (url.trim() !== (form.webhook.url ?? '').trim() || enabled !== form.webhook.enabled) {
        await updateFormIntegrations(form.id, {
          webhookEnabled: enabled,
          webhookUrl: url.trim() || undefined,
          webhookEvents: events,
        });
      }
      const result = await testFormWebhook(form.id);
      if (result.success) {
        notifySuccess(
          `نجح الاختبار — ${result.statusCode ?? 200} (${result.latencyMs}ms)`,
        );
      } else {
        notifyError(
          result.errorMessage ?? `فشل الاختبار (${result.statusCode ?? '—'})`,
        );
      }
      onSaved();
    } catch (e) {
      notifyError(e instanceof Error ? e.message : 'تعذّر إرسال الاختبار');
    } finally {
      setBusy(null);
    }
  }

  async function runRegenerateSecret() {
    setBusy('secret');
    try {
      const { webhookSecret } = await regenerateWebhookSecret(form.id);
      setSecret(webhookSecret);
      notifySuccess('تم إنشاء مفتاح جديد — انسخه الآن، لن يُعرض مرة أخرى');
    } catch (e) {
      notifyError(e instanceof Error ? e.message : 'تعذّر إنشاء المفتاح');
    } finally {
      setBusy(null);
    }
  }

  async function copySecret() {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    notifySuccess('تم نسخ المفتاح');
  }

  return (
    <PlanFeatureGate feature="webhook">
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--border)]/60 bg-[var(--surface-secondary)]/40 px-4 py-3.5">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-[var(--foreground)]">
            تفعيل Webhook
          </p>
          <p className="text-[13px] text-[var(--muted-foreground)]">
            إرسال حدث POST عند كل استجابة جديدة أو محدّثة.
          </p>
        </div>
        <Switch
          isSelected={enabled}
          onChange={setEnabled}
          aria-label="تفعيل Webhook"
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--foreground)]">
          رابط Webhook
        </label>
        <input
          type="url"
          dir="ltr"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/webhook"
          className={cn(fieldInputClass, 'px-3 py-2.5 text-sm')}
        />
        <p className="text-xs text-[var(--muted-foreground)]">
          يُوقَّع الطلب بـ{' '}
          <code className="text-[11px]">X-Webhook-Signature</code> عند وجود
          مفتاح سري.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--foreground)]">الأحداث</p>
        <div className="flex flex-wrap gap-2">
          {WEBHOOK_EVENT_OPTIONS.map((opt) => {
            const active = events.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleEvent(opt.value)}
                aria-pressed={active}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'border-[var(--foreground)]/20 bg-[var(--foreground)] text-[var(--background)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] hover:border-[var(--foreground)]/15',
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="primary"
          className="rounded-full"
          isDisabled={busy !== null}
          onPress={() => void save()}
        >
          {busy === 'save' ? 'جاري الحفظ…' : 'حفظ'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          isDisabled={busy !== null || !url.trim()}
          onPress={() => void runTest()}
        >
          <Zap className="size-4" data-slot="icon" />
          {busy === 'test' ? 'جاري الاختبار…' : 'اختبار'}
        </Button>
        <Button
          size="sm"
          variant="tertiary"
          className="rounded-full"
          isDisabled={busy !== null}
          onPress={() => void runRegenerateSecret()}
        >
          <RefreshCw className="size-4" data-slot="icon" />
          {busy === 'secret' ? 'جاري الإنشاء…' : 'مفتاح جديد'}
        </Button>
      </div>

      {secret ? (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)]/80 bg-[var(--surface-secondary)]/50 px-3 py-2">
          <code
            className="min-w-0 flex-1 truncate text-xs text-[var(--foreground)]"
            dir="ltr"
          >
            {secret}
          </code>
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0 rounded-full"
            onPress={() => void copySecret()}
          >
            <Copy className="size-4" data-slot="icon" />
            نسخ
          </Button>
        </div>
      ) : null}
    </div>
    </PlanFeatureGate>
  );
}
