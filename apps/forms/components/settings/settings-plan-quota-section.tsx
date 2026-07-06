'use client';

import { Gauge, Inbox, FileText } from 'lucide-react';
import { usePlanUsage } from '@/hooks/use-plan-usage';
import { planDisplayName } from '@/lib/api/subscriptions';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { formatNumber } from '@/lib/dashboard-format';
import { cn } from '@/lib/utils';

function QuotaRow({
  label,
  used,
  limit,
  icon: Icon,
}: {
  label: string;
  used: number;
  limit: number;
  icon: typeof FileText;
}) {
  const unlimited = !Number.isFinite(limit) || limit <= 0;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="rounded-2xl bg-[var(--surface-secondary)]/45 px-4 py-3.5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-[var(--primary)]" />
          <span className="text-sm font-medium text-[var(--foreground)]">
            {label}
          </span>
        </div>
        <span
          dir="ltr"
          lang="en"
          className="text-sm font-semibold tabular-nums text-[var(--foreground)]"
        >
          {formatNumber(used)}
          {!unlimited ? ` / ${formatNumber(limit)}` : ''}
        </span>
      </div>
      {!unlimited ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              pct >= 90 ? 'bg-[var(--danger)]' : 'bg-[var(--primary)]/70',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : (
        <p className="text-[11px] text-[var(--muted-foreground)]">غير محدود</p>
      )}
    </div>
  );
}

export function SettingsPlanQuotaSection() {
  const { data, loading, error } = usePlanUsage();

  return (
    <SettingsSectionCard
      icon={Gauge}
      title="حصة الاشتراك"
      description="استخدامك الحالي ضمن حدود باقتك في Rukny."
    >
      {loading && !data ? (
        <p className="text-sm text-[var(--muted-foreground)]">جاري التحميل…</p>
      ) : error ? (
        <p className="text-sm text-[var(--danger)]">{error}</p>
      ) : data ? (
        <div className="space-y-3">
          <p className="text-xs text-[var(--muted-foreground)]">
            الباقة الحالية:{' '}
            <span className="font-semibold text-[var(--foreground)]">
              {planDisplayName(data.plan)}
            </span>
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <QuotaRow
              icon={FileText}
              label="النماذج"
              used={data.usage.forms.used}
              limit={data.usage.forms.limit}
            />
            <QuotaRow
              icon={Inbox}
              label="استجابات هذا الشهر"
              used={data.usage.submissionsThisMonth.used}
              limit={data.usage.submissionsThisMonth.limit}
            />
          </div>
        </div>
      ) : null}
    </SettingsSectionCard>
  );
}
