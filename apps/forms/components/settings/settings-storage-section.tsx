'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  HardDrive,
  PackagePlus,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { Button, Skeleton } from '@heroui/react';
import {
  SettingsComingSoonGrid,
  type SettingsComingSoonItem,
} from '@/components/settings/settings-coming-soon';
import { SettingsPanel } from '@/components/settings/settings-primitives';
import { ApiException } from '@/lib/api-client';
import { loadStorageUsageSummary } from '@/lib/storage-api';
import type { StorageUsageSummary } from '@/lib/storage-usage';

const STORAGE_OPTIONS: SettingsComingSoonItem[] = [
  {
    icon: TrendingUp,
    title: 'زيادة مساحة التخزين',
    description: 'ارفع الحد الأقصى لمساحتك الحالية دون تغيير باقتك.',
  },
  {
    icon: PackagePlus,
    title: 'شراء وحدات تخزين',
    description: 'اشتِر حزم إضافية (10 GB، 50 GB، 100 GB) تُضاف لحسابك فوراً.',
  },
  {
    icon: ShoppingBag,
    title: 'حزم تخزين شهرية',
    description: 'اشتراك مرن لمساحة إضافية يتجدد تلقائياً كل شهر.',
  },
];

function StorageExpansionOptions() {
  return (
    <div className="space-y-3 sm:space-y-3.5">
      <header className="px-0.5">
        <h3 className="text-[14px] font-semibold tracking-tight text-[var(--foreground)] sm:text-[15px]">
          توسيع المساحة
        </h3>
        <p className="mt-1 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          خيارات لزيادة التخزين وشراء وحدات إضافية — قيد الإطلاق قريباً.
        </p>
      </header>
      <SettingsComingSoonGrid items={STORAGE_OPTIONS} />
    </div>
  );
}

function StorageSkeleton() {
  return <Skeleton className="h-[7.75rem] rounded-2xl" />;
}

function StorageMetricCard({ storage }: { storage: StorageUsageSummary }) {
  return (
    <article className="dashboard-metric-tile flex min-h-[7.25rem] flex-col rounded-2xl p-4 sm:min-h-[7.75rem] sm:p-[1.125rem]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium leading-snug text-[var(--muted-foreground)]">
          مساحة التخزين
        </p>
        <HardDrive
          className="size-[18px] shrink-0 text-[var(--muted-foreground)]/75"
          strokeWidth={1.75}
          aria-hidden
        />
      </div>

      <p
        className="mt-3 text-[1.65rem] font-semibold leading-none tracking-tight tabular-nums text-[var(--foreground)] sm:text-[1.75rem]"
        dir="ltr"
        lang="en"
      >
        {storage.usedLabel}
      </p>

      <p className="mt-auto pt-3 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
        <span>
          من أصل{' '}
          <span className="font-medium text-[var(--foreground)]" dir="ltr" lang="en">
            {storage.limitLabel}
          </span>
        </span>
        <span aria-hidden> · </span>
        <span dir="ltr" lang="en" className="font-medium text-[var(--foreground)]">
          {storage.percentage}%
        </span>{' '}
        مستخدم
      </p>
    </article>
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
    <SettingsPanel
      title="مساحة التخزين"
      description="5 GB لكل مستخدم — أغلفة النماذج ومرفقات الاستجابات."
      plain
    >
      {loading && !storage ? (
        <StorageSkeleton />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {error ? (
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
            <StorageMetricCard storage={storage} />
          ) : null}

          <StorageExpansionOptions />
        </div>
      )}
    </SettingsPanel>
  );
}
