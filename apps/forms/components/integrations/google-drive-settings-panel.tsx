'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@heroui/react';
import { Cloud, HardDrive, Link2 } from 'lucide-react';
import {
  getGoogleDriveStatus,
  type GoogleDriveStatus,
} from '@/lib/google-drive-api';
import { getGoogleSheetsConnectUrl } from '@/lib/google-sheets-api';

const RETURN_TAB_KEY = 'integrations-return-tab';

export function markDriveOAuthReturn(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(RETURN_TAB_KEY, 'drive');
}

interface GoogleDriveSettingsPanelProps {
  formId: string;
  onOpenSheetsTab?: () => void;
  justConnected?: boolean;
  onDismissConnected?: () => void;
}

export function GoogleDriveSettingsPanel({
  formId,
  onOpenSheetsTab,
  justConnected = false,
  onDismissConnected,
}: GoogleDriveSettingsPanelProps) {
  const [status, setStatus] = useState<GoogleDriveStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await getGoogleDriveStatus(formId));
    } catch {
      setStatus({ connected: false });
    }
  }, [formId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!justConnected) return;
    void load();
    setError(null);
    setSuccess('تم ربط Google Drive بنجاح');
    onDismissConnected?.();
  }, [justConnected, load, onDismissConnected]);

  async function connectViaGoogle() {
    setBusy(true);
    setError(null);
    try {
      markDriveOAuthReturn();
      const { authUrl } = await getGoogleSheetsConnectUrl(formId);
      window.location.href = authUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر الاتصال');
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)]/80 bg-[var(--surface-secondary)]/40 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--foreground)]">
              <HardDrive className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Google Drive
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted-foreground)]">
                {status?.connected
                  ? 'متصل — تُرفع المرفقات والتوقيعات إلى مجلد خاص في Drive'
                  : 'اربط حساب Google لتخزين الملفات والتوقيعات في Drive بدل التخزين المحلي'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {status?.connected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <Cloud className="size-3.5" />
                متصل
              </span>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  className="rounded-full"
                  isDisabled={busy}
                  onPress={() => void connectViaGoogle()}
                >
                  ربط Google
                </Button>
                {onOpenSheetsTab ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onPress={onOpenSheetsTab}
                  >
                    <Link2 className="size-4" data-slot="icon" />
                    من تبويب Sheets
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </div>
        {success ? (
          <p className="mt-2 text-xs text-[var(--success)]" role="status">
            {success}
          </p>
        ) : null}
        {error ? (
          <p className="mt-2 text-xs text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-[var(--border)]/50 bg-[var(--surface)]/60 px-4 py-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
        <p className="font-medium text-[var(--foreground)]">كيف يعمل؟</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            يستخدم Drive نفس اتصال Google Sheets (صلاحية{' '}
            <span dir="ltr">drive.file</span>).
          </li>
          <li>
            حقول الملفات والتوقيع في النموذج العام تُرفع تلقائياً إلى مجلد
            النموذج عند الاتصال.
          </li>
          <li>
            بدون اتصال، تُخزَّن الملفات محلياً أو كبيانات مؤقتة حسب إعدادات
            الخادم.
          </li>
        </ul>
      </div>
    </div>
  );
}
