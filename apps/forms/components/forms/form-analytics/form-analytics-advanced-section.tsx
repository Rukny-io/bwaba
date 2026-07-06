'use client';

import type { ReactNode } from 'react';
import { BarChart3, Gauge, MapPin, Route } from 'lucide-react';
import { DistributionBars } from '@/components/forms/submissions/submission-answer-display';
import { FormAnalyticsCompletionFunnel } from '@/components/forms/form-analytics/form-analytics-completion-funnel';
import { FormAnalyticsGeoSection } from '@/components/forms/form-analytics/form-analytics-geo-section';
import type { FormAnalyticsResponse } from '@/lib/forms-api';
import { DEMO_GEO_BREAKDOWN } from '@/lib/analytics-geo-demo';
import { formatNumber } from '@/lib/dashboard-format';
import { cn } from '@/lib/utils';

const DECORATIVE_TYPES = new Set([
  'HEADING',
  'PARAGRAPH',
  'DIVIDER',
  'TITLE',
  'LABEL',
  'IMAGE',
  'VIDEO',
  'AUDIO',
  'EMBED',
  'RECAPTCHA',
]);

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: typeof Route;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl sm:rounded-3xl',
        className,
      )}
    >
      <header className="border-b border-[var(--border)]/70 bg-[var(--surface-secondary)]/20 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--primary)] shadow-sm">
            <Icon className="size-4" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
              {title}
            </h4>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              {description}
            </p>
          </div>
        </div>
      </header>
      <div className="px-4 py-5 sm:px-5">{children}</div>
    </article>
  );
}

export function FormAnalyticsAdvancedSection({
  data,
  compact = false,
  demo = false,
}: {
  data: FormAnalyticsResponse;
  compact?: boolean;
  demo?: boolean;
}) {
  const inputFields = (data.fieldAnalytics || []).filter(
    (f) => !DECORATIVE_TYPES.has(f.fieldType),
  );
  const inputFieldIds = new Set(inputFields.map((f) => f.fieldId));
  const dropOffRows = (data.dropOffRate || []).filter((d) => inputFieldIds.has(d.fieldId));
  const fieldsWithStats = inputFields.filter(
    (f) => f.totalResponses > 0 && (f.topValues || []).length > 0,
  );
  const geoBreakdown = demo ? DEMO_GEO_BREAKDOWN : data.geoBreakdown;

  return (
    <section className="space-y-4">
      {!compact ? (
        <header>
          <h3 className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
            تحليلات متقدمة
          </h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
            مسار الإكمال، توزيع الإجابات، التوزيع الجغرافي، ومؤشرات الرضا
          </p>
        </header>
      ) : null}

      <SectionCard
        icon={Route}
        title="مسار الإكمال"
        description="تتبّع الانسحاب من الزيارة حتى الإرسال — سؤالاً بسؤال"
      >
        <FormAnalyticsCompletionFunnel
          summary={data.summary}
          dropOffRate={dropOffRows}
          demo={demo}
        />
      </SectionCard>

      <SectionCard
        icon={MapPin}
        title="التوزيع الجغرافي"
        description="خرائط تفاعلية وقوائم الدول والمدن والمحافظات"
      >
        {geoBreakdown ? (
          <FormAnalyticsGeoSection data={geoBreakdown} />
        ) : (
          <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/20 px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
            {demo
              ? 'معاينة الخريطة الجغرافية — متاحة بعد الترقية'
              : 'لا توجد بيانات جغرافية في هذه الفترة'}
          </p>
        )}
      </SectionCard>

      <SectionCard
        icon={BarChart3}
        title="تحليل إجابات الحقول"
        description="توزيع الإجابات الأكثر شيوعاً لكل حقل"
      >
        {fieldsWithStats.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {fieldsWithStats.slice(0, 8).map((field) => (
              <div
                key={field.fieldId}
                className="rounded-2xl border border-[var(--border)]/60 bg-[var(--surface-secondary)]/25 p-4"
              >
                <header className="mb-3 border-b border-[var(--border)]/50 pb-3">
                  <h5 className="text-sm font-semibold text-[var(--foreground)]">
                    {field.fieldLabel}
                  </h5>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                    {formatNumber(field.totalResponses)} إجابة ·{' '}
                    {field.responseRate}% معدل
                  </p>
                </header>
                <DistributionBars
                  items={field.topValues.map((tv) => ({
                    name: tv.value,
                    count: tv.count,
                    percentage:
                      field.totalResponses > 0
                        ? Math.round((tv.count / field.totalResponses) * 100)
                        : 0,
                  }))}
                  total={field.totalResponses}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/20 px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
            {demo
              ? 'معاينة توزيع الإجابات — متاحة بعد الترقية'
              : 'لا توجد إجابات كافية لعرض التوزيع بعد'}
          </p>
        )}
      </SectionCard>

      <SectionCard
        icon={Gauge}
        title="NPS — مؤشر الرضا"
        description="Net Promoter Score من حقول المقياس (0–10)"
      >
        {data.nps ? (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="text-center sm:text-start">
                <p className="text-xs text-[var(--muted-foreground)]">
                  {data.nps.fieldLabel}
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  {formatNumber(data.nps.responses)} إجابة
                </p>
              </div>
              <div className="flex flex-col items-center">
                <p
                  className={cn(
                    'text-4xl font-bold tabular-nums leading-none',
                    data.nps.score >= 50
                      ? 'text-[var(--success)]'
                      : data.nps.score >= 0
                        ? 'text-[var(--foreground)]'
                        : 'text-[var(--danger)]',
                  )}
                >
                  {data.nps.score > 0 ? '+' : ''}
                  {data.nps.score}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
                  NPS
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: 'مؤيدون',
                  value: data.nps.promoters,
                  tone: 'text-[var(--success)] bg-[var(--success)]/10',
                },
                {
                  label: 'محايدون',
                  value: data.nps.passives,
                  tone: 'text-[var(--foreground)] bg-[var(--surface-secondary)]',
                },
                {
                  label: 'منتقدون',
                  value: data.nps.detractors,
                  tone: 'text-[var(--danger)] bg-[var(--danger)]/10',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    'rounded-xl px-3 py-2.5 text-center',
                    item.tone,
                  )}
                >
                  <p className="text-lg font-bold tabular-nums">{item.value}</p>
                  <p className="text-[11px] font-medium">{item.label}</p>
                </div>
              ))}
            </div>

            <DistributionBars
              items={data.nps.distribution
                .filter((d) => d.count > 0)
                .map((d) => ({
                  name: String(d.value),
                  count: d.count,
                  percentage:
                    data.nps!.responses > 0
                      ? Math.round((d.count / data.nps!.responses) * 100)
                      : 0,
                }))}
              total={data.nps.responses}
            />
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/20 px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
            {demo
              ? 'معاينة NPS — أضف حقل مقياس (0–10) بعد الترقية'
              : 'أضف حقل مقياس (0–10) لتفعيل تحليل NPS'}
          </p>
        )}
      </SectionCard>
    </section>
  );
}
