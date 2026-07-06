'use client';

import { useMemo, useState } from 'react';
import { CountryFlag } from '@/components/analytics/country-flag';
import { AnalyticsGeoMap } from '@/components/analytics/analytics-geo-map';
import type { AnalyticsGeoBreakdown } from '@/lib/forms-api';
import { formatNumber } from '@/lib/dashboard-format';
import { pillTabClassName } from '@/components/ui/pill-tab';
import { cn } from '@/lib/utils';

type GeoMetric = 'views' | 'submissions';
type GeoListTab = 'countries' | 'cities' | 'governorates';

interface GeoListRow {
  key: string;
  label: string;
  sublabel?: string;
  countryCode?: string;
  value: number;
  max: number;
}

function buildListRows(
  data: AnalyticsGeoBreakdown,
  tab: GeoListTab,
  metric: GeoMetric,
  limit: number,
): GeoListRow[] {
  const pick = (row: { views: number; submissions: number }) =>
    metric === 'views' ? row.views : row.submissions;

  if (tab === 'countries') {
    const rows = [...data.countries]
      .map((row) => ({ row, value: pick(row) }))
      .filter(({ value }) => value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);

    const max = rows[0]?.value ?? 1;
    return rows.map(({ row, value }) => ({
      key: row.code,
      label: row.nameAr || row.name,
      countryCode: row.code,
      value,
      max,
    }));
  }

  if (tab === 'cities') {
    const cities = data.cities ?? [];
    const rows = [...cities]
      .map((row) => ({ row, value: pick(row) }))
      .filter(({ value }) => value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);

    const max = rows[0]?.value ?? 1;
    return rows.map(({ row, value }) => ({
      key: `${row.countryCode}-${row.name}`,
      label: row.name,
      sublabel: row.countryCode,
      countryCode: row.countryCode,
      value,
      max,
    }));
  }

  const rows = [...data.governorates]
    .map((row) => ({ row, value: pick(row) }))
    .filter(({ value }) => value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  const max = rows[0]?.value ?? 1;
  return rows.map(({ row, value }) => ({
    key: row.code,
    label: row.nameAr || row.name,
    sublabel: row.name,
    countryCode: 'IQ',
    value,
    max,
  }));
}

function GeoBreakdownList({
  rows,
  metric,
  emptyLabel,
}: {
  rows: GeoListRow[];
  metric: GeoMetric;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)]/20 px-4 py-10 text-center text-sm text-[var(--muted-foreground)]">
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((row, index) => {
        const pct = row.max > 0 ? Math.round((row.value / row.max) * 100) : 0;

        return (
          <li
            key={row.key}
            className="rounded-2xl border border-[var(--border)]/60 bg-[var(--surface-secondary)]/20 px-3.5 py-3 sm:px-4"
          >
            <div className="mb-2 flex items-center gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[11px] font-bold tabular-nums text-[var(--muted-foreground)]">
                {index + 1}
              </span>
              {row.countryCode && row.label !== 'Unknown' ? (
                <CountryFlag
                  code={row.countryCode}
                  title={row.countryCode}
                  className="shrink-0"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'truncate text-sm font-medium text-[var(--foreground)]',
                    row.label === 'Unknown' && 'text-[var(--muted-foreground)]',
                  )}
                >
                  {row.label}
                </p>
                {row.sublabel && row.sublabel !== row.label ? (
                  <p className="truncate text-[11px] text-[var(--muted-foreground)]">
                    {row.sublabel}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 text-end">
                <p
                  dir="ltr"
                  lang="en"
                  className="text-sm font-semibold tabular-nums text-[var(--foreground)]"
                >
                  {formatNumber(row.value)}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)]">
                  {metric === 'views' ? 'مشاهدة' : 'استجابة'}
                </p>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
              <div
                className="h-full rounded-full bg-[var(--primary)]/70 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const LIST_TAB_LABELS: Record<GeoListTab, string> = {
  countries: 'الدول',
  cities: 'المدن',
  governorates: 'المحافظات',
};

const LIST_EMPTY_LABELS: Record<GeoListTab, string> = {
  countries: 'لا توجد بيانات دول في هذه الفترة',
  cities: 'لا توجد بيانات مدن في هذه الفترة',
  governorates: 'لا توجد بيانات محافظات في هذه الفترة',
};

export function FormAnalyticsGeoSection({
  data,
  className,
}: {
  data: AnalyticsGeoBreakdown;
  className?: string;
}) {
  const [metric, setMetric] = useState<GeoMetric>('views');
  const [listTab, setListTab] = useState<GeoListTab>('governorates');

  const listRows = useMemo(
    () => buildListRows(data, listTab, metric, 8),
    [data, listTab, metric],
  );

  const hasGovernorateData = data.governorates.some(
    (g) => g.views > 0 || g.submissions > 0,
  );

  return (
    <div className={cn('space-y-5', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            className={pillTabClassName(metric === 'views')}
            onClick={() => setMetric('views')}
          >
            مشاهدات
          </button>
          <button
            type="button"
            className={pillTabClassName(metric === 'submissions')}
            onClick={() => setMetric('submissions')}
          >
            استجابات
          </button>
        </div>
      </div>

      <AnalyticsGeoMap
        data={data}
        showGovernorates
        defaultLevel="governorates"
        hideTitle
        hideMetricTabs
        metric={metric}
        mapHeight={360}
      />

      <div className="border-t border-[var(--border)]/70 pt-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h5 className="text-sm font-semibold text-[var(--foreground)]">
              التفصيل الجغرافي
            </h5>
            <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
              أبرز المناطق حسب {metric === 'views' ? 'المشاهدات' : 'الاستجابات'}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {(Object.keys(LIST_TAB_LABELS) as GeoListTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                className={pillTabClassName(listTab === tab)}
                onClick={() => setListTab(tab)}
              >
                {LIST_TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        {listTab === 'governorates' && !hasGovernorateData ? (
          <p className="mb-3 rounded-xl bg-[var(--surface-secondary)]/40 px-3 py-2 text-xs text-[var(--muted-foreground)]">
            المحافظات تظهر للزوار من العراق (IQ) عند توفر بيانات Cloudflare.
          </p>
        ) : null}

        <GeoBreakdownList
          rows={listRows}
          metric={metric}
          emptyLabel={LIST_EMPTY_LABELS[listTab]}
        />
      </div>
    </div>
  );
}
