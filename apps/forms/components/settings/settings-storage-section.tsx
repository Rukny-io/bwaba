'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, HardDrive, RefreshCw } from 'lucide-react';
import { Button, Skeleton } from '@heroui/react';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { ApiException } from '@/lib/api-client';
import { loadStorageUsageSummary } from '@/lib/storage-api';
import {
  formatStorageBytes,
  storageBarWidth,
} from '@/lib/storage-format';
import type { StorageUsageSummary } from '@/lib/storage-usage';
import { cn } from '@/lib/utils';

function progressTone(percentage: number): string {
  if (percentage >= 90) return 'bg-[var(--danger)]';
  if (percentage >= 75) return 'bg-[var(--warning)]';
  return 'bg-[var(--foreground)]';
}

function StorageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
        <Skeleton className="h-10 rounded-xl" />
      </div>
    </div>
  );
}

function UsageBar({
  label,
  bytes,
  total,
  tone = 'bg-[var(--foreground)]',
  hint,
}: {
  label: string;
  bytes: number;
  total: number;
  tone?: string;
  hint?: string;
}) {
  const width = storageBarWidth(bytes, total);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[var(--foreground)]">
            {label}
          </p>
          {hint ? (
            <p className="text-[11px] text-[var(--muted-foreground)]">{hint}</p>
          ) : null}
        </div>
        <span
          className="shrink-0 text-[12px] font-semibold tabular-nums text-[var(--muted-foreground)]"
          dir="ltr"
          lang="en"
        >
          {formatStorageBytes(bytes)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', tone)}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function StorageContent({ storage }: { storage: StorageUsageSummary }) {
  const formsShare =
    storage.used > 0
      ? Math.round((storage.formsUsed / storage.used) * 100)
      : 0;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]/35 px-3.5 py-3.5 sm:rounded-3xl sm:px-4 sm:py-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p
              className="text-[1.75rem] font-bold leading-none tabular-nums text-[var(--foreground)] sm:text-[2rem]"
              dir="ltr"
              lang="en"
            >
              {storage.usedLabel}
            </p>
            <p className="mt-1.5 text-[12px] text-[var(--muted-foreground)]">
              من أصل{' '}
              <span className="font-medium text-[var(--foreground)]" dir="ltr" lang="en">
                {storage.limitLabel}
              </span>
            </p>
          </div>
          <div className="text-end">
            <p
              className="text-xl font-bold tabular-nums text-[var(--foreground)] sm:text-2xl"
              dir="ltr"
              lang="en"
            >
              {storage.percentage}%
            </p>
            <p className="text-[10px] text-[var(--muted-foreground)]">مستخدم</p>
          </div>
        </div>

        <div
          className="h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]"
          role="progressbar"
          aria-valuenow={storage.percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="نسبة استخدام مساحة التخزين"
        >
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-500',
              progressTone(storage.percentage),
            )}
            style={{
              width: `${Math.max(storage.percentage > 0 ? 2 : 0, Math.min(100, storage.percentage))}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function SettingsStorageSection() {
  const [storage, setStorage] = useState<StorageUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await loadStorageUsageSummary();
      setStorage(summary);
    } catch (e) {
      setError(
        e instanceof ApiException
          ? e.message
          : 'تعذّر تحميل بيانات التخزين',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SettingsSectionCard
      icon={HardDrive}
      title="مساحة التخزين (S3)"
      description="5 GB لكل مستخدم — أغلفة النماذج ومرفقات الاستجابات."
    >
      {loading && !storage ? (
        <StorageSkeleton />
      ) : error ? (
        <div className="rounded-2xl border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-4 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--danger)]" />
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-sm text-[var(--danger)]">{error}</p>
              <Button
                variant="tertiary"
                size="sm"
                className="rounded-xl"
                onPress={() => void load()}
              >
                <RefreshCw className="size-4" />
                إعادة المحاولة
              </Button>
            </div>
          </div>
        </div>
      ) : storage ? (
        <StorageContent storage={storage} />
      ) : null}
    </SettingsSectionCard>
  );
}
