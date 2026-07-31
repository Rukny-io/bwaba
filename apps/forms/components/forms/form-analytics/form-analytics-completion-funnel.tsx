'use client';

import {
  ArrowDown,
  CheckCircle2,
  Eye,
  FileInput,
  ListChecks,
  TrendingDown,
  type LucideIcon,
} from 'lucide-react';
import type {
  FormAnalyticsDropOff,
  FormAnalyticsSummary,
} from '@/lib/forms-api';
import { formatNumber, formatPercent } from '@/lib/dashboard-format';
import { cn } from '@/lib/utils';

interface FunnelStep {
  id: string;
  icon: LucideIcon;
  count: number;
  label: string;
  tone: 'default' | 'start' | 'complete';
}

interface FunnelConnector {
  id: string;
  dropOffPercent: number;
}

function calcDropOff(fromCount: number, toCount: number): number {
  if (fromCount <= 0) return 0;
  return Math.max(0, Math.round(((fromCount - toCount) / fromCount) * 100));
}

function buildFunnelSteps(
  summary: FormAnalyticsSummary,
  fieldRows: FormAnalyticsDropOff[],
): { steps: FunnelStep[]; connectors: FunnelConnector[] } {
  const steps: FunnelStep[] = [
    {
      id: 'visitors',
      icon: Eye,
      count: summary.totalViews,
      label: 'زائر النموذج',
      tone: 'default',
    },
    {
      id: 'started',
      icon: FileInput,
      count: summary.totalSubmissions,
      label: 'بدأ الإجابة',
      tone: 'start',
    },
    ...fieldRows.map((row) => ({
      id: row.fieldId,
      icon: ListChecks,
      count: row.answered,
      label: `${row.fieldOrder}. ${row.fieldLabel}`,
      tone: 'default' as const,
    })),
    {
      id: 'completed',
      icon: CheckCircle2,
      count: summary.totalSubmissions,
      label: 'إجابات مكتملة',
      tone: 'complete',
    },
  ];

  const connectors: FunnelConnector[] = [];
  for (let i = 0; i < steps.length - 1; i += 1) {
    const from = steps[i]!;
    const to = steps[i + 1]!;
    connectors.push({
      id: `connector-${from.id}-${to.id}`,
      dropOffPercent: calcDropOff(from.count, to.count),
    });
  }

  return { steps, connectors };
}

const DEMO_SUMMARY: FormAnalyticsSummary = {
  totalViews: 128,
  totalSubmissions: 42,
  completionRate: 33,
  avgTimeToComplete: 95,
  firstSubmission: null,
  lastSubmission: null,
};

const DEMO_DROP_OFF: FormAnalyticsDropOff[] = [
  {
    fieldId: 'demo-1',
    fieldLabel: 'ما اسمك؟',
    fieldOrder: 1,
    answered: 40,
    skipped: 2,
    responseRate: 95,
  },
  {
    fieldId: 'demo-2',
    fieldLabel: 'تقييمك للخدمة',
    fieldOrder: 2,
    answered: 35,
    skipped: 7,
    responseRate: 83,
  },
];

const BAR_TONE: Record<FunnelStep['tone'], string> = {
  default: 'bg-[var(--primary)]/55',
  start: 'bg-[var(--primary)]/75',
  complete: 'bg-[var(--success)]',
};

const ICON_TONE: Record<FunnelStep['tone'], string> = {
  default: 'bg-[var(--surface-secondary)] text-[var(--muted-foreground)]',
  start: 'bg-[var(--primary)]/12 text-[var(--primary)]',
  complete: 'bg-[var(--success)]/12 text-[var(--success)]',
};

function FunnelSummaryStrip({ summary }: { summary: FormAnalyticsSummary }) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[
        {
          label: 'المشاهدات',
          value: formatNumber(summary.totalViews),
          hint: 'زيارات النموذج',
        },
        {
          label: 'الاستجابات',
          value: formatNumber(summary.totalSubmissions),
          hint: 'إجابات مكتملة',
        },
        {
          label: 'معدل الإكمال',
          value: formatPercent(summary.completionRate),
          hint: 'استجابات ÷ مشاهدات',
          accent: true,
        },
      ].map((item) => (
        <div
          key={item.label}
          className={cn(
            'rounded-2xl px-4 py-3.5',
            item.accent
              ? 'bg-[var(--primary)]/8'
              : 'bg-[var(--surface-secondary)]/45',
          )}
        >
          <p className="text-[11px] font-medium text-[var(--muted-foreground)]">
            {item.label}
          </p>
          <p
            dir="ltr"
            lang="en"
            className={cn(
              'mt-1 text-2xl font-bold tabular-nums leading-none',
              item.accent
                ? 'text-[var(--primary)]'
                : 'text-[var(--foreground)]',
            )}
          >
            {item.value}
          </p>
          <p className="mt-1 text-[10px] text-[var(--muted-foreground)]">
            {item.hint}
          </p>
        </div>
      ))}
    </div>
  );
}

