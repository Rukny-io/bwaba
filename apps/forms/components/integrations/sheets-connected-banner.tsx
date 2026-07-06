'use client';

import { useState } from 'react';
import { Button } from '@heroui/react';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { setGoogleSheetsAutoSync } from '@/lib/google-sheets-api';
import type { IntegrationsFormRow } from '@/lib/integrations-api';

interface SheetsConnectedBannerProps {
  form: IntegrationsFormRow;
  onRefresh: () => void;
  onDismiss: () => void;
}

export function SheetsConnectedBanner({
  form,
  onRefresh,
  onDismiss,
}: SheetsConnectedBannerProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sheets = form.googleSheets;

  async function enableAutoSync() {
    setBusy(true);
    setError(null);
    try {
      await setGoogleSheetsAutoSync(form.id, true);
      onRefresh();
      onDismiss();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تفعيل المزامنة');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-[var(--success)]/30 bg-[var(--success)]/8 px-4 py-3.5">
      <div className="flex flex-wrap items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--success)]" />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            تم ربط Google Sheets بنجاح
          </p>
          <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
            {sheets.isAutoSync
              ? 'المزامنة التلقائية مفعّلة — كل استجابة جديدة ستُضاف للجدول.'
              : 'الخطوة التالية: فعّل المزامنة التلقائية لتصل الاستجابات فوراً دون تصدير يدوي.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {!sheets.isAutoSync ? (
              <Button
                size="sm"
                variant="primary"
                className="rounded-full"
                isDisabled={busy}
                onPress={() => void enableAutoSync()}
              >
                {busy ? 'جاري التفعيل…' : 'تفعيل المزامنة التلقائية'}
              </Button>
            ) : null}
            {sheets.spreadsheetUrl ? (
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onPress={() =>
                  window.open(sheets.spreadsheetUrl!, '_blank', 'noopener,noreferrer')
                }
              >
                <ExternalLink className="size-4" data-slot="icon" />
                فتح الجدول
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full"
              onPress={onDismiss}
            >
              تم
            </Button>
          </div>
          {error ? (
            <p className="text-xs text-[var(--danger)]" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
