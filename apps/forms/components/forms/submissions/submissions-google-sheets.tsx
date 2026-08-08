'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@heroui/react';
import { ExternalLink, Sheet } from 'lucide-react';
import { formDetailCardClass } from '@/lib/form-detail-styles';
import {
  disconnectGoogleSheets,
  exportToGoogleSheets,
  getGoogleSheetsConnectUrl,
  getGoogleSheetsStatus,
  setGoogleSheetsAutoSync,
  type GoogleSheetsStatus,
} from '@/lib/google-sheets-api';

export function SubmissionsGoogleSheetsPanel({ formId }: { formId: string }) {
  const [status, setStatus] = useState<GoogleSheetsStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await getGoogleSheetsStatus(formId));
    } catch {
      setStatus({ connected: false });
    }
  }, [formId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('sheets_connected') !== 'true') return;

    void load();
    setError(null);
    setSuccess('تم ربط Google Sheets بنجاح');

    params.delete('sheets_connected');
    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    window.history.replaceState(null, '', next);
  }, [load]);

  async function connect() {
    setBusy('connect');
    setError(null);
    try {
      const { authUrl } = await getGoogleSheetsConnectUrl(formId);
      window.location.href = authUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر الاتصال');
      setBusy(null);
    }
  }

  async function runExport() {
    setBusy('export');
    setError(null);
    try {
      await exportToGoogleSheets(formId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر التصدير');
    } finally {
      setBusy(null);
    }
  }

  async function toggleAutoSync() {
    if (!status) return;
    setBusy('sync');
    setError(null);
    try {
      await setGoogleSheetsAutoSync(formId, !status.isAutoSync);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر تحديث المزامنة');
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    setBusy('disconnect');
    setError(null);
    try {
      await disconnectGoogleSheets(formId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذّر قطع الاتصال');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={formDetailCardClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Google Sheets
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              {status?.connected
                ? 'متصل — يمكنك التصدير أو المزامنة التلقائية'
                : 'اربط حساب Google لتصدير الاستجابات'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!status?.connected ? (
            <Button
              size="sm"
              variant="primary"
              className="rounded-full"
              isDisabled={busy !== null}
              onPress={() => void connect()}
            >
              ربط Google Sheets
            </Button>
          ) : (
            <>
              {status.spreadsheetUrl ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onPress={() => {
                    if (status.spreadsheetUrl) {
                      window.open(status.spreadsheetUrl, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  <ExternalLink className="size-4" data-slot="icon" />
                  فتح الجدول
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                isDisabled={busy !== null}
                onPress={() => void runExport()}
              >
                {busy === 'export' ? 'جاري التصدير…' : 'تصدير الآن'}
              </Button>
              <Button
                size="sm"
                variant="tertiary"
                className="rounded-full"
                isDisabled={busy !== null}
                onPress={() => void toggleAutoSync()}
              >
                {status.isAutoSync ? 'إيقاف المزامنة' : 'مزامنة تلقائية'}
              </Button>
              <Button
                size="sm"
                variant="tertiary"
                className="rounded-full text-[var(--danger)]"
                isDisabled={busy !== null}
                onPress={() => void disconnect()}
              >
                قطع الاتصال
              </Button>
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
  );
}