function FunnelStepBar({
  step,
  widthPct,
}: {
  step: FunnelStep;
  widthPct: number;
}) {
  const Icon = step.icon;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-xl',
            ICON_TONE[step.tone],
          )}
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-sm font-medium',
              step.tone === 'complete'
                ? 'text-[var(--success)]'
                : 'text-[var(--foreground)]',
            )}
          >
            {step.label}
          </p>
        </div>
        <p
          dir="ltr"
          lang="en"
          className="shrink-0 text-base font-bold tabular-nums text-[var(--foreground)]"
        >
          {formatNumber(step.count)}
        </p>
      </div>

      <div className="pe-1 ps-12">
        <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]/80">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500 ease-out',
              BAR_TONE[step.tone],
            )}
            style={{ width: `${Math.max(widthPct, step.count > 0 ? 4 : 0)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function FunnelDropOffBadge({ dropOffPercent }: { dropOffPercent: number }) {
  const hasDropOff = dropOffPercent > 0;

  return (
    <div className="flex items-center gap-2 py-1 ps-12">
      <ArrowDown
        className={cn(
          'size-3.5 shrink-0',
          hasDropOff
            ? 'text-[var(--danger)]/70'
            : 'text-[var(--muted-foreground)]/50',
        )}
        strokeWidth={2}
      />
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
          hasDropOff
            ? 'bg-[var(--danger)]/10 text-[var(--danger)]'
            : 'bg-[var(--surface-secondary)]/70 text-[var(--muted-foreground)]',
        )}
      >
        {hasDropOff ? (
          <TrendingDown className="size-3 shrink-0" />
        ) : null}
        <span dir="ltr" lang="en" className="tabular-nums">
          {hasDropOff ? `${dropOffPercent}%` : '0%'}
        </span>
        <span>{hasDropOff ? 'انسحاب' : 'بدون انسحاب'}</span>
      </span>
    </div>
  );
}

export function FormAnalyticsCompletionFunnel({
  summary,
  dropOffRate,
  demo = false,
  className,
}: {
  summary: FormAnalyticsSummary;
  dropOffRate: FormAnalyticsDropOff[];
  demo?: boolean;
  className?: string;
}) {
  const effectiveSummary = demo ? DEMO_SUMMARY : summary;
  const effectiveDropOff = demo ? DEMO_DROP_OFF : dropOffRate;
  const { steps, connectors } = buildFunnelSteps(
    effectiveSummary,
    effectiveDropOff,
  );

  const maxCount = Math.max(...steps.map((s) => s.count), 1);

  const hasRealData =
    !demo &&
    (summary.totalViews > 0 ||
      summary.totalSubmissions > 0 ||
      dropOffRate.length > 0);

  if (!demo && !hasRealData) {
    return (
      <div
        className={cn(
          'rounded-3xl bg-[var(--surface-secondary)]/35 px-6 py-12 text-center',
          className,
        )}
      >
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--surface-secondary)]">
          <Eye className="size-7 text-[var(--muted-foreground)]/70" />
        </div>
        <p className="text-sm font-medium text-[var(--foreground)]">
          لا توجد بيانات كافية بعد
        </p>
        <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-[var(--muted-foreground)]">
          شارك النموذج وانتظر الاستجابات لعرض مسار الإكمال
        </p>
      </div>
    );
  }

  return (
    <div className={cn('py-1', className)}>
      <FunnelSummaryStrip summary={effectiveSummary} />

      <div className="space-y-1">
        {steps.map((step, index) => {
          const widthPct = maxCount > 0 ? (step.count / maxCount) * 100 : 0;

          return (
            <div key={step.id}>
              <FunnelStepBar step={step} widthPct={widthPct} />
              {connectors[index] ? (
                <FunnelDropOffBadge
                  dropOffPercent={connectors[index]!.dropOffPercent}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
