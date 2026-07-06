'use client';

import { useState } from 'react';
import { Button, Switch } from '@heroui/react';
import {
  updateFormIntegrations,
  type IntegrationsFormRow,
} from '@/lib/integrations-api';
import { fieldInputClass } from '@/components/forms/shared/form-field-input-class';
import { appToast } from '@/lib/app-toast';
import { cn } from '@/lib/utils';

interface EmailSettingsPanelProps {
  form: IntegrationsFormRow;
  onSaved: () => void;
}

export function EmailSettingsPanel({ form, onSaved }: EmailSettingsPanelProps) {
  const [enabled, setEnabled] = useState(form.email.enabled);
  const [address, setAddress] = useState(form.email.address ?? '');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await updateFormIntegrations(form.id, {
        notifyOnSubmission: enabled,
        notificationEmail: address.trim() || undefined,
      });
      appToast.success('تم حفظ إعدادات البريد');
      onSaved();
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : 'تعذّر الحفظ');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 rounded-2xl border border-[var(--border)]/60 bg-[var(--surface-secondary)]/40 px-4 py-3.5">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-[var(--foreground)]">
            إشعار بريدي عند استجابة
          </p>
          <p className="text-[13px] text-[var(--muted-foreground)]">
            يُرسل بريد فوري إلى العنوان المحدّد عند كل إرسال جديد.
          </p>
        </div>
        <Switch
          isSelected={enabled}
          onChange={setEnabled}
          aria-label="تفعيل إشعار البريد"
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--foreground)]">
          بريد التنبيه
        </label>
        <input
          type="email"
          dir="ltr"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="you@example.com"
          className={cn(fieldInputClass, 'px-3 py-2.5 text-sm')}
        />
      </div>

      <Button
        size="sm"
        variant="primary"
        className="rounded-full"
        isDisabled={busy}
        onPress={() => void save()}
      >
        {busy ? 'جاري الحفظ…' : 'حفظ'}
      </Button>
    </div>
  );
}
