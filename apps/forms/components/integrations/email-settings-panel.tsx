'use client';

import { useState } from 'react';
import { Button } from '@heroui/react';
import {
  updateFormIntegrations,
  type IntegrationsFormRow,
} from '@/lib/integrations-api';
import { fieldInputClass } from '@/components/forms/shared/form-field-input-class';
import { FormDetailSwitchRow } from '@/components/forms/form-detail/form-detail-primitives';
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
    <div className="flex flex-col gap-[12px]">
      <FormDetailSwitchRow
        label="إشعار بريدي عند استجابة"
        hint="يُرسل بريد فوري إلى العنوان المحدّد عند كل إرسال جديد."
        checked={enabled}
        onChange={setEnabled}
      />

      <div className="space-y-2 text-start">
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
