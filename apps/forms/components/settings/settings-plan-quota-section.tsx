'use client';

import { Gauge, Inbox, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePlanUsage } from '@/hooks/use-plan-usage';
import { planDisplayName } from '@/lib/api/subscriptions';
import { SettingsSectionCard } from '@/components/settings/settings-section-card';
import { formatNumber } from '@/lib/dashboard-format';
import { cn } from '@/lib/utils';

function QuotaCard({
  label,
  used,
  limit,
  icon: Icon,
  hint,
}: {
  label: string;
  used: number;
  limit: number;
  icon: LucideIcon;
  hint: string;
}) {
  const unlimited = !Number.isFinite(limit) || limit <= 0;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));

  return (
    <article className="dashboard-card flex min-h-[7.5rem] flex-col rounded-2xl p-3.5 sm:min-h-[8rem] sm:p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)] text-[var(--primary)] ring-1 ring-[var(--border)]/40">
          <Icon className="size-4" strokeWidth={1.85} />
        </div>
        <p className="min-w-0 flex-1 text-[12px] font-semibold leading-snug text-[var(--muted-foreground)]">
          {label}
        </p>
      </div>

      <div className="mt-auto pt-4">
        <p className="text-right text-[1.85rem] font-bold leading-none tracking-tight tabular-nums text-[var(--foreground)]">
          <span dir="ltr" lang="en">
            {formatNumber(used)}
            {!unlimited ? (
              <span className="text-[1rem] font-semibold text-[var(--muted-foreground)]">
                {' '}
                / {formatNumber(limit)}
              </span>
            ) : null}
          </span>
        </p>
        <p className="mt-1.5 text-right text-[11px] leading-relaxed text-[var(--muted-foreground)]/80">
          {unlimited ? 'غير محدود' : hint}
        </p>
        {!unlimited ? (
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                pct >= 90 ? 'bg-[var(--danger)]' : 'bg-[var(--primary)]/75',
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function SettingsPlanQuotaSection() {
  const { data, loading, error } = usePlanUsage();

  return (
    <SettingsSectionCard
      icon={Gauge}
      title="حصة الاشتراك"
      description={
        data
          ? `الباقة الحالية: ${planDisplayName(data.plan)}`
          : 'استخدامك الحالي ضمن حدود باقتك في Rukny.'
      }
    >
      {loading && !data ? (
        <p className="text-sm text-[var(--muted-foreground)]">جاري التحميل…</p>
      ) : error ? (
        <p className="text-sm text-[var(--danger)]">{error}</p>
      ) : data ? (
        <div className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:gap-3">
          <QuotaCard
            icon={FileText}
            label="النماذج"
            used={data.usage.forms.used}
            limit={data.usage.forms.limit}
            hint="ضمن حدود الباقة"
          />
          <QuotaCard
            icon={Inbox}
            label="استجابات هذا الشهر"
            used={data.usage.submissionsThisMonth.used}
            limit={data.usage.submissionsThisMonth.limit}
            hint="لهذا الشهر فقط"
          />
        </div>
      ) : null}
    </SettingsSectionCard>
  );
}
