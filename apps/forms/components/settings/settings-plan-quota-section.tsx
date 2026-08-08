'use client';

import { Inbox, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePlanUsage } from '@/hooks/use-plan-usage';
import { planDisplayName } from '@/lib/api/subscriptions';
import { SettingsPanel } from '@/components/settings/settings-primitives';
import { formatNumber } from '@/lib/dashboard-format';

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

  const valueNode = unlimited ? (
    <span dir="ltr" lang="en">
      {formatNumber(used)}
    </span>
  ) : (
    <span dir="ltr" lang="en">
      {formatNumber(used)}
      <span className="text-[1rem] font-medium text-[var(--muted-foreground)]">
        {' '}
        / {formatNumber(limit)}
      </span>
    </span>
  );

  const caption = unlimited ? 'غير محدود' : hint;

  return (
    <article className="dashboard-metric-tile flex min-h-[7.25rem] flex-col rounded-2xl p-4 sm:min-h-[7.75rem] sm:p-[1.125rem]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium leading-snug text-[var(--muted-foreground)]">
          {label}
        </p>
        <Icon
          className="size-[18px] shrink-0 text-[var(--muted-foreground)]/75"
          strokeWidth={1.75}
          aria-hidden
        />
      </div>

      <p className="mt-3 text-[1.65rem] font-semibold leading-none tracking-tight tabular-nums text-[var(--foreground)] sm:text-[1.75rem]">
        {valueNode}
      </p>

      <p className="mt-auto pt-3 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
        {caption}
      </p>
    </article>
  );
}

export function SettingsPlanQuotaSection() {
  const { data, loading, error } = usePlanUsage();

  return (
    <SettingsPanel
      title="حصة الاشتراك"
      description={
        data
          ? `الباقة الحالية: ${planDisplayName(data.plan)}`
          : 'استخدامك الحالي ضمن حدود باقتك في رُكنّي.'
      }
      plain
    >
      {loading && !data ? (
        <p className="text-sm text-[var(--muted-foreground)]">جاري التحميل…</p>
      ) : error ? (
        <p className="text-sm text-[var(--danger)]">{error}</p>
      ) : data ? (
        <div className="grid auto-rows-fr grid-cols-2 gap-3">
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
    </SettingsPanel>
  );
}
